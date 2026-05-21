import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Anthropic from "@anthropic-ai/sdk";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Optional: simple in-memory rate limiter (requests per IP per minute)
const rateLimitMap = new Map();
const RATE_LIMIT = parseInt(process.env.RATE_LIMIT || "10"); // requests per minute per IP

function rateLimit(req, res, next) {
  const ip = req.ip;
  const now = Date.now();
  const windowMs = 60 * 1000;

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, []);
  }

  const timestamps = rateLimitMap.get(ip).filter((t) => now - t < windowMs);
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);

  if (timestamps.length > RATE_LIMIT) {
    return res.status(429).json({ error: "Too many requests. Please wait a minute and try again." });
  }
  next();
}

app.post("/api/summarize", rateLimit, async (req, res) => {
  const { ticker, filingType } = req.body;

  if (!ticker || !filingType) {
    return res.status(400).json({ error: "ticker and filingType are required." });
  }

  const cleanTicker = ticker.toUpperCase().replace(/[^A-Z.]/g, "").slice(0, 10);
  const allowedFilingTypes = ["10-K", "10-Q", "8-K"];
  if (!allowedFilingTypes.includes(filingType)) {
    return res.status(400).json({ error: "Invalid filingType. Must be 10-K, 10-Q, or 8-K." });
  }

  const systemPrompt = `You are a financial analyst specializing in SEC filings.
Search for the company's most recent ${filingType} filing on SEC EDGAR or financial sources.
Return ONLY a valid JSON object (no markdown, no backticks, no explanation) with this exact structure:
{
  "company": "Full company name",
  "ticker": "TICKER",
  "filingType": "${filingType}",
  "filingDate": "Month DD, YYYY",
  "period": "e.g. Q3 FY2024 or FY2024",
  "metrics": [
    {"label": "Revenue", "value": "$X.XB", "change": "+X% YoY"},
    {"label": "Net Income", "value": "$X.XB", "change": "+X% YoY"},
    {"label": "EPS", "value": "$X.XX", "change": "+X% YoY"},
    {"label": "Cash & Equiv.", "value": "$X.XB", "change": ""}
  ],
  "businessOverview": "2-3 sentence summary.",
  "keyHighlights": "3-4 sentences on key financial and operational results.",
  "risks": ["Risk 1", "Risk 2", "Risk 3", "Risk 4"],
  "outlook": "2-3 sentences on forward guidance.",
  "filingUrl": "SEC EDGAR URL or empty string"
}
Use real data from the filing. Use N/A if data unavailable. Return ONLY the JSON object.`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Find and summarize the latest ${filingType} SEC filing for ${cleanTicker}.`,
        },
      ],
    });

    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");

    const clean = text.replace(/```json|```/g, "").trim();
    const match = clean.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Could not parse filing data from model response.");

    const filing = JSON.parse(match[0]);
    res.json({ filing });
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ error: err.message || "Failed to fetch filing summary." });
  }
});

app.listen(PORT, () => {
  console.log(`SEC Filing Summarizer running at http://localhost:${PORT}`);
});
