# SEC Filing Summarizer

An open-source, AI-powered tool that summarizes the latest SEC filings for any publicly traded US company. Enter a ticker symbol, choose a filing type (10-K, 10-Q, or 8-K), and get a structured summary with key financials, risk factors, and management outlook — powered by Claude.

## Features

- Summarizes 10-K (annual), 10-Q (quarterly), and 8-K (current event) filings
- Extracts key metrics: revenue, net income, EPS, cash
- Highlights risk factors and management outlook
- Links to the source SEC EDGAR filing
- Rate limiting to protect your API budget
- Clean, responsive UI with dark mode support

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- An [Anthropic API key](https://console.anthropic.com)

## Local Setup

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/sec-filing-summarizer.git
cd sec-filing-summarizer

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# 4. Start the server
npm start
# or for development with auto-reload:
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | — | Your Anthropic API key |
| `PORT` | No | `3000` | Port to run the server on |
| `RATE_LIMIT` | No | `10` | Max requests per IP per minute |

## Deploying to the Web

### Railway (recommended — free tier available)

1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) and create a new project from your GitHub repo
3. Add your `ANTHROPIC_API_KEY` in the Railway environment variables panel
4. Railway auto-detects Node and deploys — you'll get a public URL instantly

### Render

1. Push to GitHub, then create a new **Web Service** on [render.com](https://render.com)
2. Set build command: `npm install`
3. Set start command: `npm start`
4. Add `ANTHROPIC_API_KEY` in environment variables

### Vercel

Vercel doesn't support persistent Node servers out of the box. Convert `server.js` to a Vercel serverless function or use Railway/Render instead.

### Fly.io

```bash
fly launch
fly secrets set ANTHROPIC_API_KEY=sk-ant-...
fly deploy
```

## Project Structure

```
sec-filing-summarizer/
├── server.js          # Express backend — proxies requests to Anthropic API
├── package.json
├── .env.example       # Environment variable template
├── .gitignore
└── public/
    └── index.html     # Frontend UI (served as static files)
```

## Cost Awareness

Every search makes one API call to Claude (with web search enabled). Approximate cost per query: **$0.01–0.03** depending on filing length. Set `RATE_LIMIT` in your `.env` to control usage. You can also add authentication to restrict access to trusted users.

## Contributing

Contributions are welcome! Some ideas:

- Add more filing types (S-1, DEF 14A proxy statements)
- Export summaries as PDF or CSV
- Add a search history / watchlist feature
- Support international filings (SEDAR for Canada, etc.)
- Add a comparison mode for two tickers side by side

Please open an issue before submitting large pull requests.

## License

MIT — free to use, modify, and distribute.
