# Quant Lab

Quant Lab is a full-stack quantitative portfolio analytics platform designed to help investors analyze, optimize, and evaluate portfolios using modern portfolio theory and real-time market data.

## Live Demo

https://quant-lab-tau.vercel.app

## Overview

Quant Lab provides portfolio construction and optimization tools through an intuitive web interface. The platform combines quantitative finance models with live market data to deliver actionable portfolio insights.

## Features

### Portfolio Optimization

- Equal Weight Portfolio Construction
- Mean-Variance Optimization
- Dynamic Asset Allocation
- Portfolio Weight Analysis

### Market Dashboard

- NIFTY 50 Tracking
- SENSEX Tracking
- NIFTY BANK Tracking
- INDIA VIX Tracking
- Live Market Data Integration

### Portfolio Analytics

- Expected Annual Return
- Portfolio Volatility
- Sharpe Ratio
- Portfolio Allocation Breakdown

### User Experience

- Responsive Interface
- Real-Time Data Updates
- Interactive Portfolio Builder
- Modern Financial Dashboard Design

---

## Technology Stack

### Frontend

- React
- Vite
- Axios
- JavaScript

### Backend

- FastAPI
- Python
- Uvicorn

### Quantitative Finance Libraries

- PyPortfolioOpt
- NumPy
- Pandas
- SciPy
- yFinance

### Deployment

- Vercel (Frontend)
- Render (Backend)

---

## System Architecture

```text
Frontend (React + Vite)
        │
        ▼
   FastAPI Backend
        │
        ▼
Portfolio Optimization Engine
        │
 ┌──────┼────────┐
 ▼      ▼        ▼
Market  Metrics  Optimization
 Data    Engine      Engine
```

---

## Project Structure

```text
quant-lab/
│
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   │
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── app/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── main.py
│   │
│   └── requirements.txt
│
└── README.md
```

---

## API Endpoints

### Market Data

```http
GET /api/market
```

Example Response:

```json
{
  "nifty": {
    "value": 23242.10,
    "change": 0.52
  },
  "sensex": {
    "value": 73916.54,
    "change": 0.53
  },
  "bank": {
    "value": 55194.50,
    "change": 2.09
  },
  "vix": {
    "value": 15.57,
    "change": -8.54
  }
}
```

### Portfolio Optimization

```http
POST /api/portfolio/optimize
```

Request:

```json
{
  "tickers": [
    "RELIANCE.NS",
    "TCS.NS",
    "INFY.NS",
    "HDFCBANK.NS"
  ],
  "strategy": "mean_variance"
}
```

Response:

```json
{
  "strategy": "Mean Variance",
  "weights": {},
  "metrics": {}
}
```

---

## Local Setup

### Backend

```bash
cd backend

python -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt

uvicorn app.main:app --reload
```

Backend URL:

```text
http://localhost:8000
```

### Frontend

```bash
cd frontend

npm install

npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

---

## Future Enhancements

- Efficient Frontier Visualization
- Monte Carlo Portfolio Simulation
- Historical Backtesting
- Risk Scoring Framework
- Sector Allocation Analysis
- AI-Powered Portfolio Insights
- Performance Benchmarking Against Market Indices

---

## Key Learning Areas

This project demonstrates practical experience in:

- Full-Stack Development
- Quantitative Finance
- Portfolio Optimization
- Financial Data Analysis
- REST API Design
- Cloud Deployment
- Frontend–Backend Integration
- Production Application Deployment

---

## Author

**R N Dhanapraveen Krishna**

GitHub: https://github.com/rndpk12

LinkedIn: https://www.linkedin.com/in/rndpk12

---

## License

This project is licensed under the MIT License.
