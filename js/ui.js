// UI Helper Functions

const UI = {
    /**
     * Show toast notification
     * @param {string} message - Message to display
     * @param {string} type - Toast type: 'success', 'error', or 'info'
     * @param {number} duration - Duration in milliseconds
     */
    showToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = document.documentElement.dir === 'rtl' ? 'translateX(-100%)' : 'translateX(100%)';
            setTimeout(() => container.removeChild(toast), 300);
        }, duration);
    },

    /**
     * Show loading overlay
     */
    showLoading() {
        document.getElementById('loading-overlay').classList.remove('hidden');
    },

    /**
     * Hide loading overlay
     */
    hideLoading() {
        document.getElementById('loading-overlay').classList.add('hidden');
    },

    /**
     * Show modal
     * @param {string} modalId - ID of the modal element
     */
    showModal(modalId) {
        document.getElementById(modalId).classList.remove('hidden');
    },

    /**
     * Hide modal
     * @param {string} modalId - ID of the modal element
     */
    hideModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
    },

    /**
     * Show drawer
     * @param {string} drawerId - ID of the drawer element
     */
    showDrawer(drawerId) {
        document.getElementById(drawerId).classList.remove('hidden');
    },

    /**
     * Hide drawer
     * @param {string} drawerId - ID of the drawer element
     */
    hideDrawer(drawerId) {
        document.getElementById(drawerId).classList.add('hidden');
    },

    /**
     * Confirm action with user
     * @param {string} message - Confirmation message
     * @returns {boolean} True if confirmed
     */
    confirm(message) {
        return window.confirm(message);
    },

    /**
     * Switch to a specific step
     * @param {string} stepName - Name of the step to switch to
     */
    switchTab(stepName) {
        // Update flow nav buttons
        document.querySelectorAll('.flow-step').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.step === stepName) {
                btn.classList.add('active');
            }
        });

        // Update step content
        document.querySelectorAll('.step-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${stepName}-step`).classList.add('active');
    },

    /**
     * Get initials from name
     * @param {string} name - Full name
     * @returns {string} Initials (max 2 characters)
     */
    getInitials(name) {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    },

    /**
     * Render tenants list
     * @param {Array} tenants - Array of tenant objects
     */
    renderTenantsList(tenants) {
        const container = document.getElementById('tenants-list');

        if (tenants.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                    </div>
                    <h4>لا يوجد مستأجرون بعد</h4>
                    <p>أضف أول مستأجر للبدء</p>
                </div>
            `;
            return;
        }

        container.innerHTML = tenants.map(tenant => `
            <div class="tenant-card ${tenant.isActive ? '' : 'inactive'}" data-tenant-id="${tenant.id}">
                <div class="tenant-info">
                    <div class="tenant-avatar">${this.getInitials(tenant.name)}</div>
                    <div class="tenant-details">
                        <h4>${this.escapeHtml(tenant.name)}</h4>
                        <p>الغرفة ${this.escapeHtml(tenant.roomNumber)} ${tenant.isActive ? '' : '(غير نشط)'}</p>
                    </div>
                </div>
                <div class="tenant-actions">
                    <button class="tenant-action-btn edit-tenant-btn" data-tenant-id="${tenant.id}" title="تعديل">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button class="tenant-action-btn toggle-tenant-btn" data-tenant-id="${tenant.id}" title="${tenant.isActive ? 'إلغاء التفعيل' : 'تفعيل'}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            ${tenant.isActive
                                ? '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'
                                : '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'
                            }
                        </svg>
                    </button>
                    <button class="tenant-action-btn delete-tenant-btn danger" data-tenant-id="${tenant.id}" title="حذف">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3,6 5,6 21,6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            <line x1="10" y1="11" x2="10" y2="17"/>
                            <line x1="14" y1="11" x2="14" y2="17"/>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');

        // Use event delegation to handle button clicks
        this.attachTenantCardEventListeners();
    },

    /**
     * Render tenant reading inputs
     * @param {Array} tenants - Array of active tenant objects
     * @param {object} universalReading - Universal reading object
     */
    async renderTenantReadingInputs(tenants, universalReading) {
        const container = document.getElementById('tenant-readings-list');

        console.log('renderTenantReadingInputs called with:', { tenants, universalReading });

        if (!tenants || tenants.length === 0) {
            container.innerHTML = `
                <div class="no-tenants-message">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <line x1="23" y1="11" x2="17" y2="11"/>
                    </svg>
                    <p>لم يتم العثور على مستأجرين نشطين.<br>يرجى إضافة المستأجرين في الخطوة 1 أولاً.</p>
                </div>
            `;
            return;
        }

        try {
            // Get existing tenant readings for this period if any
            let existingReadings = [];
            if (universalReading && universalReading.monthYear) {
                existingReadings = await DB.tenantReadings.getByMonthYear(universalReading.monthYear);
            }
            const readingsMap = new Map(existingReadings.map(r => [r.tenantId, r]));

            container.innerHTML = tenants.map(tenant => {
                const existingReading = readingsMap.get(tenant.id);
                const value = existingReading ? existingReading.meterReading : '';

                return `
                    <div class="tenant-input-row">
                        <div class="tenant-input-info">
                            <h5>${this.escapeHtml(tenant.name)}</h5>
                            <span>الغرفة ${this.escapeHtml(tenant.roomNumber)}</span>
                        </div>
                        <div class="tenant-input-field">
                            <input
                                type="number"
                                id="tenant-reading-${tenant.id}"
                                class="tenant-reading-input"
                                data-tenant-id="${tenant.id}"
                                value="${value}"
                                placeholder="0.00"
                                step="0.01"
                                required
                            >
                        </div>
                    </div>
                `;
            }).join('');

            console.log('Rendered', tenants.length, 'tenant input fields');
        } catch (error) {
            console.error('Error rendering tenant inputs:', error);
            container.innerHTML = `
                <div class="no-tenants-message">
                    <p>خطأ في تحميل بيانات المستأجر. يرجى المحاولة مرة أخرى.</p>
                </div>
            `;
        }
    },

    /**
     * Render bills summary
     * @param {Array} bills - Array of bill objects with tenant info
     */
    renderBillsSummary(bills) {
        const container = document.getElementById('bills-list');

        if (bills.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>لا توجد فواتير للتوليد لهذه الفترة.</p>
                </div>
            `;
            return;
        }

        const total = bills.reduce((sum, bill) => sum + bill.proportionalCost, 0);

        container.innerHTML = bills.map(bill => `
            <div class="bill-card">
                <div class="bill-info">
                    <h4>${this.escapeHtml(bill.tenantName)}</h4>
                    <p>الغرفة ${this.escapeHtml(bill.roomNumber)} &bull; ${bill.unitsConsumed.toFixed(2)} وحدة (${Calculations.formatPercentage(bill.proportion)})</p>
                </div>
                <div class="bill-amount">
                    ${Calculations.formatCurrency(bill.proportionalCost)}
                </div>
            </div>
        `).join('') + `
            <div class="bill-card total">
                <div class="bill-info">
                    <h4>الإجمالي</h4>
                    <p>جميع المستأجرين مجتمعين</p>
                </div>
                <div class="bill-amount">
                    ${Calculations.formatCurrency(total)}
                </div>
            </div>
        `;
    },

    /**
     * Render reading history
     * @param {Array} readings - Array of universal readings with tenant data
     */
    renderHistory(readings) {
        const container = document.getElementById('history-list');

        if (readings.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12,6 12,12 16,14"/>
                        </svg>
                    </div>
                    <h4>لا يوجد سجل بعد</h4>
                    <p>سيظهر سجل القراءات هنا</p>
                </div>
            `;
            return;
        }

        container.innerHTML = readings.map(reading => `
            <div class="history-item">
                <h4>${Calculations.formatMonthYear(reading.date)}</h4>
                <div class="history-details">
                    <div class="history-detail">
                        <span class="history-detail-label">القراءة</span>
                        <span class="history-detail-value">${reading.meterReading.toFixed(2)}</span>
                    </div>
                    <div class="history-detail">
                        <span class="history-detail-label">المستهلك</span>
                        <span class="history-detail-value">${reading.unitsConsumed.toFixed(2)} وحدة</span>
                    </div>
                    <div class="history-detail">
                        <span class="history-detail-label">التكلفة الإجمالية</span>
                        <span class="history-detail-value">${Calculations.formatCurrency(reading.totalCost)}</span>
                    </div>
                    <div class="history-detail">
                        <span class="history-detail-label">التكلفة/الوحدة</span>
                        <span class="history-detail-value">${Calculations.formatCurrency(reading.unitsConsumed > 0 ? reading.totalCost / reading.unitsConsumed : 0)}</span>
                    </div>
                </div>
            </div>
        `).join('');
    },

    /**
     * Render bills overview in Bills tab
     * @param {Array} bills - Array of universal readings with status info
     */
    renderBillsOverview(bills) {
        const container = document.getElementById('bills-list-overview');

        if (bills.length === 0) {
            container.innerHTML = `
                <div class="empty-state compact">
                    <p>لا توجد فواتير بعد. أضف أول فاتورة أعلاه.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = bills.map(bill => {
            const statusClass = bill.hasReadings ? 'complete' : 'pending';
            const statusText = bill.hasReadings
                ? `تم تسجيل ${bill.tenantReadingsCount} قراءة`
                : 'لا توجد قراءات للمستأجرين بعد';

            return `
                <div class="bill-overview-item ${statusClass}">
                    <div class="bill-overview-main">
                        <div class="bill-overview-period">${Calculations.formatMonthYear(bill.date)}</div>
                        <div class="bill-overview-details">
                            <span class="bill-overview-cost">${Calculations.formatCurrency(bill.totalCost)}</span>
                            <span class="bill-overview-reading">${bill.meterReading.toFixed(2)} وحدة</span>
                        </div>
                    </div>
                    <div class="bill-overview-status">
                        <span class="status-indicator ${statusClass}"></span>
                        <span class="status-text">${statusText}</span>
                    </div>
                </div>
            `;
        }).join('');
    },

    /**
     * Populate bill select for Readings tab
     * @param {Array} bills - Array of universal readings with status info
     */
    populateBillSelectForReadings(bills) {
        const select = document.getElementById('reading-bill-select');

        if (bills.length === 0) {
            select.innerHTML = '<option value="">لا توجد فواتير متاحة - أضف فاتورة أولاً</option>';
            return;
        }

        select.innerHTML = '<option value="">اختر فترة الفاتورة...</option>' +
            bills.map(bill => {
                const status = bill.hasReadings ? '(تمت إضافة القراءات)' : '(تحتاج قراءات)';
                return `
                    <option value="${bill.id}">
                        ${Calculations.formatMonthYear(bill.date)} &mdash; ${Calculations.formatCurrency(bill.totalCost)} ${status}
                    </option>
                `;
            }).join('');
    },

    /**
     * Attach event listeners to tenant cards using event delegation
     */
    attachTenantCardEventListeners() {
        const container = document.getElementById('tenants-list');

        // Remove old listeners if any
        const newContainer = container.cloneNode(true);
        container.parentNode.replaceChild(newContainer, container);

        // Add event delegation for all tenant action buttons
        newContainer.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.edit-tenant-btn');
            const toggleBtn = e.target.closest('.toggle-tenant-btn');
            const deleteBtn = e.target.closest('.delete-tenant-btn');

            if (editBtn) {
                const tenantId = parseInt(editBtn.dataset.tenantId);
                if (window.App && window.App.editTenant) {
                    window.App.editTenant(tenantId);
                }
            } else if (toggleBtn) {
                const tenantId = parseInt(toggleBtn.dataset.tenantId);
                if (window.App && window.App.toggleTenantActive) {
                    window.App.toggleTenantActive(tenantId);
                }
            } else if (deleteBtn) {
                const tenantId = parseInt(deleteBtn.dataset.tenantId);
                if (window.App && window.App.deleteTenant) {
                    window.App.deleteTenant(tenantId);
                }
            }
        });
    },

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Format file size
     * @param {number} bytes - Size in bytes
     * @returns {string} Formatted size
     */
    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    },

    /**
     * Download text file
     * @param {string} filename - Name of file to download
     * @param {string} content - File content
     * @param {string} type - MIME type
     */
    downloadFile(filename, content, type = 'application/json') {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};

// Export to global scope
window.UI = UI;
