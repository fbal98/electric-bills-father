// PDF Bill Generator using jsPDF

const PDFGenerator = {
    /**
     * Generate PDF bill for a single tenant
     * @param {object} billData - Bill data including tenant, reading, and calculation info
     * @returns {jsPDF} PDF document object
     */
    generateBill(billData) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        let yPos = 20;

        // Header
        doc.setFillColor(33, 150, 243); // Primary color
        doc.rect(0, 0, pageWidth, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont(undefined, 'bold');
        doc.text('فاتورة الكهرباء', pageWidth / 2, 25, { align: 'center' });

        // Reset text color
        doc.setTextColor(0, 0, 0);
        yPos = 50;

        // Billing Period
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text(`فترة الفاتورة: ${Calculations.formatMonthYear(billData.date)}`, pageWidth - 20, yPos, { align: 'right' });
        yPos += 10;

        doc.setFontSize(10);
        doc.setTextColor(128, 128, 128);
        doc.text(`تاريخ الإصدار: ${new Date().toLocaleDateString('ar-OM')}`, pageWidth - 20, yPos, { align: 'right' });
        doc.setTextColor(0, 0, 0);
        yPos += 15;

        // Tenant Information Section
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('معلومات المستأجر', pageWidth - 20, yPos, { align: 'right' });
        yPos += 8;

        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        doc.text(`الاسم: ${billData.tenantName}`, pageWidth - 20, yPos, { align: 'right' });
        yPos += 7;
        doc.text(`الغرفة: ${billData.roomNumber}`, pageWidth - 20, yPos, { align: 'right' });
        yPos += 15;

        // Meter Reading Section
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('قراءة العداد', pageWidth - 20, yPos, { align: 'right' });
        yPos += 10;

        // Table for meter readings
        const readingData = [
            ['القراءة السابقة', `${billData.previousReading.toFixed(2)} وحدة`],
            ['القراءة الحالية', `${billData.currentReading.toFixed(2)} وحدة`],
            ['الوحدات المستهلكة', `${billData.unitsConsumed.toFixed(2)} وحدة`]
        ];

        this.drawTable(doc, 20, yPos, pageWidth - 40, readingData);
        yPos += (readingData.length * 10) + 15;

        // Cost Calculation Section
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('حساب التكلفة', pageWidth - 20, yPos, { align: 'right' });
        yPos += 10;

        const costData = [
            ['إجمالي استهلاك المبنى', `${billData.totalUniversalUnits.toFixed(2)} وحدة`],
            ['استهلاكك', `${billData.unitsConsumed.toFixed(2)} وحدة`],
            ['حصتك', `${Calculations.formatPercentage(billData.proportion)}`],
            ['', ''],
            ['إجمالي فاتورة المبنى', `${Calculations.formatCurrency(billData.totalBillCost)}`],
            ['التكلفة لكل وحدة', `${Calculations.formatCurrency(billData.costPerUnit)}`]
        ];

        this.drawTable(doc, 20, yPos, pageWidth - 40, costData);
        yPos += (costData.length * 10) + 15;

        // Amount Due (highlighted)
        doc.setFillColor(245, 245, 245);
        doc.rect(15, yPos - 5, pageWidth - 30, 20, 'F');

        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('المبلغ المستحق:', pageWidth - 20, yPos + 7, { align: 'right' });
        doc.setTextColor(33, 150, 243);
        doc.text(Calculations.formatCurrency(billData.proportionalCost), 20, yPos + 7, { align: 'left' });
        doc.setTextColor(0, 0, 0);

        yPos += 30;

        // Footer
        doc.setFontSize(9);
        doc.setFont(undefined, 'italic');
        doc.setTextColor(128, 128, 128);
        const footerText = 'تم حساب هذه الفاتورة بناءً على الاستهلاك النسبي.';
        doc.text(footerText, pageWidth / 2, pageHeight - 20, { align: 'center' });

        return doc;
    },

    /**
     * Draw a simple table
     * @param {jsPDF} doc - jsPDF document
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Table width
     * @param {Array} data - 2D array of table data
     */
    drawTable(doc, x, y, width, data) {
        const rowHeight = 10;
        const col1Width = width * 0.6;
        const col2Width = width * 0.4;

        doc.setFontSize(10);

        data.forEach((row, index) => {
            const currentY = y + (index * rowHeight);

            // Draw background for alternating rows
            if (index % 2 === 0) {
                doc.setFillColor(250, 250, 250);
                doc.rect(x, currentY - 6, width, rowHeight, 'F');
            }

            // Draw cell content
            if (row[0]) {
                doc.setFont(undefined, 'normal');
                doc.text(row[0], x + 5, currentY);
            }
            if (row[1]) {
                doc.setFont(undefined, 'bold');
                doc.text(row[1], x + col1Width + 5, currentY);
            }
        });

        // Draw table border
        doc.setDrawColor(224, 224, 224);
        doc.rect(x, y - 6, width, data.length * rowHeight);
    },

    /**
     * Generate bill filename
     * @param {string} tenantName - Tenant name
     * @param {string} monthYear - Month and year
     * @returns {string} Filename
     */
    generateFilename(tenantName, monthYear) {
        const sanitized = tenantName.replace(/[^a-z0-9]/gi, '_');
        return `فاتورة_${sanitized}_${monthYear}.pdf`;
    },

    /**
     * Generate and download PDF for a single tenant
     * @param {object} billData - Bill data
     */
    async downloadBill(billData) {
        try {
            UI.showLoading();
            const doc = this.generateBill(billData);
            const filename = this.generateFilename(
                billData.tenantName,
                Calculations.getMonthYearKey(billData.date)
            );
            doc.save(filename);
            UI.showToast('تم تحميل الفاتورة بنجاح', 'success');
        } catch (error) {
            console.error('Error generating PDF:', error);
            UI.showToast('فشل في توليد ملف PDF', 'error');
        } finally {
            UI.hideLoading();
        }
    },

    /**
     * Generate and download PDFs for all tenants
     * @param {Array} billsData - Array of bill data objects
     */
    async downloadAllBills(billsData) {
        try {
            UI.showLoading();

            for (const billData of billsData) {
                const doc = this.generateBill(billData);
                const filename = this.generateFilename(
                    billData.tenantName,
                    Calculations.getMonthYearKey(billData.date)
                );
                doc.save(filename);

                // Small delay between downloads to prevent browser issues
                await new Promise(resolve => setTimeout(resolve, 300));
            }

            UI.showToast(`تم توليد ${billsData.length} فاتورة بنجاح`, 'success');
        } catch (error) {
            console.error('Error generating PDFs:', error);
            UI.showToast('فشل في توليد جميع ملفات PDF', 'error');
        } finally {
            UI.hideLoading();
        }
    },

    /**
     * Prepare bill data from database records
     * @param {object} tenant - Tenant object
     * @param {object} tenantReading - Tenant reading object
     * @param {object} universalReading - Universal reading object
     * @returns {object} Formatted bill data
     */
    prepareBillData(tenant, tenantReading, universalReading) {
        const costPerUnit = universalReading.unitsConsumed > 0
            ? universalReading.totalCost / universalReading.unitsConsumed
            : 0;

        return {
            tenantName: tenant.name,
            roomNumber: tenant.roomNumber,
            date: tenantReading.date,
            previousReading: tenantReading.previousReading,
            currentReading: tenantReading.meterReading,
            unitsConsumed: tenantReading.unitsConsumed,
            totalUniversalUnits: universalReading.unitsConsumed,
            totalBillCost: universalReading.totalCost,
            costPerUnit: costPerUnit,
            proportion: tenantReading.proportion || 0,
            proportionalCost: tenantReading.proportionalCost
        };
    }
};

// Export to global scope
window.PDFGenerator = PDFGenerator;
