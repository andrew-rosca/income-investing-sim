const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../src/data/market_data.json');
const existingData = require(dataPath);

// Last date in existing data was 2023-09-01.
// We need to add data from 2023-10-01 onwards.

const newData = [
    // 2023
    { date: "2023-10-01", sp500: 4193.80, dividend: 0, cpi: 307.671 },
    { date: "2023-11-01", sp500: 4567.80, dividend: 0, cpi: 307.051 },
    { date: "2023-12-01", sp500: 4769.83, dividend: 0, cpi: 306.746 },
    // 2024
    { date: "2024-01-01", sp500: 4845.65, dividend: 0, cpi: 308.417 },
    { date: "2024-02-01", sp500: 5096.27, dividend: 0, cpi: 310.326 },
    { date: "2024-03-01", sp500: 5254.35, dividend: 0, cpi: 312.332 },
    { date: "2024-04-01", sp500: 5035.69, dividend: 0, cpi: 313.548 },
    { date: "2024-05-01", sp500: 5277.51, dividend: 0, cpi: 314.069 },
    { date: "2024-06-01", sp500: 5460.48, dividend: 0, cpi: 314.175 },
    { date: "2024-07-01", sp500: 5522.30, dividend: 0, cpi: 314.540 },
    { date: "2024-08-01", sp500: 5648.40, dividend: 0, cpi: 314.796 },
    { date: "2024-09-01", sp500: 5762.48, dividend: 0, cpi: 315.301 },
    { date: "2024-10-01", sp500: 5705.45, dividend: 0, cpi: 315.664 },
    { date: "2024-11-01", sp500: 6032.38, dividend: 0, cpi: 315.493 },
    { date: "2024-12-01", sp500: 5881.63, dividend: 0, cpi: 315.605 },
    // 2025
    { date: "2025-01-01", sp500: 6040.53, dividend: 0, cpi: 317.671 },
    { date: "2025-02-01", sp500: 5954.50, dividend: 0, cpi: 319.082 },
    { date: "2025-03-01", sp500: 5611.85, dividend: 0, cpi: 319.799 },
    { date: "2025-04-01", sp500: 5569.06, dividend: 0, cpi: 320.795 },
    { date: "2025-05-01", sp500: 5911.69, dividend: 0, cpi: 321.465 },
    { date: "2025-06-01", sp500: 6204.95, dividend: 0, cpi: 322.561 },
    { date: "2025-07-01", sp500: 6339.39, dividend: 0, cpi: 323.048 },
    { date: "2025-08-01", sp500: 6460.26, dividend: 0, cpi: 323.976 },
    { date: "2025-09-01", sp500: 6688.46, dividend: 0, cpi: 324.800 },
    { date: "2025-10-01", sp500: 6840.20, dividend: 0, cpi: 325.0 }, // Estimated CPI
];

// Note: Dividends are set to 0 as specific monthly dividend data was not in the summary.
// For a more accurate simulation, we could estimate a yield (e.g. ~1.5% annual).
// Let's estimate monthly dividend as Price * (1.5% / 12).
newData.forEach(d => {
    d.dividend = d.sp500 * (0.015 / 12) * 12; // Annualized dividend amount ~ 1.5% yield
});

// Filter out any overlaps just in case
const filteredExisting = existingData.filter(d => d.date < "2023-10-01");
const combinedData = [...filteredExisting, ...newData];

fs.writeFileSync(dataPath, JSON.stringify(combinedData, null, 2));
console.log(`Updated data. Total records: ${combinedData.length}`);
