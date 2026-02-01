# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Progressive Web App for managing electricity bill splitting across rental properties. The app calculates proportional billing based on consumption, generates PDF bills, and works completely offline with local storage.

**Tech Stack**: Vanilla JavaScript (no build tools), IndexedDB, Service Workers, jsPDF

## Development Server

The app requires serving over HTTP (not file://). Use any of these:

```bash
# Python (recommended - pre-installed on Mac)
python3 -m http.server 8000

# Node.js
npx serve .

# PHP
php -S localhost:8000
```

Then open: http://localhost:8000

## Architecture

### Data Flow
1. User enters **universal meter reading** (building's main meter) + total bill cost
2. User enters **individual tenant readings** for each room
3. App calculates **proportional costs** based on consumption percentage
4. User generates **PDF bills** from calculated data

### Core Modules

**`js/db.js`** - IndexedDB layer with three object stores:
- `tenants` - Tenant records (name, room number, active status)
- `universalReadings` - Building-wide meter readings (unique by monthYear)
- `tenantReadings` - Individual tenant readings (unique by tenantId + monthYear)

**`js/app.js`** - Main application controller:
- Event handlers for all user interactions
- Coordinates between DB, Calculations, UI, and PDFGenerator
- Manages app state (currentUniversalReading, currentBills)

**`js/calculations.js`** - Pure calculation functions:
- Proportional cost splitting algorithm
- Consumption calculations (current - previous reading)
- Date/currency formatting utilities

**`js/pdf-generator.js`** - PDF bill generation using jsPDF:
- Creates formatted bills with tenant info, readings, and costs
- Handles single or bulk PDF downloads

**`js/ui.js`** - UI rendering and helper functions:
- Renders tenant lists, reading inputs, bills summary
- Toast notifications, modals, loading states
- All rendering is dynamic (no templates)

**`sw.js`** - Service worker for offline functionality:
- Cache-first strategy for app shell
- Caches external CDN libraries (idb, jsPDF)

### Key Constraints

**IndexedDB Unique Indexes:**
- `universalReadings.monthYear` - Prevents duplicate universal readings for same month
- `tenantReadings.tenantMonth` - Prevents duplicate tenant readings for same month

**Transaction Management:**
- Always fetch data BEFORE opening write transactions
- Transactions auto-close after async operations complete
- Bad: `tx.open() → await getData() → tx.add()`
- Good: `await getData() → tx.open() → tx.add()`

### Calculation Logic

Proportional billing formula:
```
tenantShare = tenantConsumption / totalTenantConsumption
tenantCost = tenantShare × universalTotalCost
```

Example: If universal bill is $150 for 1000 units, and tenant used 300 units:
- Share: 300 ÷ 1000 = 30%
- Cost: 30% × $150 = $45

### State Management

App uses simple global state (no framework):
- `App.currentUniversalReading` - Reading being worked on
- `App.currentBills` - Bills displayed in Bills tab
- All persistent data in IndexedDB

### External Dependencies (CDN)

```html
<script src="https://cdn.jsdelivr.net/npm/idb@8/build/umd.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
```

Accessible via: `window.idb` and `window.jspdf`

## Testing

**Manual test workflow:**
1. Add 2-3 test tenants (Tenants tab)
2. Enter universal reading: 6000 units, $150 (Readings tab)
3. Enter tenant readings: 1300, 2500, 1800 units
4. Verify calculations: Should show ~$40.91, $68.18, $40.91
5. Generate PDFs (Bills tab)
6. Check History tab shows reading

**Test service worker:**
```bash
# Open DevTools → Application → Service Workers
# Verify registration
# Go offline (Network tab → Offline)
# Reload - app should still work
```

**Clear data for testing:**
```javascript
// In browser console:
await DB.utils.clearAllData();
location.reload();
```

## Common Issues

**"Transaction not active" error:**
- Cause: Async operation between transaction open and use
- Fix: Move all reads before opening write transaction

**"Constraint not satisfied" error:**
- Cause: Duplicate monthYear in universal or tenant readings
- Fix: Check for existing reading first, offer update instead

**Service Worker not updating:**
- Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+F5
- DevTools → Application → Service Workers → Unregister

**PDF not generating:**
- Check jsPDF loaded: `console.log(window.jspdf)`
- Check console for errors
- Try single bill first before bulk

## Data Schema

```javascript
// Tenant
{
  id: number,
  name: string,
  roomNumber: string,
  isActive: boolean,
  createdAt: timestamp
}

// UniversalReading
{
  id: number,
  date: timestamp,
  monthYear: string, // "YYYY-MM" format (unique)
  meterReading: number,
  totalCost: number,
  previousReading: number,
  unitsConsumed: number,
  createdAt: timestamp
}

// TenantReading
{
  id: number,
  tenantId: number,
  universalReadingId: number,
  date: timestamp,
  monthYear: string, // "YYYY-MM"
  meterReading: number,
  previousReading: number,
  unitsConsumed: number,
  proportionalCost: number,
  proportion: number, // 0-1 (percentage)
  createdAt: timestamp
}
```

## PWA Installation

App can be installed as PWA on mobile/desktop. Installation prompt handled in `App.setupPWAInstall()`.

**Manifest**: `/manifest.json`
**Icons**: `/icons/icon-{192,512}.png`
**Service Worker**: `/sw.js`

## Browser Compatibility

Requires:
- IndexedDB support
- Service Worker support (for offline)
- ES6+ JavaScript

Tested on Chrome, Safari, Firefox, Edge.

## No Build Process

This is intentionally a zero-build-step app:
- No npm/webpack/babel/etc.
- All code runs directly in browser
- Dependencies loaded from CDN
- Easy to deploy (just copy files to any static host)
