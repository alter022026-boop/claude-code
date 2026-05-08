#!/usr/bin/env bun
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { join } from 'path';
import AutonomousAgent from './autonomous-agent';

const app = express();
const PORT = 3000;
const OLLAMA_API = 'http://localhost:11434/api/generate';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Store conversation history
const conversationHistory: Array<{ role: string; content: string }> = [];

// Store autonomous agent tasks
const autonomousTasks: Map<string, any> = new Map();

// Specialized prompts for different modes
const SPECIALIZED_PROMPTS = {
  'analyze-code': `Analyze code: identify patterns, bugs, performance issues. Explain flow and logic. Suggest improvements. Be conversational.`,

  'debug-error': `Debug expert: identify root causes, provide step-by-step strategies, suggest solutions with examples. Be conversational.`,

  'suggest-refactor': `Refactor specialist: identify code smells, suggest clean patterns, improve readability. Explain benefits.`,

  'write-doc': `Documentation expert: create clear, comprehensive docs with examples and structure. Be conversational about needs.`,

  'summarize': `Summarization expert: extract key points, keep concise but comprehensive. Use clear structure and focus on actionable insights.`,

  'brainstorm': `Creative ideation expert: generate diverse ideas, think outside the box, provide multiple perspectives. Be collaborative.`,

  'process-data': `Data processing specialist: analyze structure, identify patterns, suggest transformations. Provide code and optimize performance.`,

  'generate-report': `Report generation expert: structure data logically, include summaries and insights. Make it professional and actionable.`,

  'insights': `Data insights expert: identify trends, patterns, correlations. Provide statistical context and actionable insights. Be engaging.`,

  'general': `Helpful AI assistant: answer questions clearly, provide useful information. Be friendly and conversational.`,
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', ollama: OLLAMA_API });
});

// Chat endpoint with mode support
app.post('/api/chat', async (req, res) => {
  const { message, model = 'gpt-oss:120b-cloud', mode = 'general' } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    // Get specialized prompt if mode is set
    const systemPrompt = SPECIALIZED_PROMPTS[mode as keyof typeof SPECIALIZED_PROMPTS] || SPECIALIZED_PROMPTS['general'];
    
    const prompt = `${systemPrompt}\n\nUser: ${message}\nAssistant:`;

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

    res.json({
      response: assistantMessage,
      model: model,
      mode: mode,
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
    agent: [
      { id: 'agent', label: '🤖 Agente Autônomo', description: 'Conversa natural e proativa' },
    ],
  });
});

// Clear history endpoint
app.post('/api/clear', (req, res) => {
  conversationHistory.length = 0;
  res.json({ status: 'history cleared' });
});

// ============ AGENTE AUTÔNOMO ENDPOINTS ============

// Iniciar uma tarefa autônoma
app.post('/api/autonomous/start', async (req, res) => {
  const { objective } = req.body;

  if (!objective) {
    return res.status(400).json({ error: 'Objective is required' });
  }

  const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const agent = new AutonomousAgent(taskId, objective);

  // Armazenar a tarefa
  autonomousTasks.set(taskId, {
    agent,
    status: 'running',
    startedAt: new Date(),
  });

  res.json({
    taskId,
    objective,
    status: 'started',
    message: 'Agente iniciado. Monitore com GET /api/autonomous/:taskId/status',
  });

  // Executar o agente em background
  (async () => {
    try {
      const result = await agent.run();
      autonomousTasks.set(taskId, {
        agent,
        status: result.completed ? 'completed' : 'failed',
        result,
        completedAt: new Date(),
      });
      console.log(`✅ Tarefa ${taskId} concluída`);
    } catch (error) {
      autonomousTasks.set(taskId, {
        agent,
        status: 'error',
        error: (error as Error).message,
        completedAt: new Date(),
      });
      console.error(`❌ Tarefa ${taskId} erro:`, error);
    }
  })();
});

// Obter status de uma tarefa
app.get('/api/autonomous/:taskId/status', (req, res) => {
  const { taskId } = req.params;
  const task = autonomousTasks.get(taskId);

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const agent = task.agent;
  const status = agent.getStatus();

  res.json({
    taskId,
    status: task.status,
    objective: status.objective,
    step: status.currentStep,
    completed: status.completed,
    error: status.error,
    actionsCount: status.actions.length,
    screenshotsCount: status.screenshots.length,
    result: task.result,
    timestamps: {
      startedAt: task.startedAt,
      completedAt: task.completedAt,
    },
  });
});

// Obter logs detalhados de uma tarefa
app.get('/api/autonomous/:taskId/logs', (req, res) => {
  const { taskId } = req.params;
  const task = autonomousTasks.get(taskId);

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const agent = task.agent;
  const status = agent.getStatus();

  res.json({
    taskId,
    objective: status.objective,
    steps: status.currentStep,
    actions: status.actions.map((action, i) => ({
      step: i + 1,
      type: action.type,
      reason: action.reason,
      details: {
        x: action.x,
        y: action.y,
        text: action.text?.substring(0, 100),
        command: action.command?.substring(0, 100),
      },
    })),
    lastResponse: status.lastResponse.substring(0, 500),
    screenshots: status.screenshots.length,
    completed: status.completed,
    error: status.error,
  });
});

// Listar todas as tarefas
app.get('/api/autonomous/tasks', (req, res) => {
  const tasks = Array.from(autonomousTasks.entries()).map(([taskId, task]) => ({
    taskId,
    status: task.status,
    objective: task.agent.getStatus().objective,
    startedAt: task.startedAt,
    completedAt: task.completedAt,
  }));

  res.json({ tasks });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 AI Chat Server running at http://localhost:${PORT}`);
  console.log(`📡 Connected to Ollama at ${OLLAMA_API}`);
  console.log(`🤖 Autonomous Agent API available at /api/autonomous\n`);
});
