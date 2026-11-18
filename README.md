# RBF — Ranging Bull Financial
## Trade Intelligence & Performance Analytics · Version 1.0

A free, installable web app for recording trades and analyzing performance by indicator/strategy, currency pair, timeframe, and market condition.

### Included in version 1
- Manual trade entry and editing
- Optional **Indicator / Strategy Used** field
- Dashboard: net P&L, win rate, total/closed trades, profit factor, average win and average loss
- Strategy scorecard: trade count, wins, win rate, net P&L, average result per closed trade
- Filters for date range, pair, strategy, market condition, and result
- Trade notes and review fields
- CSV import and export
- Local browser storage
- Installable PWA shell and basic offline access

### Important notes
- Trade records are saved in the browser on the device where they are entered. This version has no account, cloud sync, or automatic backup.
- Export your CSV regularly. Clearing browser data can erase locally stored trades.
- CSV import is a general-purpose importer. It looks for common column names such as `date`, `pair`/`symbol`, `direction`/`side`, `strategy`/`indicator`, `result`, and `pnl`/`profit`. Review imported records for accuracy.
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
