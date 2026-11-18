# RBF — Ranging Bull Financial
## Trade Intelligence & Performance Analytics · Version 1.3

A free, installable web app for recording trades and analyzing performance by indicator/strategy, currency pair, timeframe, and market condition.

### Included in version 1
- Manual trade entry and editing
- Optional **Indicator / Strategy Used** field
- Dashboard: net P&L, win rate, total/closed trades, profit factor, average win and average loss
- Strategy scorecard: trade count, wins, win rate, net P&L, average result per closed trade
- Filters for date range, pair, strategy, market condition, and result
- Trade notes and review fields
- CSV import and export, including OANDA transaction-history exports (automatically pairs opening and closing fills)
- Local browser storage
- Installable PWA shell and basic offline access

### Important notes
- Trade records are saved in the browser on the device where they are entered. This version has no account, cloud sync, or automatic backup.
- Export your CSV regularly. Clearing browser data can erase locally stored trades.
- OANDA transaction-history CSV imports are recognized by their transaction columns. RBF filters to actual order fills, matches opening and closing fills by instrument and direction using FIFO, calculates realized result from PL plus financing, commission, and conversion fee, and keeps unmatched opening quantities as Open positions. Review imported records for accuracy. Imported trades have no strategy label because OANDA's transaction export does not identify which of your custom indicators generated a trade.
- Enter actual realized P&L. RBF intentionally does not estimate Forex P&L from entry/exit prices and lot size because pip value varies by instrument and account currency.
- The app does not connect to OANDA or TradingView and does not place trades.
- No closed-app push alerts are included.

## Publish free with GitHub Pages
1. Create a GitHub account if needed.
2. Create a new repository named `rbf-trade-intelligence`.
3. Upload the contents of this ZIP (the files themselves, not the containing folder) to the repository root.
4. In the repository, open **Settings → Pages**.
5. Under **Build and deployment**, choose **Deploy from a branch**, select `main` and `/ (root)`, then Save.
6. Wait for GitHub Pages to publish. The URL will look like `https://YOUR-USERNAME.github.io/rbf-trade-intelligence/`.

## Install on iPhone
1. Open the published HTTPS link in Safari.
2. Tap **Share**.
3. Choose **Add to Home Screen**.
4. Name it RBF Trades and tap **Add**.

## Data backup
Use **Export CSV** regularly and store the file somewhere safe. The CSV is portable and can be imported again using **Import CSV**.


## Version 1.2 updates
- Dashboard now separates total money gained on winning trades from total money lost on losing trades, alongside net P&L.
- Added a timeframe scorecard showing trade count, wins, win rate, net P&L, and average result by chart timeframe.
- Trade history displays timeframe and realized dollar P&L; search also includes timeframe.
- Service-worker cache version was advanced so deployed updates replace the older cached app.
- OANDA transaction exports do not contain the chart timeframe. Imported trades are marked “Not recorded” until the timeframe is assigned by editing the trade.


## Version 1.3 updates
- Added a weekly performance audit that compares a selected Monday–Sunday week against the previous Monday–Sunday week.
- Weekly comparison includes net P&L, total gained, total lost, wins, losses, breakeven trades, win rate, and closed-trade count.
- Added a current-week breakdown by strategy and timeframe, plus a short comparison insight.
- Added export of the weekly audit as CSV and a print-friendly audit view.
- Weekly audit is based on all saved trades and is independent of the dashboard filters. Open positions are excluded from realized P&L and win-rate calculations.


Version 1.4 adds a Weekly Audit shortcut in the top bar, moves the Weekly Performance Audit directly below the KPI cards, and adds a confirmed Clear all trades action to the trade log. Export a CSV before clearing; the action removes all trades from the current browser storage, including records hidden by filters.


## v1.5 — Edit existing trades
Use the Edit action in any trade-log row to reopen and update an existing trade, whether Open or closed. You can revise notes, strategy, timeframe, entry/exit/stop/target/size, result status, and money gained/lost. For an open trade, the money field can hold an optional current unrealized P&L; when closed, edit the same record and replace it with final realized P&L. Open-trade P&L remains excluded from closed performance totals. Editing preserves the original record ID and created timestamp, plus any imported metadata.
