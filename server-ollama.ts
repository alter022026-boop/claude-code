#!/usr/bin/env bun
import express from 'express';
import { execSync } from 'child_process';
import AutonomousAgent from './autonomous-agent';
import path from 'path';

const app = express();
app.use(express.json());

// Middleware de log para todas as requisições
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Prompts especializados
const SPECIALIZED_PROMPTS = {
  'analyze-code': {
    system: 'Você é um especialista em análise de código. Analise o código fornecido em detalhes, identifique padrões, possíveis problemas e sugestões de melhoria.',
    user: 'Analise este código: {message}'
  },
  'debug-error': {
    system: 'Você é um especialista em debugging. Ajude a identificar e corrigir erros no código ou sistema.',
    user: 'Debug este problema: {message}'
  },
  'suggest-refactor': {
    system: 'Você é um especialista em refatoração de código. Sugira melhorias na estrutura, performance e manutenibilidade.',
    user: 'Sugira refatorações para: {message}'
  },
  'write-doc': {
    system: 'Você é um especialista em documentação técnica. Crie documentação clara, completa e profissional.',
    user: 'Crie documentação para: {message}'
  },
  'summarize': {
    system: 'Você é um especialista em sumarização. Crie resumos concisos e abrangentes.',
    user: 'Resuma: {message}'
  },
  'brainstorm': {
    system: 'Você é um especialista em brainstorm criativo. Gere ideias inovadoras e soluções criativas.',
    user: 'Brainstorm ideias para: {message}'
  },
  'process-data': {
    system: 'Você é um especialista em processamento de dados. Ajude a transformar, analisar e processar dados.',
    user: 'Processe estes dados: {message}'
  },
  'generate-report': {
    system: 'Você é um especialista em geração de relatórios. Crie relatórios profissionais e bem estruturados.',
    user: 'Gere relatório sobre: {message}'
  },
  'insights': {
    system: 'Você é um especialista em análise de insights. Identifique padrões, tendências e insights valiosos.',
    user: 'Extraia insights de: {message}'
  },
  'agent': {
    system: 'Você é um agente autônomo inteligente. Converse naturalmente, seja proativo e ajude o usuário de forma inteligente.',
    user: '{message}'
  }
};

// Histórico de conversas
const conversationHistory: Array<{role: string, content: string}> = [];

// Map para armazenar tarefas autônomas
const autonomousTasks = new Map();

// ============ CHAT ENDPOINTS ============

