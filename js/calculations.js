// Bill Calculation Engine

const Calculations = {
    /**
     * Calculate proportional costs for all tenants based on their consumption
     * @param {Array} tenantReadings - Array of tenant reading objects with unitsConsumed
     * @param {number} totalCost - Total universal bill cost
     * @returns {Array} Array of tenant readings with calculated proportional costs
     */
    calculateProportionalCosts(tenantReadings, totalCost) {
        // Calculate total units consumed by all tenants
        const totalTenantUnits = tenantReadings.reduce((sum, reading) => {
            return sum + (reading.unitsConsumed || 0);
        }, 0);

        // Handle case where no units consumed
        if (totalTenantUnits === 0) {
            return tenantReadings.map(reading => ({
                ...reading,
                proportionalCost: 0,
                proportion: 0
            }));
        }

        // Calculate proportional cost for each tenant
        return tenantReadings.map(reading => {
            const proportion = reading.unitsConsumed / totalTenantUnits;
            const proportionalCost = proportion * totalCost;

            return {
                ...reading,
                proportion: proportion,
                proportionalCost: proportionalCost
            };
        });
    },

    /**
     * Calculate cost per unit
     * @param {number} totalCost - Total bill cost
     * @param {number} unitsConsumed - Total units consumed
     * @returns {number} Cost per unit
     */
    calculateCostPerUnit(totalCost, unitsConsumed) {
        if (unitsConsumed === 0) return 0;
        return totalCost / unitsConsumed;
    },

    /**
     * Format currency value
     * @param {number} amount - Amount to format
     * @returns {string} Formatted currency string
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('ar-OM', {
            style: 'currency',
            currency: 'OMR',
            minimumFractionDigits: 3,
            maximumFractionDigits: 3
        }).format(amount);
    },

    /**
     * Format number with decimals
     * @param {number} value - Value to format
     * @param {number} decimals - Number of decimal places
     * @returns {string} Formatted number
     */
    formatNumber(value, decimals = 2) {
        return parseFloat(value).toFixed(decimals);
    },

    /**
     * Format percentage
     * @param {number} value - Value between 0 and 1
     * @returns {string} Formatted percentage string
     */
    formatPercentage(value) {
        return `${(value * 100).toFixed(1)}%`;
    },

    /**
     * Calculate consumption from current and previous readings
     * @param {number} currentReading - Current meter reading
     * @param {number} previousReading - Previous meter reading
     * @returns {number} Units consumed
     */
    calculateConsumption(currentReading, previousReading) {
        return Math.max(0, currentReading - previousReading);
    },

    /**
     * Validate that current reading is greater than previous
     * @param {number} currentReading - Current meter reading
     * @param {number} previousReading - Previous meter reading
     * @returns {boolean} True if valid
     */
    validateReading(currentReading, previousReading) {
        return currentReading >= previousReading;
    },

    /**
     * Calculate summary statistics for a billing period
     * @param {object} universalReading - Universal reading object
     * @param {Array} tenantReadings - Array of tenant readings
     * @returns {object} Summary statistics
     */
    calculateSummary(universalReading, tenantReadings) {
        const totalTenantUnits = tenantReadings.reduce((sum, r) => sum + r.unitsConsumed, 0);
        const totalTenantCost = tenantReadings.reduce((sum, r) => sum + r.proportionalCost, 0);

        const universalUnits = universalReading.unitsConsumed || 0;
        const commonAreaUnits = Math.max(0, universalUnits - totalTenantUnits);
        const costPerUnit = this.calculateCostPerUnit(universalReading.totalCost, universalUnits);

        return {
            universalReading: {
                reading: universalReading.meterReading,
                previousReading: universalReading.previousReading,
                unitsConsumed: universalUnits,
                totalCost: universalReading.totalCost,
                costPerUnit: costPerUnit
            },
            tenantSummary: {
                totalUnits: totalTenantUnits,
                totalCost: totalTenantCost,
                tenantCount: tenantReadings.length
            },
            commonArea: {
                units: commonAreaUnits,
                percentage: universalUnits > 0 ? (commonAreaUnits / universalUnits) : 0
            },
            hasDiscrepancy: Math.abs(totalTenantUnits - universalUnits) > 0.1
        };
    },

    /**
     * Format date to month/year string
     * @param {Date|string} date - Date object or ISO string
     * @returns {string} Formatted date (e.g., "يناير 2026")
     */
    formatMonthYear(date) {
        const d = new Date(date);
        return d.toLocaleDateString('ar-OM', { year: 'numeric', month: 'long', numberingSystem: 'latn' });
    },

    /**
     * Get month-year key for indexing (e.g., "2026-01")
     * @param {Date|string} date - Date object or ISO string
     * @returns {string} Month-year key
     */
    getMonthYearKey(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    },

    /**
     * Parse month input value (YYYY-MM) to Date
     * @param {string} monthInput - Month input value (e.g., "2026-01")
     * @returns {Date} Date object set to first of month
     */
    parseMonthInput(monthInput) {
        const [year, month] = monthInput.split('-');
        return new Date(parseInt(year), parseInt(month) - 1, 1);
    },

    /**
     * Get current month in YYYY-MM format for month input
     * @returns {string} Current month in YYYY-MM format
     */
    getCurrentMonthInput() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    },

    /**
     * Check if a reading exists for a specific month
     * @param {Array} readings - Array of readings
     * @param {string} monthYear - Month-year key
     * @returns {boolean} True if reading exists
     */
    hasReadingForMonth(readings, monthYear) {
        return readings.some(r => r.monthYear === monthYear);
    }
};

// Export to global scope
window.Calculations = Calculations;
