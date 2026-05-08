#!/usr/bin/env bun
import { spawn } from 'child_process';
import { existsSync } from 'fs';

function runCommand(command: string, args: string[], description: string): Promise<number> {
  return new Promise((resolve) => {
    console.log(`\n📝 ${description}...`);
    const cmd = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
    });

    cmd.on('exit', (code) => {
      resolve(code || 0);
    });
  });
}

async function main() {
  console.log('\n🚀 Git Setup - Claude Code Project\n');
  console.log('=' .repeat(50));

  // Check if .git already exists
  if (existsSync('.git')) {
    console.log('✅ Repositório Git já existe!');
  } else {
    await runCommand('git', ['init'], 'Inicializando repositório Git');
    await runCommand('git', ['config', 'user.name', 'Claude Code User'], 'Configurando nome do usuário');
    await runCommand('git', ['config', 'user.email', 'user@claudecode.dev'], 'Configurando email');
  }

  // Add all files
  await runCommand('git', ['add', '.'], 'Adicionando arquivos');

  // Check for uncommitted changes
  console.log('\n📊 Status do repositório:\n');
  await runCommand('git', ['status'], 'Verificando status');

  // Initial commit
  await runCommand('git', ['commit', '-m', 'Initial commit: Claude Code AI Chat System'], 'Fazendo commit inicial');

  console.log('\n' + '='.repeat(50));
  console.log('\n✅ Setup do Git completo!\n');
  console.log('📋 Próximos passos:\n');
  console.log('1. Criar um repositório em GitHub: https://github.com/new');
  console.log('2. Execute um dos comandos abaixo:\n');
  console.log('   Se criar novo repositório:');
  console.log('   $ git branch -M main');
  console.log('   $ git remote add origin https://github.com/SEU_USER/claude-code.git');
  console.log('   $ git push -u origin main\n');
  console.log('   Se clonou um repositório existente:');
  console.log('   $ git push origin main\n');
  console.log('3. Compartilhe seu repositório:');
  console.log('   $ git remote -v  # Ver URLs remotas\n');
  console.log('Pronto! 🎉\n');
}

main().catch(err => {
  console.error('❌ Erro:', err);
  process.exit(1);
});
