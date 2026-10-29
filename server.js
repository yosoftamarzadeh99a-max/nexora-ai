"use strict";

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
  res.json({
    name: "NEXORA AI Server",
    status: "online",
    chatConfigured: Boolean(process.env.AI_API_KEY)
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    const apiKey = process.env.AI_API_KEY;
    const apiUrl = process.env.AI_API_URL;
    const model = process.env.AI_MODEL;

    if (!apiKey || !apiUrl || !model) {
      return res.status(503).json({
        error: "سرور هنوز با ارائه‌دهندهٔ هوش مصنوعی تنظیم نشده است."
      });
    }

    const messages = req.body?.messages;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: "پیام معتبری ارسال نشده است."
      });
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("AI provider error:", response.status);
      return res.status(502).json({
        error: "ارائه‌دهندهٔ هوش مصنوعی پاسخ موفقی نداد."
      });
    }

    const reply =
      data?.choices?.[0]?.message?.content ??
      data?.output_text ??
      null;

    if (!reply) {
      return res.status(502).json({
        error: "پاسخ قابل‌خواندن از هوش مصنوعی دریافت نشد."
      });
    }

    return res.json({ reply });
  } catch (error) {
    console.error("Chat request failed:", error.message);
    return res.status(500).json({
      error: "در ارتباط با سرویس هوش مصنوعی خطایی رخ داد."
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`NEXORA AI server listening on port ${PORT}`);
});
