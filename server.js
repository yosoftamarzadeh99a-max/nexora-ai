"use strict";

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors({
origin: "https://yosoftamarzadeh99a-max.github.io"
}));

app.use(express.json());

app.get("/", (req, res) => {
res.json({
name: "NEXORA AI",
status: "online"
});
});

app.post("/api/chat", (req, res) => {
const message = req.body?.message;

if (!message) {
return res.status(400).json({
error: "پیامی دریافت نشد."
});
}

res.json({
reply: "اتصال NEXORA AI موفق است! پیام شما دریافت شد: " + message
});
});

app.listen(PORT, "0.0.0.0", () => {
console.log("NEXORA AI server running on port " + PORT);
});