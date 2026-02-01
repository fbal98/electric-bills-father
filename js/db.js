// Database Manager for Electric Bills App
// Using idb library for cleaner IndexedDB API

const DB_NAME = 'ElectricBillsDB';
const DB_VERSION = 1;

// Database instance
let db;

// Initialize the database
async function initDB() {
    try {
        db = await idb.openDB(DB_NAME, DB_VERSION, {
            upgrade(db, oldVersion, newVersion, transaction) {
                console.log('Upgrading database from version', oldVersion, 'to', newVersion);

                // Create Tenants object store
                if (!db.objectStoreNames.contains('tenants')) {
                    const tenantStore = db.createObjectStore('tenants', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    tenantStore.createIndex('roomNumber', 'roomNumber', { unique: false });
                    tenantStore.createIndex('isActive', 'isActive', { unique: false });
                    console.log('Created tenants store');
                }

                // Create UniversalReadings object store
                if (!db.objectStoreNames.contains('universalReadings')) {
                    const universalStore = db.createObjectStore('universalReadings', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    universalStore.createIndex('date', 'date', { unique: false });
                    universalStore.createIndex('monthYear', 'monthYear', { unique: true });
                    console.log('Created universalReadings store');
                }

                // Create TenantReadings object store
                if (!db.objectStoreNames.contains('tenantReadings')) {
                    const tenantReadingStore = db.createObjectStore('tenantReadings', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    tenantReadingStore.createIndex('tenantId', 'tenantId', { unique: false });
                    tenantReadingStore.createIndex('universalReadingId', 'universalReadingId', { unique: false });
                    tenantReadingStore.createIndex('date', 'date', { unique: false });
                    tenantReadingStore.createIndex('tenantMonth', ['tenantId', 'monthYear'], { unique: true });
                    console.log('Created tenantReadings store');
                }
            }
        });
        console.log('Database initialized successfully');
        return db;
    } catch (error) {
        console.error('Failed to initialize database:', error);
        throw error;
    }
}

// Tenant Operations
const TenantDB = {
    async add(tenant) {
        const tx = db.transaction('tenants', 'readwrite');
        const store = tx.objectStore('tenants');
        const id = await store.add({
            name: tenant.name,
            roomNumber: tenant.roomNumber,
            isActive: true,
            createdAt: Date.now()
        });
        await tx.done;
        return id;
    },

    async update(id, tenant) {
        const tx = db.transaction('tenants', 'readwrite');
        const store = tx.objectStore('tenants');
        const existing = await store.get(id);
        if (!existing) {
            throw new Error('Tenant not found');
        }
        await store.put({
            ...existing,
            ...tenant,
            id
        });
        await tx.done;
        return true;
    },

    async delete(id) {
        const tx = db.transaction('tenants', 'readwrite');
        await tx.objectStore('tenants').delete(id);
        await tx.done;
        return true;
    },

    async toggleActive(id) {
        const tx = db.transaction('tenants', 'readwrite');
        const store = tx.objectStore('tenants');
        const tenant = await store.get(id);
        if (!tenant) {
            throw new Error('Tenant not found');
        }
        tenant.isActive = !tenant.isActive;
        await store.put(tenant);
        await tx.done;
        return tenant.isActive;
    },

    async getById(id) {
        return await db.get('tenants', id);
    },

    async getAll() {
        return await db.getAll('tenants');
    },

    async getActive() {
        const allTenants = await db.getAll('tenants');
        const active = allTenants.filter(t => t.isActive === true);
        console.log('getActive: all tenants:', allTenants, 'active:', active);
        return active;
    }
};

// Universal Reading Operations
const UniversalReadingDB = {
    async add(reading) {
        // Get previous reading BEFORE starting the write transaction
        const allReadings = await this.getAll();
        const previousReading = allReadings.length > 0
            ? allReadings.sort((a, b) => b.date - a.date)[0]
            : null;

        const previousMeterReading = previousReading ? previousReading.meterReading : 0;
        const unitsConsumed = reading.meterReading - previousMeterReading;

        // Now start the write transaction
        const tx = db.transaction('universalReadings', 'readwrite');
        const store = tx.objectStore('universalReadings');

        const id = await store.add({
            date: reading.date,
            monthYear: reading.monthYear,
            meterReading: parseFloat(reading.meterReading),
            totalCost: parseFloat(reading.totalCost),
            previousReading: previousMeterReading,
            unitsConsumed: unitsConsumed,
            createdAt: Date.now()
        });
        await tx.done;
        return id;
    },

    async update(id, reading) {
        const tx = db.transaction('universalReadings', 'readwrite');
        const store = tx.objectStore('universalReadings');
        const existing = await store.get(id);
        if (!existing) {
            throw new Error('Reading not found');
        }

        // Recalculate consumption
        const unitsConsumed = reading.meterReading - existing.previousReading;

        await store.put({
            ...existing,
            meterReading: parseFloat(reading.meterReading),
            totalCost: parseFloat(reading.totalCost),
            unitsConsumed: unitsConsumed,
            id
        });
        await tx.done;
        return true;
    },

    async delete(id) {
        const tx = db.transaction('universalReadings', 'readwrite');
        await tx.objectStore('universalReadings').delete(id);
        await tx.done;
        return true;
    },

    async getById(id) {
        return await db.get('universalReadings', id);
    },

    async getByMonthYear(monthYear) {
        const tx = db.transaction('universalReadings', 'readonly');
        const store = tx.objectStore('universalReadings');
        const index = store.index('monthYear');
        return await index.get(monthYear);
    },

    async getAll() {
        const readings = await db.getAll('universalReadings');
        return readings.sort((a, b) => b.date - a.date);
    },

    async getLatest() {
        const readings = await this.getAll();
        return readings.length > 0 ? readings[0] : null;
    }
};

// Tenant Reading Operations
const TenantReadingDB = {
    async add(reading) {
        // Get previous reading for the same tenant BEFORE starting write transaction
        const previousReadings = await this.getByTenantId(reading.tenantId);
        const previousReading = previousReadings.length > 0
            ? previousReadings.sort((a, b) => b.date - a.date)[0]
            : null;

        const previousMeterReading = previousReading ? previousReading.meterReading : 0;
        const unitsConsumed = reading.meterReading - previousMeterReading;

        // Now start the write transaction
        const tx = db.transaction('tenantReadings', 'readwrite');
        const store = tx.objectStore('tenantReadings');

        const id = await store.add({
            tenantId: reading.tenantId,
            universalReadingId: reading.universalReadingId,
            date: reading.date,
            monthYear: reading.monthYear,
            meterReading: parseFloat(reading.meterReading),
            previousReading: previousMeterReading,
            unitsConsumed: Math.max(0, unitsConsumed), // Ensure non-negative
            proportionalCost: 0, // Will be calculated
            createdAt: Date.now()
        });
        await tx.done;
        return id;
    },

    async updateCost(id, cost) {
        const tx = db.transaction('tenantReadings', 'readwrite');
        const store = tx.objectStore('tenantReadings');
        const reading = await store.get(id);
        if (!reading) {
            throw new Error('Tenant reading not found');
        }
        reading.proportionalCost = parseFloat(cost);
        await store.put(reading);
        await tx.done;
        return true;
    },

    async update(id, reading) {
        const tx = db.transaction('tenantReadings', 'readwrite');
        const store = tx.objectStore('tenantReadings');
        const existing = await store.get(id);
        if (!existing) {
            throw new Error('Reading not found');
        }

        // Recalculate consumption
        const unitsConsumed = reading.meterReading - existing.previousReading;

        await store.put({
            ...existing,
            meterReading: parseFloat(reading.meterReading),
            unitsConsumed: Math.max(0, unitsConsumed),
            id
        });
        await tx.done;
        return true;
    },

    async delete(id) {
        const tx = db.transaction('tenantReadings', 'readwrite');
        await tx.objectStore('tenantReadings').delete(id);
        await tx.done;
        return true;
    },

    async getById(id) {
        return await db.get('tenantReadings', id);
    },

    async getByTenantId(tenantId) {
        const tx = db.transaction('tenantReadings', 'readonly');
        const store = tx.objectStore('tenantReadings');
        const index = store.index('tenantId');
        const readings = await index.getAll(tenantId);
        return readings.sort((a, b) => b.date - a.date);
    },

    async getByUniversalReadingId(universalReadingId) {
        const tx = db.transaction('tenantReadings', 'readonly');
        const store = tx.objectStore('tenantReadings');
        const index = store.index('universalReadingId');
        return await index.getAll(universalReadingId);
    },

    async getByMonthYear(monthYear) {
        const tx = db.transaction('tenantReadings', 'readonly');
        const store = tx.objectStore('tenantReadings');
        const allReadings = await store.getAll();
        return allReadings.filter(r => r.monthYear === monthYear);
    },

    async getAll() {
        const readings = await db.getAll('tenantReadings');
        return readings.sort((a, b) => b.date - a.date);
    }
};

// Bulk operations and utilities
const DatabaseUtils = {
    async exportData() {
        const [tenants, universalReadings, tenantReadings] = await Promise.all([
            TenantDB.getAll(),
            UniversalReadingDB.getAll(),
            TenantReadingDB.getAll()
        ]);

        return {
            version: DB_VERSION,
            exportDate: new Date().toISOString(),
            data: {
                tenants,
                universalReadings,
                tenantReadings
            }
        };
    },

    async importData(data) {
        // This is a basic import - in production, you'd want more validation
        const tx = db.transaction(['tenants', 'universalReadings', 'tenantReadings'], 'readwrite');

        // Clear existing data
        await Promise.all([
            tx.objectStore('tenants').clear(),
            tx.objectStore('universalReadings').clear(),
            tx.objectStore('tenantReadings').clear()
        ]);

        // Import new data
        if (data.data.tenants) {
            for (const tenant of data.data.tenants) {
                await tx.objectStore('tenants').add(tenant);
            }
        }
        if (data.data.universalReadings) {
            for (const reading of data.data.universalReadings) {
                await tx.objectStore('universalReadings').add(reading);
            }
        }
        if (data.data.tenantReadings) {
            for (const reading of data.data.tenantReadings) {
                await tx.objectStore('tenantReadings').add(reading);
            }
        }

        await tx.done;
        return true;
    },

    async clearAllData() {
        const tx = db.transaction(['tenants', 'universalReadings', 'tenantReadings'], 'readwrite');
        await Promise.all([
            tx.objectStore('tenants').clear(),
            tx.objectStore('universalReadings').clear(),
            tx.objectStore('tenantReadings').clear()
        ]);
        await tx.done;
        return true;
    }
};

// Export the API
window.DB = {
    init: initDB,
    tenants: TenantDB,
    universalReadings: UniversalReadingDB,
    tenantReadings: TenantReadingDB,
    utils: DatabaseUtils
};
