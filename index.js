import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 7778;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(cors());
app.use(express.json());

// Serve static files from the build directory (where React build files are)
app.use(express.static(path.join(__dirname, 'build')));

// Calculation endpoint
app.post('/api/calculate', (req, res) => {
  const { stockPrice, desiredProfit } = req.body;
  if (
    typeof stockPrice !== 'number' ||
    typeof desiredProfit !== 'number' ||
    stockPrice <= 0 ||
    desiredProfit <= 0
  ) {
    return res.status(400).json({ error: 'Invalid input' });
  }
  // To earn $X profit per 1¢ gain, you need to buy (desiredProfit / 0.01) shares
  // Investment = number of shares * stock price
  const sharesNeeded = desiredProfit / 0.01;
  const investment = sharesNeeded * stockPrice;
  res.json({ investment });
});

// Natural language query endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { query, stockPrice, desiredProfit, investment } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Create context for the AI about the current calculation
    const context = stockPrice && investment ? 
      `Current calculation context: Stock price is $${stockPrice}, desired profit per 1¢ gain is $${desiredProfit}, and the required investment is $${investment.toLocaleString()}.` : 
      'No current calculation available.';

    const systemPrompt = `You are an investment calculator assistant. Help users understand their investment calculations and provide financial insights. Be helpful, accurate, and concise.

${context}

Key information about the calculator:
- Formula: Investment = Stock Price × (Desired Profit ÷ 0.01)
- The calculator determines how much to invest to earn a specific profit per 1-cent stock price increase
- Users can choose to earn $1, $10, or $100 per 1-cent gain

Answer the user's question clearly and provide relevant financial insights when appropriate.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query }
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const response = completion.choices[0].message.content;
    res.json({ response });

  } catch (error) {
    console.error('OpenAI API error:', error);
    if (error.code === 'invalid_api_key') {
      res.status(500).json({ error: 'OpenAI API key is not configured properly' });
    } else {
      res.status(500).json({ error: 'Failed to process your question. Please try again.' });
    }
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
