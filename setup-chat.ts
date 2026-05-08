#!/usr/bin/env bun
import { spawn } from 'child_process';

const OLLAMA_URL = 'http://localhost:11434';
const SERVER_URL = 'http://localhost:3000';

async function checkOllama() {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`);
    const data = await response.json();
    return {
      status: 'ok',
      models: data.models || [],
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message,
    };
  }
}

async function main() {
  console.log('\n🔍 Verificando Ollama...\n');

  const ollamaCheck = await checkOllama();

  if (ollamaCheck.status === 'error') {
    console.log('❌ Ollama não está rodando!');
    console.log('\n📝 Para iniciar o Ollama, execute em outro terminal:');
    console.log('   ollama serve\n');
    console.log('💡 Se não tem Ollama instalado:');
    console.log('   1. Download: https://ollama.ai');
    console.log('   2. Instale e abra o aplicativo');
    console.log('   3. Execute: ollama pull llama2\n');
    process.exit(1);
  }

  console.log('✅ Ollama conectado!');
  console.log(`📦 Modelos disponíveis: ${ollamaCheck.models.length}`);
  ollamaCheck.models.forEach(m => {
    console.log(`   • ${m.name}`);
  });

  console.log('\n🚀 Iniciando servidor...\n');

  // Start server
  const server = spawn('bun', ['server-ollama.ts'], {
    stdio: 'inherit',
    cwd: process.cwd(),
  });

  // Wait a bit for server to start, then open browser
  setTimeout(() => {
    console.log('\n🌐 Abrindo navegador em 3 segundos...\n');
    setTimeout(() => {
      try {
        const open = require('open');
        open(SERVER_URL);
      } catch {
        // If 'open' module not available, try system command
        if (process.platform === 'win32') {
          spawn('start', [SERVER_URL], { shell: true });
        } else if (process.platform === 'darwin') {
          spawn('open', [SERVER_URL]);
        } else {
          spawn('xdg-open', [SERVER_URL]);
        }
      }
    }, 1000);
  }, 2000);

  server.on('exit', (code) => {
    process.exit(code);
  });
}

main().catch(err => {
  console.error('❌ Erro:', err);
  process.exit(1);
});
