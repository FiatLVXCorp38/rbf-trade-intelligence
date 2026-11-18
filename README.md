# Forex Command

A standalone GitHub Pages forex dashboard for EUR/USD, USD/JPY and USD/CAD.

## Features
- Session status clocks for Tokyo, London and New York (New York time).
- Previous completed daily candle high, low and midpoint.
- Multi-timeframe EMA trend assessment (1D, 4H, 1H, 15M, 5M).
- Conditional setup references based on 1H/15M agreement and 5M volatility.
- Economic calendar link and pre-news caution reminder.
- PWA install support.

## Deploy
1. Create a new GitHub repository named `forex-command`.
2. Upload all files in this folder to the repository root.
3. In Settings > Pages, deploy from the `main` branch and `/ (root)`.
4. Open the published URL.

## Market data
This version uses the Twelve Data time-series endpoint. Create an API key at https://twelvedata.com/ and enter it in the dashboard. The key is saved in this browser's localStorage. This is suitable for a private personal prototype, but it is not secure for a public website because browser users can inspect requests and local storage. For a production/public deployment, proxy requests through a server-side service and store the key in its secrets manager.

The app requests all three symbols together in one API call per interval (five batch calls total for 1D, 4H, 1H, 15M and 5M). Twelve Data multi-symbol responses are parsed separately for EUR/USD, USD/JPY and USD/CAD. Check the API plan's FX coverage, interval availability, credit limits and delayed/real-time status. If a request fails, the dashboard reports an error. It does not fabricate quotes.

## Important limitations
- Session clock hours are indicative standard session windows in New York time; holidays and broker-specific liquidity conditions are not modeled.
- Trend classification is a simple EMA20/EMA50 and recent-slope heuristic, not a predictive model.
- Setup entry/stop/target values are volatility-based references, not broker orders or guaranteed levels. Confirm price action, spread, execution conditions and risk independently.
- Economic calendar is linked externally and not embedded. Calendar feed integration can be added separately with a suitable provider.
- Data refresh is manual; browser auto-refresh is not enabled to avoid exhausting API quotas.


## Batch requests
The dashboard sends one `/time_series` request per timeframe using the comma-separated symbol parameter: `EUR/USD,USD/JPY,USD/CAD`. This reduces the request count from 15 pair/timeframe calls to 5 timeframe calls. Twelve Data may still charge credits per symbol, and actual credit usage depends on the user's plan/provider rules.


## Rate-limit handling (v1.2)
If Twelve Data returns HTTP 429, the dashboard waits 62 seconds and retries the affected timeframe (up to two retries). On the Basic plan, the five timeframe batches use 15 credits total (3 symbols per interval), so a complete refresh can span more than one minute. Batch requests reduce HTTP request count, not per-symbol credit usage.


## v1.3 batch response validation
The batch parser explicitly reads each symbol-keyed result (EUR/USD, USD/JPY, USD/CAD), handles supported response wrappers, and reports provider error codes/messages. Each timeframe is one multi-symbol request. The app requests 60 candles per interval, enough for the EMA50 trend calculation with a small buffer. HTTP 429 is retried after a 62-second wait, up to two retries; exhausted daily credits cannot be bypassed by the app.
