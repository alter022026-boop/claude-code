#!/usr/bin/env bun
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { join } from 'path';

const app = express();
const PORT = 3000;
const OLLAMA_API = 'http://localhost:11434/api/generate';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Store conversation history
const conversationHistory: Array<{ role: string; content: string }> = [];

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', ollama: OLLAMA_API });
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  const { message, model = 'llama2' } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    // Add user message to history
    conversationHistory.push({ role: 'user', content: message });

    // Build context from conversation history
    let context = conversationHistory
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');

    const prompt = `${context}\nAssistant:`;

    // Call Ollama
    const response = await fetch(OLLAMA_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    const assistantMessage = data.response.trim();

    // Add assistant response to history
    conversationHistory.push({ role: 'assistant', content: assistantMessage });

    res.json({
      response: assistantMessage,
      model: model,
      history: conversationHistory,
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: `Failed to get response from Ollama: ${error.message}`,
      hint: 'Make sure Ollama is running on http://localhost:11434',
    });
  }
});

// Get models endpoint
app.get('/api/models', async (req, res) => {
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    
    if (!response.ok) {
      throw new Error('Cannot reach Ollama');
    }

    const data = await response.json();
    res.json(data.models || []);
  } catch (error: any) {
    res.status(500).json({
      error: `Cannot connect to Ollama: ${error.message}`,
      hint: 'Start Ollama with: ollama serve',
    });
  }
});

// Clear history endpoint
app.post('/api/clear', (req, res) => {
  conversationHistory.length = 0;
  res.json({ status: 'history cleared' });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 AI Chat Server running at http://localhost:${PORT}`);
  console.log(`📡 Connected to Ollama at ${OLLAMA_API}\n`);
});
