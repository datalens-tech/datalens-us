const os = require('os');

/**
 * Calculate actual worker count from maxWorkers value
 * Supports both numeric values (e.g., "4") and percentage strings (e.g., "50%")
 * @param {string|number} maxWorkersValue - The maxWorkers value from env or config
 * @returns {number} - The actual number of workers to use
 */
function calculateWorkerCount(maxWorkersValue) {
    if (!maxWorkersValue) {
        // Default to 50% of CPU cores
        return Math.max(1, Math.floor(os.cpus().length * 0.5));
    }

    const value = String(maxWorkersValue).trim();

    if (value.endsWith('%')) {
        const percentage = parseFloat(value.slice(0, -1));
        if (isNaN(percentage) || percentage <= 0) {
            throw new Error(`Invalid percentage value: ${value}`);
        }
        const cpuCount = os.cpus().length;
        return Math.max(1, Math.floor(cpuCount * (percentage / 100)));
    }

    const numWorkers = parseInt(value, 10);
    if (isNaN(numWorkers) || numWorkers <= 0) {
        throw new Error(
            `Invalid maxWorkers value: ${value}. Must be a positive number or percentage.`,
        );
    }

    return numWorkers;
}

module.exports = calculateWorkerCount;
