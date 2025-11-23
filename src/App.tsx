import React, { useState, useMemo } from 'react';
import { runSimulation, SimulationMode, SimulationConfig } from './utils/simulation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './App.css';

function App() {
    const [config, setConfig] = useState<SimulationConfig>({
        startYear: 1995,
        endYear: 2025,
        initialCapital: 1000000,
        mode: SimulationMode.FixedReal,
        withdrawalAmount: 4000,
        withdrawalRate: 4,
    });

    const result = useMemo(() => {
        try {
            return runSimulation(config);
        } catch (e) {
            console.error(e);
            return null;
        }
    }, [config]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setConfig(prev => ({
            ...prev,
            [name]: name === 'mode' ? value : parseFloat(value)
        }));
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

    return (
        <div className="app-container">
            <header>
                <h1>Income Investing Simulator</h1>
                <p>Simulate S&P 500 withdrawal strategies (1995-Present)</p>
            </header>

            <main>
                <div className="controls">
                    <div className="control-group">
                        <label>Initial Capital</label>
                        <input type="number" name="initialCapital" value={config.initialCapital} onChange={handleInputChange} />
                    </div>

                    <div className="control-group">
                        <label>Start Year</label>
                        <input type="number" name="startYear" value={config.startYear} onChange={handleInputChange} min="1871" max="2024" />
                    </div>

                    <div className="control-group">
                        <label>End Year</label>
                        <input type="number" name="endYear" value={config.endYear} onChange={handleInputChange} min="1871" max="2025" />
                    </div>

                    <div className="control-group">
                        <label>Strategy</label>
                        <select name="mode" value={config.mode} onChange={handleInputChange}>
                            <option value={SimulationMode.FixedReal}>Fixed Amount (Inflation Adjusted)</option>
                            <option value={SimulationMode.FixedPercent}>Fixed Percentage</option>
                            <option value={SimulationMode.Maximize}>Maximize Safe Withdrawal</option>
                        </select>
                    </div>

                    {config.mode === SimulationMode.FixedReal && (
                        <div className="control-group">
                            <label>Monthly Withdrawal (Today's $)</label>
                            <input type="number" name="withdrawalAmount" value={config.withdrawalAmount} onChange={handleInputChange} />
                        </div>
                    )}

                    {config.mode === SimulationMode.FixedPercent && (
                        <div className="control-group">
                            <label>Annual Withdrawal Rate (%)</label>
                            <input type="number" name="withdrawalRate" value={config.withdrawalRate} onChange={handleInputChange} step="0.1" />
                        </div>
                    )}
                </div>

                {result && (
                    <div className="results">
                        <div className="summary-cards">
                            <div className={`card ${result.success ? 'success' : 'failure'}`}>
                                <h3>Final Balance</h3>
                                <p>{formatCurrency(result.finalBalance)}</p>
                            </div>
                            <div className="card">
                                <h3>Total Withdrawn</h3>
                                <p>{formatCurrency(result.totalWithdrawn)}</p>
                            </div>
                            <div className="card">
                                <h3>Max Drawdown</h3>
                                <p>{(result.maxDrawdown * 100).toFixed(2)}%</p>
                            </div>
                            {config.mode === SimulationMode.Maximize && (
                                <div className="card highlight">
                                    <h3>Max Safe Monthly</h3>
                                    <p>{formatCurrency(result.safeWithdrawalAmount || 0)}</p>
                                </div>
                            )}
                        </div>

                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={400}>
                                <LineChart data={result.history}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                                    <XAxis dataKey="date" minTickGap={50} stroke="#ccc" />
                                    <YAxis stroke="#ccc" tickFormatter={(val) => `$${val / 1000}k`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#333', border: 'none' }}
                                        formatter={(val: number) => formatCurrency(val)}
                                    />
                                    <Legend />
                                    <Line type="monotone" dataKey="balance" stroke="#8884d8" dot={false} name="Portfolio Balance" />
                                    <Line type="monotone" dataKey="withdrawal" stroke="#82ca9d" dot={false} name="Monthly Withdrawal" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </main>

            <footer>
                <p>Data Sources: Robert Shiller Online Data, Bureau of Labor Statistics (BLS), and public market data.</p>
                <p>Disclaimer: Past performance is not indicative of future results. This simulation is for educational purposes only and does not constitute financial advice.</p>
            </footer>
        </div>
    );
}

export default App;
