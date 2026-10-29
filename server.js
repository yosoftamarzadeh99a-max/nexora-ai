"use strict";

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors({
  origin: [
    "https://yosoftamarzadeh99a-max.github.io"
  ]
}));

app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
  res.json({
    name: "NEXORA AI",
    status: "online"
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    const apiKey = process.env.AI_API_KEY;
    const apiUrl = process.env.AI_API_URL;
    const model = process.env.AI_MODEL;

    if (!apiKey || !apiUrl || !model) {
      return res.status(503).json({
        error: "تنظیمات هوش مصنوعی کامل نیست."
      });
    }

    const { message, history } = req.body || {};

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        error: "پیام معتبر نیست."
      });
    }

    const messages = Array.isArray(history)
      ? history
          .filter(m =>
            m &&
            ["user", "assistant"].includes(m.role) &&
            typeof m.content === "string"
          )
          .slice(-12)
          .map(m => ({
            role: m.role,
            content: m.content.slice(0, 12000)
          }))
      : [{ role: "user", content: message }];

    if (
      !messages.length ||
      messages[messages.length - 1].role !== "user"
    ) {
      messages.push({
        role: "user",
        content: message
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
      }),
      signal: AbortSignal.timeout(60000)
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("AI provider status:", response.status);

      return res.status(502).json({
        error: "سرویس هوش مصنوعی پاسخ موفقی نداد."
      });
    }

    const reply = data?.choices?.[0]?.message?.content;

    if (typeof reply !== "string" || !reply.trim()) {
      return res.status(502).json({
        error: "پاسخ معتبر دریافت نشد."
      });
    }

    return res.json({
      reply: reply.trim()
    });

  } catch (error) {
    console.error("Chat error:", error.message);

    return res.status(500).json({
      error: "ارتباط با هوش مصنوعی با خطا مواجه شد."
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`NEXORA AI server running on port ${PORT}`);
});