// Endpoint principal do chat
app.post('/api/chat', async (req, res) => {
  try {
    const { message, model = 'mistral:latest', useCase = 'general' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Mensagem é obrigatória' });
    }

    // Preparar prompt baseado no caso de uso
    let systemPrompt = 'Você é um assistente de IA útil e inteligente.';
    let userPrompt = message;

    if (SPECIALIZED_PROMPTS[useCase]) {
      systemPrompt = SPECIALIZED_PROMPTS[useCase].system;
      userPrompt = SPECIALIZED_PROMPTS[useCase].user.replace('{message}', message);
    }

    // Adicionar ao histórico
    conversationHistory.push({ role: 'user', content: userPrompt });

    // Limitar histórico a últimas 10 mensagens
    if (conversationHistory.length > 10) {
      conversationHistory.splice(0, conversationHistory.length - 10);
    }

    // Preparar payload para Ollama
    const payload = {
      model: model,
      prompt: userPrompt,
      system: systemPrompt,
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.9,
        num_predict: 1024
      }
    };

    // Fazer requisição para Ollama
    const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!ollamaResponse.ok) {
      throw new Error(`Erro na API do Ollama: ${ollamaResponse.status}`);
    }

    const ollamaData = await ollamaResponse.json();
    const aiResponse = ollamaData.response;

    // Adicionar resposta ao histórico
    conversationHistory.push({ role: 'assistant', content: aiResponse });

    res.json({
      response: aiResponse,
      model: model,
      useCase: useCase
    });

  } catch (error) {
    console.error('Erro no chat:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Endpoint para iniciar tarefa autônoma
app.post('/api/autonomous/start', async (req, res) => {
  try {
    const { objective } = req.body;

    if (!objective) {
      return res.status(400).json({ error: 'Objetivo é obrigatório' });
    }

    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const agent = new AutonomousAgent(taskId, objective);

    // Armazenar tarefa
    autonomousTasks.set(taskId, agent);

    // Executar tarefa em background
    agent.run().then((result) => {
      console.log(`✅ Tarefa ${taskId} concluída:`, result.completed);
    }).catch((error) => {
      console.error(`❌ Erro na tarefa ${taskId}:`, error);
    });

    res.json({
      success: true,
      taskId: taskId,
      message: 'Tarefa iniciada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao iniciar tarefa autônoma:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Endpoint para listar tarefas autônomas atuais
app.get('/api/autonomous/tasks', (req, res) => {
  const tasks = Array.from(autonomousTasks.values()).map(agent => {
    const status = agent.getStatus();
    return {
      taskId: status.taskId,
      objective: status.objective,
      status: status.status,
      startedAt: status.startedAt,
    };
  });

  res.json({ tasks });
});

// Endpoint para verificar status da tarefa
app.get('/api/autonomous/:taskId/status', (req, res) => {
  const { taskId } = req.params;
  const agent = autonomousTasks.get(taskId);

  if (!agent) {
    return res.status(404).json({ error: 'Tarefa não encontrada' });
  }

  const status = agent.getStatus();
  res.json(status);
});

// Endpoint para obter logs da tarefa
app.get('/api/autonomous/:taskId/logs', (req, res) => {
  const { taskId } = req.params;
  const agent = autonomousTasks.get(taskId);

  if (!agent) {
    return res.status(404).json({ error: 'Tarefa não encontrada' });
  }

  const logs = agent.getLogs();
  res.json(logs);
});

// Endpoint para listar modelos disponíveis
app.get('/api/models', async (req, res) => {
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    if (!response.ok) {
      throw new Error('Não foi possível conectar ao Ollama');
    }
    const data = await response.json();
    res.json(data.models || []);
  } catch (error) {
    console.error('Erro ao buscar modelos:', error);
    res.json([]);
  }
});

// Endpoint para listar casos de uso
app.get('/api/usecases', (req, res) => {
  const useCases = Object.keys(SPECIALIZED_PROMPTS).map(key => ({
    id: key,
    name: SPECIALIZED_PROMPTS[key].system.split('.')[0].replace('Você é um especialista em ', ''),
    description: SPECIALIZED_PROMPTS[key].system.split('.')[1]?.trim() || SPECIALIZED_PROMPTS[key].system,
    label: SPECIALIZED_PROMPTS[key].system.split('.')[0].replace('Você é um especialista em ', '')
  }));

  // Categorizar casos de uso
  const categorized = {
    development: useCases.filter(uc => ['analyze-code', 'debug-error', 'suggest-refactor', 'write-doc'].includes(uc.id)),
    productivity: useCases.filter(uc => ['summarize', 'brainstorm'].includes(uc.id)),
    data: useCases.filter(uc => ['process-data', 'generate-report', 'insights'].includes(uc.id)),
    agent: useCases.filter(uc => ['agent'].includes(uc.id))
  };

  res.json(categorized);
});

// Servir arquivos estáticos
app.get('/index.html', (req, res) => {
  res.sendFile(path.join(import.meta.dir, 'public', 'index.html'));
});

app.use(express.static(path.join(import.meta.dir, 'public')));

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 AI Chat Server running at http://localhost:${PORT}`);
  console.log(`📡 Connected to Ollama at http://localhost:11434/api/generate`);
  console.log(`🤖 Autonomous Agent API available at /api/autonomous`);
});