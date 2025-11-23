const fs = require('fs');
const https = require('https');
const path = require('path');

const url = 'https://raw.githubusercontent.com/datasets/s-and-p-500/master/data/data.csv';
const outputPath = path.join(__dirname, '../src/data/market_data.json');

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        const lines = data.split('\n');
        const headers = lines[0].split(',');

        const dateIdx = headers.indexOf('Date');
        const sp500Idx = headers.indexOf('SP500');
        const cpiIdx = headers.indexOf('Consumer Price Index');

        const result = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const parts = line.split(',');

            const date = parts[dateIdx];
            const sp500 = parseFloat(parts[sp500Idx]);
            const dividend = parseFloat(parts[headers.indexOf('Dividend')]);
            const cpi = parseFloat(parts[cpiIdx]);

            if (date >= '1995-01-01' && !isNaN(sp500) && !isNaN(cpi)) {
                result.push({ date, sp500, dividend, cpi });
            }
        }

        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
        console.log(`Saved ${result.length} records to ${outputPath}`);
    });
}).on('error', (err) => {
    console.error('Error fetching data:', err);
});
