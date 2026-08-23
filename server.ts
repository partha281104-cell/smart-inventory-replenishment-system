import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { generateInventoryRiskExplanation, generateSupplierNegotiationMemo } from './src/server/aiService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Server-side AI endpoints
app.post('/api/gemini/analyze-risk', async (req, res) => {
  try {
    const explanation = await generateInventoryRiskExplanation(req.body);
    res.json({ explanation });
  } catch (err: any) {
    console.error('Error analyzing risk:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

app.post('/api/gemini/negotiate', async (req, res) => {
  try {
    const memo = await generateSupplierNegotiationMemo(req.body);
    res.json({ memo });
  } catch (err: any) {
    console.error('Error generating negotiation memo:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

// Serve static assets in production
app.use(express.static(path.join(process.cwd(), 'dist')));

app.get('*', (_req, res) => {
  res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`ReStock AI server running on port ${PORT}`);
});
