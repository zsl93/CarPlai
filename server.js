import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.get("/", (req, res) => res.json({ status: "CarPlai proxy running" }));

app.post("/api/gemini", async (req, res) => {
  try {
    const { model, key, ...body } = req.body;
    if (!key) return res.status(400).json({ error: { message: "No API key" } });
    if (!model) return res.status(400).json({ error: { message: "No model" } });
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
    );
    res.json(await r.json());
  } catch (e) {
    res.status(500).json({ error: { message: e.message } });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`CarPlai proxy running on port ${PORT}`));
