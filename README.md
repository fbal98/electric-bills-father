# Electric Bill Manager PWA

A Progressive Web App for managing and splitting electricity bills across rental properties.

## Features

- ⚡ **Offline-First**: Works completely offline after initial load
- 📱 **Mobile-Friendly**: Optimized for mobile devices
- 💾 **Local Storage**: All data stored locally in IndexedDB
- 📄 **PDF Bills**: Generate downloadable PDF bills
- 📊 **Proportional Billing**: Automatically calculates bills based on consumption percentage
- 🔄 **No Backend Required**: Everything runs in the browser

## Quick Start

### Option 1: Local Development Server

Using Python (comes pre-installed on Mac):

```bash
cd electric-bills-father
python3 -m http.server 8000
```

Then open: http://localhost:8000

### Option 2: Using Node.js

```bash
cd electric-bills-father
npx serve .
```

### Option 3: Using PHP

```bash
cd electric-bills-father
php -S localhost:8000
```

## How to Use

### 1. Add Tenants
- Go to the **Tenants** tab
- Click "+ Add Tenant"
- Enter tenant name and room number
- Save

### 2. Enter Monthly Universal Reading
- Go to the **Readings** tab
- Select the billing month
- Enter the universal meter reading (e.g., 6000)
- Enter the total bill amount (e.g., $150)
- Click "Save Universal Reading"

### 3. Enter Tenant Readings
- After saving universal reading, tenant input fields will appear
- Enter each tenant's meter reading
- Click "Calculate & Save Bills"
- The app will automatically calculate proportional costs

### 4. Generate Bills
- Go to the **Bills** tab
- Select a billing period from the dropdown
- Review the calculated bills
- Click "Download All PDFs" to generate PDF bills for all tenants

### 5. View History
- Go to the **History** tab to view past readings
- Click "Export Data" to backup your data as JSON

## Install as PWA

### On Mobile (iOS)
1. Open the app in Safari
2. Tap the Share button
3. Select "Add to Home Screen"
4. Tap "Add"

### On Mobile (Android)
1. Open the app in Chrome
2. Tap the menu (three dots)
3. Select "Install App" or "Add to Home Screen"
4. Tap "Install"

### On Desktop
1. Open the app in Chrome/Edge
2. Look for the install icon in the address bar
3. Click "Install"

## Example Calculation

**Universal Bill:**
- Previous reading: 5000 units
- Current reading: 6000 units
- Consumption: 1000 units
- Total cost: $150

**Tenant A:**
- Consumption: 300 units
- Share: 30% (300 ÷ 1000)
- Bill: $45 (30% × $150)

**Tenant B:**
- Consumption: 500 units
- Share: 50%
- Bill: $75

**Tenant C:**
- Consumption: 200 units
- Share: 20%
- Bill: $30

## Data Management

### Export Data
Click "Export Data" in the History tab to download a JSON backup of all your data.

### Import Data (Manual)
To restore data:
1. Open browser console (F12)
2. Use the following code:
```javascript
// Paste your exported JSON here
const data = { /* your exported data */ };
await DB.utils.importData(data);
location.reload();
```

### Clear All Data
To start fresh:
```javascript
await DB.utils.clearAllData();
location.reload();
```

## Browser Support

- ✅ Chrome/Edge (Desktop & Mobile)
- ✅ Safari (Desktop & iOS)
- ✅ Firefox (Desktop & Mobile)
- ⚠️ Offline features require service worker support

## Technical Stack

- **Frontend**: Vanilla JavaScript (no framework)
- **Storage**: IndexedDB with idb library (~1KB)
- **PDF Generation**: jsPDF (~150KB)
- **Styling**: CSS3 with mobile-first design
- **PWA**: Service Worker + Web Manifest

## File Structure

```
electric-bills-father/
├── index.html              # Main app
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker
├── css/
│   └── style.css          # Styles
├── js/
│   ├── app.js             # Main app logic
│   ├── db.js              # Database operations
│   ├── calculations.js    # Bill calculations
│   ├── pdf-generator.js   # PDF generation
│   └── ui.js              # UI helpers
├── icons/
│   ├── icon-192.png       # App icon (192x192)
│   └── icon-512.png       # App icon (512x512)
└── README.md              # This file
```

## Troubleshooting

### App won't load
- Check browser console for errors (F12)
- Make sure you're serving via HTTP (not file://)
- Clear browser cache and reload

### Service Worker issues
- Unregister old service workers in DevTools
- Hard refresh with Ctrl+Shift+R (Cmd+Shift+R on Mac)

### Data disappeared
- Check if you're using the same browser
- Data is stored per-origin (including protocol and port)
- Export data regularly as backup

### PDF generation fails
- Make sure jsPDF library loaded correctly
- Check browser console for errors
- Try generating one bill at a time

## Privacy & Security

- ✅ All data stays on your device
- ✅ No data sent to any server
- ✅ No tracking or analytics
- ✅ Works completely offline

## License

MIT License - Feel free to use and modify as needed.

## Support

For issues or questions, refer to the browser console for error messages.
