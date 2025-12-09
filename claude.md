# Compound Interest Calculator

## Project Overview
Standalone compound interest calculator web application with interactive charts.

## Tech Stack
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Charts**: Chart.js 4.4 (CDN)
- **Build**: None (static files)

## Development Environment

To launch the development server, run:

```bash
python3 -m http.server 8002
```

Then open http://localhost:8002 in your browser.

**Port**: 8002 (to avoid conflicts with other projects)

## Project Structure
```
compound-interest-calculator/
├── index.html           # Main application
├── calculator.js        # Calculation logic
├── styles.css          # Styling
└── dist/               # Distribution folder
```

## Features
- Principal, interest rate, and time period inputs
- Visual charts using Chart.js
- Detailed compound growth breakdown
- All calculations performed client-side

## Notes
- No backend required
- No database
- No Docker
- CDN dependency: Chart.js from jsDelivr
