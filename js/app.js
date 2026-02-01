// Main Application Logic

const App = {
    currentUniversalReading: null,

    /**
     * Initialize the application
     */
    async init() {
        try {
            // Initialize database
            await DB.init();
            console.log('App initialized successfully');

            // Register service worker
            this.registerServiceWorker();

            // Setup event listeners
            this.setupEventListeners();

            // Show PWA install prompt if applicable
            this.setupPWAInstall();

            // Load initial data
            await this.loadTenants();
            await this.loadReadingHistory();

            // Set default month input to current month
            document.getElementById('reading-month').value = Calculations.getCurrentMonthInput();

        } catch (error) {
            console.error('Failed to initialize app:', error);
            UI.showToast('فشل في تهيئة التطبيق', 'error');
        }
    },

    /**
     * Register service worker for PWA
     */
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js')
                .then(registration => {
                    console.log('Service Worker registered:', registration);

                    // Check for updates periodically
                    setInterval(() => {
                        registration.update();
                    }, 60000); // Check every minute

                    // Listen for service worker updates
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'activated' && navigator.serviceWorker.controller) {
                                // New service worker activated, show update notification
                                if (confirm('تحديث جديد متاح! هل تريد إعادة تحميل التطبيق؟')) {
                                    window.location.reload();
                                }
                            }
                        });
                    });
                })
                .catch(error => {
                    console.error('Service Worker registration failed:', error);
                });
        }
    },

    /**
     * Setup PWA install prompt
     */
    setupPWAInstall() {
        let deferredPrompt;

        const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                           window.navigator.standalone === true;

        // Don't show prompt if already installed
        if (isStandalone) {
            return;
        }

        // Chrome/Edge install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;

            // Show install prompt
            document.getElementById('install-prompt').classList.remove('hidden');
        });

        document.getElementById('install-btn').addEventListener('click', async () => {
            if (!deferredPrompt) return;

            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to install prompt: ${outcome}`);

            deferredPrompt = null;
            document.getElementById('install-prompt').classList.add('hidden');
        });

        document.getElementById('dismiss-install-btn').addEventListener('click', () => {
            document.getElementById('install-prompt').classList.add('hidden');
        });
    },

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Flow navigation (step buttons)
        document.querySelectorAll('.flow-step').forEach(btn => {
            btn.addEventListener('click', () => {
                UI.switchTab(btn.dataset.step);
                this.onTabSwitch(btn.dataset.step);
            });
        });

        // Navigation buttons (prev/next)
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetStep = btn.dataset.goto;
                if (targetStep) {
                    UI.switchTab(targetStep);
                    this.onTabSwitch(targetStep);
                }
            });
        });

        // History drawer
        document.getElementById('history-toggle').addEventListener('click', () => {
            this.loadReadingHistory();
            UI.showDrawer('history-drawer');
        });

        document.getElementById('close-history').addEventListener('click', () => {
            UI.hideDrawer('history-drawer');
        });

        // Close drawer on backdrop click
        document.querySelector('#history-drawer .drawer-backdrop').addEventListener('click', () => {
            UI.hideDrawer('history-drawer');
        });

        // Tenant modal
        document.getElementById('add-tenant-btn').addEventListener('click', () => this.showAddTenantModal());
        document.getElementById('cancel-tenant-btn').addEventListener('click', () => UI.hideModal('tenant-modal'));
        document.querySelector('#tenant-modal .modal-close').addEventListener('click', () => UI.hideModal('tenant-modal'));
        document.getElementById('tenant-form').addEventListener('submit', (e) => this.handleTenantFormSubmit(e));

        // Close modal on backdrop click
        document.querySelector('#tenant-modal .modal-backdrop').addEventListener('click', () => {
            UI.hideModal('tenant-modal');
        });

        // Universal reading form (Bills tab)
        document.getElementById('universal-reading-form').addEventListener('submit', (e) => this.handleUniversalReadingSubmit(e));
        document.getElementById('reading-month').addEventListener('change', (e) => this.handleMonthChange(e));

        // Bill period selector (Readings tab)
        document.getElementById('reading-bill-select').addEventListener('change', (e) => this.handleReadingBillSelect(e));

        // Tenant readings
        document.getElementById('save-tenant-readings-btn').addEventListener('click', () => this.handleSaveTenantReadings());

        // PDF generation
        document.getElementById('generate-all-pdfs-btn').addEventListener('click', () => this.handleGenerateAllPDFs());

        // History
        document.getElementById('export-data-btn').addEventListener('click', () => this.handleExportData());
    },

    /**
     * Handle tab switch
     */
    async onTabSwitch(stepName) {
        switch (stepName) {
            case 'tenants':
                await this.loadTenants();
                break;
            case 'bills':
                await this.loadBillsTab();
                break;
            case 'readings':
                await this.loadReadingsTab();
                break;
        }
    },

    /**
     * Load tenants list
     */
    async loadTenants() {
        try {
            const tenants = await DB.tenants.getAll();
            UI.renderTenantsList(tenants);
        } catch (error) {
            console.error('Error loading tenants:', error);
            UI.showToast('فشل في تحميل المستأجرين', 'error');
        }
    },

    /**
     * Show add tenant modal
     */
    showAddTenantModal() {
        document.getElementById('tenant-modal-title').textContent = 'إضافة مستأجر';
        document.getElementById('tenant-form').reset();
        document.getElementById('tenant-id').value = '';
        UI.showModal('tenant-modal');
    },

    /**
     * Edit tenant
     */
    async editTenant(tenantId) {
        try {
            const tenant = await DB.tenants.getById(tenantId);
            if (!tenant) {
                UI.showToast('المستأجر غير موجود', 'error');
                return;
            }

            document.getElementById('tenant-modal-title').textContent = 'تعديل المستأجر';
            document.getElementById('tenant-id').value = tenant.id;
            document.getElementById('tenant-name').value = tenant.name;
            document.getElementById('tenant-room').value = tenant.roomNumber;
            UI.showModal('tenant-modal');
        } catch (error) {
            console.error('Error loading tenant:', error);
            UI.showToast('فشل في تحميل بيانات المستأجر', 'error');
        }
    },

    /**
     * Toggle tenant active status
     */
    async toggleTenantActive(tenantId) {
        try {
            const isActive = await DB.tenants.toggleActive(tenantId);
            await this.loadTenants();
            UI.showToast(`تم ${isActive ? 'تفعيل' : 'إلغاء تفعيل'} المستأجر`, 'success');
        } catch (error) {
            console.error('Error toggling tenant status:', error);
            UI.showToast('فشل في تحديث حالة المستأجر', 'error');
        }
    },

    /**
     * Delete tenant
     */
    async deleteTenant(tenantId) {
        if (!UI.confirm('هل أنت متأكد من حذف هذا المستأجر؟ لا يمكن التراجع عن هذا الإجراء.')) {
            return;
        }

        try {
            await DB.tenants.delete(tenantId);
            await this.loadTenants();
            UI.showToast('تم حذف المستأجر بنجاح', 'success');
        } catch (error) {
            console.error('Error deleting tenant:', error);
            UI.showToast('فشل في حذف المستأجر', 'error');
        }
    },

    /**
     * Handle tenant form submit
     */
    async handleTenantFormSubmit(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const tenantId = formData.get('id');
        const tenant = {
            name: formData.get('name').trim(),
            roomNumber: formData.get('roomNumber').trim()
        };

        try {
            if (tenantId) {
                await DB.tenants.update(parseInt(tenantId), tenant);
            UI.showToast('تم تحديث المستأجر بنجاح', 'success');
            } else {
                await DB.tenants.add(tenant);
                UI.showToast('تم إضافة المستأجر بنجاح', 'success');
            }

            UI.hideModal('tenant-modal');
            await this.loadTenants();
        } catch (error) {
            console.error('Error saving tenant:', error);
            UI.showToast('فشل في حفظ المستأجر', 'error');
        }
    },

    /**
     * Handle month change in reading form
     */
    async handleMonthChange(e) {
        const monthInput = e.target.value;
        if (!monthInput) return;

        const monthYear = monthInput; // Already in YYYY-MM format
        const existing = await DB.universalReadings.getByMonthYear(monthYear);

        const infoBox = document.getElementById('previous-reading-info');
        const infoText = document.getElementById('previous-reading-text');

        if (existing) {
            infoText.textContent = `توجد قراءة لهذا الشهر بالفعل (${existing.meterReading} وحدة، ${Calculations.formatCurrency(existing.totalCost)}). يمكنك تحديثها.`;
            infoBox.classList.remove('hidden');
        } else {
            const previous = await DB.universalReadings.getLatest();
            if (previous) {
                infoText.textContent = `القراءة السابقة: ${previous.meterReading.toFixed(2)} وحدة (${Calculations.formatMonthYear(previous.date)})`;
                infoBox.classList.remove('hidden');
            } else {
                infoText.textContent = `ستكون هذه أول قراءة لك.`;
                infoBox.classList.remove('hidden');
            }
        }
    },

    /**
     * Handle universal reading form submit (Bills tab)
     */
    async handleUniversalReadingSubmit(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const monthInput = formData.get('month');
        const meterReading = parseFloat(formData.get('reading'));
        const totalCost = parseFloat(formData.get('cost'));

        if (!monthInput || isNaN(meterReading) || isNaN(totalCost)) {
            UI.showToast('يرجى ملء جميع الحقول بشكل صحيح', 'error');
            return;
        }

        try {
            UI.showLoading();

            const date = Calculations.parseMonthInput(monthInput);
            const monthYear = monthInput; // YYYY-MM format

            // Check if reading already exists for this month
            const existingReading = await DB.universalReadings.getByMonthYear(monthYear);
            if (existingReading) {
                UI.hideLoading();
                const shouldUpdate = UI.confirm(
                    `توجد فاتورة لـ ${Calculations.formatMonthYear(date)} بالفعل.\n\n` +
                    `الحالية: ${existingReading.meterReading} وحدة، ${Calculations.formatCurrency(existingReading.totalCost)}\n` +
                    `الجديدة: ${meterReading} وحدة، ${Calculations.formatCurrency(totalCost)}\n\n` +
                    `هل تريد تحديثها؟`
                );

                if (!shouldUpdate) {
                    return;
                }

                // Update existing reading
                UI.showLoading();
                await DB.universalReadings.update(existingReading.id, {
                    meterReading: meterReading,
                    totalCost: totalCost
                });
                UI.showToast('تم تحديث الفاتورة بنجاح', 'success');

                // Reset form and refresh bills list
                document.getElementById('universal-reading-form').reset();
                document.getElementById('reading-month').value = Calculations.getCurrentMonthInput();
                await this.loadBillsTab();
                await this.loadReadingHistory();
                UI.hideLoading();
                return;
            }

            const readingData = {
                date: date.getTime(),
                monthYear: monthYear,
                meterReading: meterReading,
                totalCost: totalCost
            };

            await DB.universalReadings.add(readingData);
            UI.showToast('تم حفظ الفاتورة بنجاح', 'success');

            // Reset form and refresh bills list
            document.getElementById('universal-reading-form').reset();
            document.getElementById('reading-month').value = Calculations.getCurrentMonthInput();
            await this.loadBillsTab();
            await this.loadReadingHistory();
        } catch (error) {
            console.error('Error saving bill:', error);
            UI.showToast('فشل في حفظ الفاتورة: ' + error.message, 'error');
        } finally {
            UI.hideLoading();
        }
    },

    /**
     * Show tenant readings section
     */
    async showTenantReadingsSection(universalReading) {
        console.log('showTenantReadingsSection called with:', universalReading);

        // Hide waiting state, show active section
        const waitingSection = document.getElementById('tenant-readings-waiting');
        const activeSection = document.getElementById('tenant-readings-section');

        if (waitingSection) {
            waitingSection.classList.add('hidden');
        }
        activeSection.classList.remove('hidden');

        try {
            const activeTenants = await DB.tenants.getActive();
            console.log('Active tenants retrieved:', activeTenants);
            await UI.renderTenantReadingInputs(activeTenants, universalReading);
        } catch (error) {
            console.error('Error in showTenantReadingsSection:', error);
        }
    },

    /**
     * Handle save tenant readings
     */
    async handleSaveTenantReadings() {
        if (!this.currentUniversalReading) {
            UI.showToast('يرجى اختيار فترة الفاتورة أولاً', 'error');
            return;
        }

        try {
            UI.showLoading();

            const inputs = document.querySelectorAll('.tenant-reading-input');
            const readings = [];

            // Collect all readings
            for (const input of inputs) {
                const tenantId = parseInt(input.dataset.tenantId);
                const meterReading = parseFloat(input.value);

                if (isNaN(meterReading)) {
                    UI.showToast('يرجى إدخال قراءات صحيحة لجميع المستأجرين', 'error');
                    UI.hideLoading();
                    return;
                }

                readings.push({
                    tenantId: tenantId,
                    universalReadingId: this.currentUniversalReading.id,
                    date: this.currentUniversalReading.date,
                    monthYear: this.currentUniversalReading.monthYear,
                    meterReading: meterReading
                });
            }

            // Check for existing readings and update or add accordingly
            const existingReadings = await DB.tenantReadings.getByMonthYear(this.currentUniversalReading.monthYear);
            const existingMap = new Map(existingReadings.map(r => [r.tenantId, r]));

            const savedReadingIds = [];
            for (const reading of readings) {
                const existing = existingMap.get(reading.tenantId);
                let id;

                if (existing) {
                    // Update existing reading
                    await DB.tenantReadings.update(existing.id, reading);
                    id = existing.id;
                } else {
                    // Add new reading
                    id = await DB.tenantReadings.add(reading);
                }
                savedReadingIds.push(id);
            }

            // Get all saved readings with consumption
            const savedReadings = await Promise.all(
                savedReadingIds.map(id => DB.tenantReadings.getById(id))
            );

            // Calculate proportional costs
            const readingsWithCosts = Calculations.calculateProportionalCosts(
                savedReadings,
                this.currentUniversalReading.totalCost
            );

            // Update each reading with calculated cost and proportion
            for (const reading of readingsWithCosts) {
                await DB.tenantReadings.updateCost(reading.id, reading.proportionalCost);
                // Store proportion for later use
                const fullReading = await DB.tenantReadings.getById(reading.id);
                fullReading.proportion = reading.proportion;
                await DB.tenantReadings.update(reading.id, fullReading);
            }

            UI.showToast('تم حساب الفواتير بنجاح!', 'success');

            // Get updated readings with tenant info for display
            const bills = await Promise.all(
                savedReadingIds.map(async (id) => {
                    const reading = await DB.tenantReadings.getById(id);
                    const tenant = await DB.tenants.getById(reading.tenantId);
                    return {
                        ...reading,
                        tenantName: tenant ? tenant.name : 'غير معروف',
                        roomNumber: tenant ? tenant.roomNumber : '-'
                    };
                })
            );

            // Show calculated bills
            UI.renderBillsSummary(bills);
            document.getElementById('bills-summary').classList.remove('hidden');
            this.currentBills = bills;
            this.currentUniversalReadingForBills = this.currentUniversalReading;

            // Update the bill selector to show new status
            await this.loadReadingsTab();
            // Re-select the current bill
            document.getElementById('reading-bill-select').value = this.currentUniversalReadingForBills.id;
            await this.handleReadingBillSelect({ target: { value: this.currentUniversalReadingForBills.id } });

            await this.loadReadingHistory();

        } catch (error) {
            console.error('Error saving tenant readings:', error);
            UI.showToast('فشل في حفظ القراءات: ' + error.message, 'error');
        } finally {
            UI.hideLoading();
        }
    },

    /**
     * Load bills tab (shows list of all bills with status)
     */
    async loadBillsTab() {
        try {
            const readings = await DB.universalReadings.getAll();

            // Get tenant reading counts for each bill to show completion status
            const billsWithStatus = await Promise.all(
                readings.map(async (reading) => {
                    const tenantReadings = await DB.tenantReadings.getByUniversalReadingId(reading.id);
                    const activeTenants = await DB.tenants.getActive();
                    return {
                        ...reading,
                        tenantReadingsCount: tenantReadings.length,
                        activeTenantCount: activeTenants.length,
                        hasReadings: tenantReadings.length > 0
                    };
                })
            );

            UI.renderBillsOverview(billsWithStatus);
        } catch (error) {
            console.error('Error loading bills tab:', error);
            UI.showToast('فشل في تحميل الفواتير', 'error');
        }
    },

    /**
     * Load readings tab (populate bill selector)
     */
    async loadReadingsTab() {
        try {
            const readings = await DB.universalReadings.getAll();

            // Get tenant reading counts for each bill
            const billsWithStatus = await Promise.all(
                readings.map(async (reading) => {
                    const tenantReadings = await DB.tenantReadings.getByUniversalReadingId(reading.id);
                    const activeTenants = await DB.tenants.getActive();
                    return {
                        ...reading,
                        tenantReadingsCount: tenantReadings.length,
                        activeTenantCount: activeTenants.length,
                        hasReadings: tenantReadings.length > 0
                    };
                })
            );

            UI.populateBillSelectForReadings(billsWithStatus);

            // Reset the readings section
            document.getElementById('tenant-readings-section').classList.add('hidden');
            document.getElementById('tenant-readings-waiting').classList.remove('hidden');
            document.getElementById('bills-summary').classList.add('hidden');
            document.getElementById('selected-bill-info').classList.add('hidden');
            document.getElementById('reading-bill-select').value = '';
            this.currentUniversalReading = null;
        } catch (error) {
            console.error('Error loading readings tab:', error);
            UI.showToast('فشل في تحميل القراءات', 'error');
        }
    },

    /**
     * Handle bill selection in readings tab
     */
    async handleReadingBillSelect(e) {
        const readingId = parseInt(e.target.value);

        // Hide everything if nothing selected
        if (!readingId) {
            document.getElementById('selected-bill-info').classList.add('hidden');
            document.getElementById('tenant-readings-section').classList.add('hidden');
            document.getElementById('tenant-readings-waiting').classList.remove('hidden');
            document.getElementById('bills-summary').classList.add('hidden');
            this.currentUniversalReading = null;
            return;
        }

        try {
            UI.showLoading();

            const universalReading = await DB.universalReadings.getById(readingId);
            this.currentUniversalReading = universalReading;

            // Show selected bill info
            document.getElementById('selected-bill-period').textContent = Calculations.formatMonthYear(universalReading.date);
            document.getElementById('selected-bill-cost').textContent = Calculations.formatCurrency(universalReading.totalCost);
            document.getElementById('selected-bill-reading').textContent = `${universalReading.meterReading.toFixed(2)} وحدة`;
            document.getElementById('selected-bill-info').classList.remove('hidden');

            // Check if tenant readings already exist for this period
            const existingReadings = await DB.tenantReadings.getByUniversalReadingId(readingId);

            if (existingReadings.length > 0) {
                // Show calculated bills if readings exist
                const bills = await Promise.all(
                    existingReadings.map(async (reading) => {
                        const tenant = await DB.tenants.getById(reading.tenantId);
                        return {
                            ...reading,
                            tenantName: tenant ? tenant.name : 'غير معروف',
                            roomNumber: tenant ? tenant.roomNumber : '-'
                        };
                    })
                );

                UI.renderBillsSummary(bills);
                document.getElementById('bills-summary').classList.remove('hidden');
                this.currentBills = bills;
                this.currentUniversalReadingForBills = universalReading;
            } else {
                document.getElementById('bills-summary').classList.add('hidden');
            }

            // Show tenant readings section
            await this.showTenantReadingsSection(universalReading);

        } catch (error) {
            console.error('Error loading bill for readings:', error);
            UI.showToast('فشل في تحميل الفاتورة', 'error');
        } finally {
            UI.hideLoading();
        }
    },

    /**
     * Handle generate all PDFs
     */
    async handleGenerateAllPDFs() {
        if (!this.currentBills || this.currentBills.length === 0) {
            UI.showToast('لا توجد فواتير للتوليد', 'error');
            return;
        }

        try {
            const billsData = this.currentBills.map(bill => {
                const tenant = { name: bill.tenantName, roomNumber: bill.roomNumber };
                return PDFGenerator.prepareBillData(tenant, bill, this.currentUniversalReadingForBills);
            });

            await PDFGenerator.downloadAllBills(billsData);
        } catch (error) {
            console.error('Error generating PDFs:', error);
            UI.showToast('فشل في توليد ملفات PDF', 'error');
        }
    },

    /**
     * Load reading history
     */
    async loadReadingHistory() {
        try {
            const readings = await DB.universalReadings.getAll();
            UI.renderHistory(readings);
        } catch (error) {
            console.error('Error loading history:', error);
            UI.showToast('فشل في تحميل السجل', 'error');
        }
    },

    /**
     * Handle export data
     */
    async handleExportData() {
        try {
            UI.showLoading();

            const data = await DB.utils.exportData();
            const json = JSON.stringify(data, null, 2);
            const filename = `electric-bills-export-${Date.now()}.json`;

            UI.downloadFile(filename, json);
            UI.showToast('تم تصدير البيانات بنجاح', 'success');
        } catch (error) {
            console.error('Error exporting data:', error);
            UI.showToast('فشل في تصدير البيانات', 'error');
        } finally {
            UI.hideLoading();
        }
    }
};

// Make App available globally for inline event handlers
window.App = App;

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}
