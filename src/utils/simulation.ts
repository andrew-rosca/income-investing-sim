import marketDataRaw from '../data/market_data.json';

export interface MarketData {
    date: string;
    sp500: number;
    dividend: number;
    cpi: number;
}

export const marketData: MarketData[] = marketDataRaw;

export enum SimulationMode {
    FixedReal = 'fixed_real',
    FixedPercent = 'fixed_percent',
    Maximize = 'maximize',
}

export interface SimulationConfig {
    startYear: number;
    endYear: number;
    initialCapital: number;
    mode: SimulationMode;
    withdrawalAmount?: number; // Monthly amount in TODAY's dollars (for FixedReal and Maximize)
    withdrawalRate?: number; // Annual percentage (for FixedPercent)
}

export interface MonthlyResult {
    date: string;
    balance: number;
    withdrawal: number;
    marketReturn: number;
    cpi: number;
}

export interface SimulationResult {
    history: MonthlyResult[];
    finalBalance: number;
    totalWithdrawn: number;
    success: boolean;
    maxDrawdown: number;
    safeWithdrawalAmount?: number; // For Maximize mode
}

export function runSimulation(config: SimulationConfig): SimulationResult {
    const startIndex = marketData.findIndex(d => d.date.startsWith(`${config.startYear}-`));

    // If endYear is in the future relative to data, we stop at data end.
    // The user requirement says "1995-2025", but data might stop early.
    // We'll just use what we have.
    let endIndex = marketData.findIndex(d => d.date.startsWith(`${config.endYear}-`));
    if (endIndex === -1) {
        // If not found (e.g. 2025 data not fully there), take the last available
        endIndex = marketData.length - 1;
    } else {
        // Include the whole year? Usually data is monthly.
        // If user says 2025, they probably mean through 2025.
        // We'll just go until the end of the available data if it matches the year, or find the last month of that year.
        // The findIndex finds the *first* month. We want the last month of that year.
        const lastMonthOfYearIndex = marketData.findIndex(d => d.date.startsWith(`${config.endYear + 1}-`));
        if (lastMonthOfYearIndex !== -1) {
            endIndex = lastMonthOfYearIndex - 1;
        } else {
            endIndex = marketData.length - 1;
        }
    }

    if (startIndex === -1) {
        throw new Error(`Start year ${config.startYear} not found in data.`);
    }

    const simData = marketData.slice(startIndex, endIndex + 1);

    if (config.mode === SimulationMode.Maximize) {
        return findMaxSafeWithdrawal(config, simData);
    }

    return calculateScenario(config, simData, config.withdrawalAmount || 0);
}

function calculateScenario(config: SimulationConfig, data: MarketData[], initialWithdrawalAmount: number): SimulationResult {
    let balance = config.initialCapital;
    let totalWithdrawn = 0;
    let peakBalance = balance;
    let maxDrawdown = 0;
    const history: MonthlyResult[] = [];
    let success = true;

    const lastCPI = marketData[marketData.length - 1].cpi;

    // Initial withdrawal amount is in TODAY's dollars.
    // For FixedReal, we need to convert this to the purchasing power at the START of the simulation.
    // Then, each month, we adjust it based on that month's CPI relative to the start CPI.
    // Formula: Withdrawal_t = (Amount_Today * (CPI_Start / CPI_Today)) * (CPI_t / CPI_Start)
    //                       = Amount_Today * (CPI_t / CPI_Today)
    // This is mathematically equivalent and simpler.

    for (let i = 0; i < data.length; i++) {
        const currentMonth = data[i];

        // 1. Calculate Withdrawal
        let monthlyWithdrawal = 0;
        if (config.mode === SimulationMode.FixedReal || config.mode === SimulationMode.Maximize) {
            monthlyWithdrawal = initialWithdrawalAmount * (currentMonth.cpi / lastCPI);
        } else if (config.mode === SimulationMode.FixedPercent) {
            monthlyWithdrawal = (balance * (config.withdrawalRate || 0) / 100) / 12;
        }

        // Ensure we don't withdraw more than balance
        if (monthlyWithdrawal > balance) {
            monthlyWithdrawal = balance;
            success = false; // Ran out of money
        }

        balance -= monthlyWithdrawal;
        totalWithdrawn += monthlyWithdrawal;

        // 2. Apply Market Return
        // We need the return for the *next* month (or current month's growth).
        // Shiller data is monthly average.
        // Return = (Price_{t+1} + Dividend_{t+1}/12) / Price_t - 1
        // We'll use the next month's price to calculate the return earned *during* this month.

        let marketReturn = 0;
        if (i < data.length - 1) {
            const nextMonth = data[i + 1];
            // Dividend is annualized, so divide by 12
            const dividendReturn = (nextMonth.dividend / 12) / currentMonth.sp500;
            const priceReturn = (nextMonth.sp500 - currentMonth.sp500) / currentMonth.sp500;
            marketReturn = priceReturn + dividendReturn;

            balance = balance * (1 + marketReturn);
        }

        // Track stats
        if (balance > peakBalance) peakBalance = balance;
        const drawdown = (peakBalance - balance) / peakBalance;
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;

        history.push({
            date: currentMonth.date,
            balance,
            withdrawal: monthlyWithdrawal,
            marketReturn,
            cpi: currentMonth.cpi
        });

        if (balance <= 0.01) { // Treat effectively 0 as 0
            balance = 0;
            success = false;
            // We can stop or continue with 0 balance. Let's continue to show flatline.
        }
    }

    return {
        history,
        finalBalance: balance,
        totalWithdrawn,
        success,
        maxDrawdown,
        safeWithdrawalAmount: config.mode === SimulationMode.Maximize ? initialWithdrawalAmount : undefined
    };
}

function findMaxSafeWithdrawal(config: SimulationConfig, data: MarketData[]): SimulationResult {
    // Binary search for the highest withdrawal amount (in Today's dollars) 
    // that keeps balance > 0 throughout.

    let low = 0;
    let high = config.initialCapital * 0.2; // Start with a reasonable upper bound (20% monthly is huge)
    // Actually, 20% of initial capital per month is insane. 
    // But "Amount" is absolute. 
    // Let's set high to Initial Capital (burn it all in 1 month).
    high = config.initialCapital;

    let bestResult: SimulationResult | null = null;

    // Precision: $1
    while (high - low > 1) {
        const mid = (low + high) / 2;
        const result = calculateScenario(config, data, mid);

        if (result.success) {
            bestResult = result;
            low = mid;
        } else {
            high = mid;
        }
    }

    // If we never found a success (unlikely with low=0), return the lowest failure or 0
    if (!bestResult) {
        return calculateScenario(config, data, 0);
    }

    return bestResult;
}
