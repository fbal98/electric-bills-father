// Font Loader for Arabic Support in jsPDF
// Loads Amiri font from Google Fonts and registers it with jsPDF

const FontLoader = {
    fontLoaded: false,
    fontPromise: null,
    FONT_URL: 'https://raw.githubusercontent.com/google/fonts/main/ofl/amiri/Amiri-Regular.ttf',
    FONT_NAME: 'Amiri',

    /**
     * Load the Amiri Arabic font and register it with jsPDF
     * @returns {Promise<boolean>} True if font loaded successfully
     */
    async loadFont() {
        // Return existing promise if already loading
        if (this.fontPromise) {
            return this.fontPromise;
        }

        // Return immediately if already loaded
        if (this.fontLoaded) {
            return true;
        }

        this.fontPromise = this._doLoadFont();
        return this.fontPromise;
    },

    async _doLoadFont() {
        try {
            console.log('Loading Amiri Arabic font...');

            // Fetch the font file
            const response = await fetch(this.FONT_URL);
            if (!response.ok) {
                throw new Error(`Failed to fetch font: ${response.status}`);
            }

            // Convert to array buffer then to base64
            const arrayBuffer = await response.arrayBuffer();
            const base64 = this._arrayBufferToBase64(arrayBuffer);

            // Register the font with jsPDF
            const { jsPDF } = window.jspdf;

            // Add font to virtual file system
            const callAddFont = function() {
                this.addFileToVFS('Amiri-Regular.ttf', base64);
                this.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
            };

            // Register the callback
            jsPDF.API.events.push(['addFonts', callAddFont]);

            this.fontLoaded = true;
            console.log('Amiri Arabic font loaded successfully');
            return true;
        } catch (error) {
            console.error('Error loading Arabic font:', error);
            this.fontPromise = null; // Allow retry
            return false;
        }
    },

    /**
     * Convert ArrayBuffer to Base64 string
     * @param {ArrayBuffer} buffer - The array buffer to convert
     * @returns {string} Base64 encoded string
     */
    _arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    },

    /**
     * Apply Arabic font to a jsPDF document
     * @param {jsPDF} doc - The jsPDF document instance
     */
    applyArabicFont(doc) {
        if (this.fontLoaded) {
            doc.setFont('Amiri', 'normal');
        }
    },

    /**
     * Check if font is loaded
     * @returns {boolean}
     */
    isLoaded() {
        return this.fontLoaded;
    }
};

// Export to global scope
window.FontLoader = FontLoader;
