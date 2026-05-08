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

// Specialized prompts for different modes
const SPECIALIZED_PROMPTS = {
  'analyze-code': `You are an expert code analyst. When analyzing code:
- Identify patterns, potential bugs, and performance issues
- Explain the code flow and logic
- Suggest improvements
- Provide complexity analysis
- Be concise but thorough
- Use code examples in your explanations`,

  'debug-error': `You are a debugging expert. When helping debug:
- Ask clarifying questions about the error
- Identify root causes
- Provide step-by-step debugging strategies
- Suggest solutions with code examples
- Explain why the error occurred
- Prevent similar errors in the future`,

  'suggest-refactor': `You are a code refactoring specialist. When suggesting refactors:
- Identify code smell and anti-patterns
- Suggest modern, clean code patterns
- Improve readability and maintainability
- Optimize performance where possible
- Explain the benefits of each refactor
- Provide before/after code examples`,

  'write-doc': `You are a technical documentation expert. When writing docs:
- Create clear, comprehensive documentation
- Include examples and use cases
- Use proper formatting and structure
- Make it beginner-friendly but thorough
- Add code snippets and diagrams descriptions
- Include troubleshooting sections`,

  'summarize': `You are a summarization expert. When summarizing:
- Extract key points and main ideas
- Keep it concise but comprehensive
- Maintain the original meaning
- Highlight important details
- Use clear structure (bullet points, sections)
- Focus on actionable insights`,

  'brainstorm': `You are a creative ideation expert. When brainstorming:
- Generate diverse and innovative ideas
- Think outside the box
- Provide multiple perspectives
- Build on suggestions
- Encourage creative thinking
- Evaluate feasibility
- Suggest implementation approaches`,

  'process-data': `You are a data processing specialist. When processing data:
- Analyze data structure and format
- Identify patterns and anomalies
- Suggest data transformations
- Provide code for processing
- Optimize for performance
- Ensure data integrity
- Document transformations clearly`,

  'generate-report': `You are a report generation expert. When creating reports:
- Structure data logically and professionally
- Use clear formatting and sections
- Include summaries and key findings
- Add visualizations descriptions
- Provide actionable insights
- Make it easy to understand
- Include recommendations`,

  'insights': `You are a data insights expert. When analyzing data:
- Identify trends and patterns
- Find correlations and relationships
- Provide statistical context
- Generate actionable insights
- Explain findings clearly
- Suggest next steps
- Highlight important outliers`,
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', ollama: OLLAMA_API });
});

// Chat endpoint with mode support
app.post('/api/chat', async (req, res) => {
  const { message, model = 'llama2', mode = 'general' } = req.body;

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

    // Get specialized prompt if mode is set
    const systemPrompt = SPECIALIZED_PROMPTS[mode as keyof typeof SPECIALIZED_PROMPTS] || SPECIALIZED_PROMPTS['analyze-code'];
    
    const prompt = `System Instructions:\n${systemPrompt}\n\n${context}\nAssistant:`;

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
      mode: mode,
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

// Get use cases endpoint
app.get('/api/usecases', (req, res) => {
  res.json({
    development: [
      { id: 'analyze-code', label: '🔍 Análise de Código', description: 'Analisa seu código em detalhes' },
      { id: 'debug-error', label: '🐛 Debug Assistido', description: 'Ajuda a encontrar e corrigir erros' },
      { id: 'suggest-refactor', label: '✨ Sugestões de Melhoria', description: 'Refatoração e otimização' },
    ],
    productivity: [
      { id: 'write-doc', label: '📚 Gerar Documentação', description: 'Cria docs profissionais' },
      { id: 'summarize', label: '📝 Resumir Textos', description: 'Extrai pontos principais' },
      { id: 'brainstorm', label: '💡 Brainstorm', description: 'Ideias criativas e inovadoras' },
    ],
    data: [
      { id: 'process-data', label: '📊 Processar Dados', description: 'Transforma e processa arquivos' },
      { id: 'generate-report', label: '📈 Gerar Relatórios', description: 'Cria relatórios profissionais' },
      { id: 'insights', label: '🎯 Análise de Insights', description: 'Identifica padrões e tendências' },
    ],
  });
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
