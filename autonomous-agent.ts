#!/usr/bin/env bun
import { execSync } from 'child_process';

// Tipos
interface AgentAction {
  type: 'click' | 'type' | 'press' | 'execute' | 'open_app' | 'open_url' | 'wait' | 'scroll' | 'done';
  x?: number;
  y?: number;
  text?: string;
  key?: string;
  command?: string;
  app?: string;
  url?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  amount?: number;
  reason?: string;
}

interface AgentState {
  taskId: string;
  objective: string;
  currentStep: number;
  completed: boolean;
  error: string | null;
  actions: AgentAction[];
  lastResponse: string;
  status: string; // Adicionado para compatibilidade
  startedAt: number;
}

class AutonomousAgent {
  private state: AgentState;

  constructor(taskId: string, objective: string) {
    this.state = {
      taskId,
      objective,
      currentStep: 0,
      completed: false,
      error: null,
      actions: [],
      lastResponse: '',
      status: 'running', // Inicializar status
      startedAt: Date.now(),
    };
  }

  async run(): Promise<AgentState> {
    console.log(`\n🤖 Iniciando agente autônomo para: "${this.state.objective}"\n`);

    try {
      const objective = this.state.objective.toLowerCase();

      // Analisar intenção da tarefa
      if (objective.includes('buscar') || objective.includes('pesquisar') || objective.includes('procurar') || objective.includes('encontrar')) {
        // Busca na internet
        const searchQuery = this.extractSearchQuery(this.state.objective);
        console.log('🌐 Fazendo busca na internet:', searchQuery);
        const results = await this.searchWeb(searchQuery);
        const summary = results.length > 0
          ? `Resultados da busca para "${searchQuery}":\n\n` + results.map((item, index) =>
              `${index + 1}. ${item.title}\n   ${item.url}\n   ${item.snippet.slice(0, 150)}...`
            ).join('\n\n')
          : 'Nenhum resultado encontrado.';

        this.state.lastResponse = summary;
        this.state.actions.push({ type: 'execute', text: summary, reason: 'Resultados da busca na web' });
        this.state.currentStep++;

        // Se pediu para abrir links, abrir os primeiros
        if (objective.includes('abrir') && results.length > 0) {
          console.log('🔗 Abrindo primeiros links...');
          for (let i = 0; i < Math.min(3, results.length); i++) {
            execSync(`powershell -Command "Start-Process '${results[i].url}'"`, { stdio: 'ignore' });
            this.state.actions.push({ type: 'open_url', url: results[i].url, reason: `Abrir link ${i + 1}` });
            this.state.currentStep++;
            await new Promise(resolve => setTimeout(resolve, 1000)); // Pequena pausa entre aberturas
          }
        }

      } else if ((objective.includes('abrir') || objective.includes('abra')) && (objective.includes('youtube') || objective.includes('youtub') || objective.includes('yt'))) {
        // Abrir YouTube com termo de busca - versão melhorada
        console.log('🎬 Detectado comando YouTube...');

        const youtubeSearch = this.extractYouTubeSearch(this.state.objective);
        console.log('🔍 Termo extraído:', youtubeSearch);

        if (youtubeSearch) {
          // Abrir YouTube com busca específica
          const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(youtubeSearch)}`;
          console.log('🌐 Abrindo URL:', searchUrl);

          try {
            execSync(`powershell -Command "Start-Process '${searchUrl}'"`, { stdio: 'ignore' });
            this.state.actions.push({
              type: 'open_url',
              url: searchUrl,
              reason: `Buscar "${youtubeSearch}" no YouTube`
            });
            this.state.currentStep++;
            console.log('✅ YouTube aberto com sucesso!');
          } catch (error) {
            console.error('❌ Erro ao abrir YouTube:', error);
            this.state.error = `Erro ao abrir YouTube: ${(error as Error).message}`;
          }
        } else {
          // Apenas abrir YouTube
          console.log('📺 Abrindo YouTube sem busca específica...');
          try {
            execSync('powershell -Command "Start-Process \'https://www.youtube.com\'"', { stdio: 'ignore' });
            this.state.actions.push({ type: 'open_url', url: 'https://www.youtube.com', reason: 'Abrir YouTube' });
            this.state.currentStep++;
            console.log('✅ YouTube aberto com sucesso!');
          } catch (error) {
            console.error('❌ Erro ao abrir YouTube:', error);
            this.state.error = `Erro ao abrir YouTube: ${(error as Error).message}`;
          }
        }

      } else if ((objective.includes('abrir') || objective.includes('abra')) && (objective.includes('google') || objective.includes('pesquisa'))) {
        // Abrir Google com termo de busca (ex: "abra google com react")
        console.log('🔍 Abrindo Google...');
        
        const googleSearch = this.extractGoogleSearch(this.state.objective);
        if (googleSearch) {
          // Abrir Google com busca específica
          const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(googleSearch)}`;
          execSync(`powershell -Command "Start-Process '${searchUrl}'"`, { stdio: 'ignore' });
          this.state.actions.push({ type: 'open_url', url: searchUrl, reason: `Pesquisar "${googleSearch}" no Google` });
          this.state.currentStep++;
        } else {
          // Apenas abrir Google
          execSync('powershell -Command "Start-Process \'https://www.google.com\'"', { stdio: 'ignore' });
          this.state.actions.push({ type: 'open_url', url: 'https://www.google.com', reason: 'Abrir Google' });
          this.state.currentStep++;
        }

      } else if ((objective.includes('abrir') || objective.includes('abra')) && (objective.includes('navegador') || objective.includes('chrome') || objective.includes('edge') || objective.includes('browser'))) {
        execSync('powershell -Command "Start-Process msedge.exe"', { stdio: 'ignore' });
        this.state.actions.push({ type: 'open_app', app: 'msedge.exe', reason: 'Abrir navegador Edge' });
        this.state.currentStep++;

        // Se especificou URL, navegar
        const urlMatch = this.state.objective.match(/(https?:\/\/[^\s]+)/);
        if (urlMatch) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          execSync(`powershell -Command "Start-Process '${urlMatch[1]}'"`, { stdio: 'ignore' });
          this.state.actions.push({ type: 'open_url', url: urlMatch[1], reason: 'Navegar para URL especificada' });
          this.state.currentStep++;
        }

        // Se pediu para ir ao Google ou YouTube
        if (objective.includes('google') || objective.includes('página') || objective.includes('pagina')) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          execSync('powershell -Command "Start-Process \'https://www.google.com\'"', { stdio: 'ignore' });
          this.state.actions.push({ type: 'open_url', url: 'https://www.google.com', reason: 'Abrir Google' });
          this.state.currentStep++;
        }

        if (objective.includes('youtube') || objective.includes('yt')) {
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Verificar se há um termo de busca específico
          const youtubeSearch = this.extractYouTubeSearch(this.state.objective);
          if (youtubeSearch) {
            // Abrir YouTube com busca específica
            const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(youtubeSearch)}`;
            execSync(`powershell -Command "Start-Process '${searchUrl}'"`, { stdio: 'ignore' });
            this.state.actions.push({ type: 'open_url', url: searchUrl, reason: `Buscar "${youtubeSearch}" no YouTube` });
            this.state.currentStep++;
          } else {
            // Apenas abrir YouTube
            execSync('powershell -Command "Start-Process \'https://www.youtube.com\'"', { stdio: 'ignore' });
            this.state.actions.push({ type: 'open_url', url: 'https://www.youtube.com', reason: 'Abrir YouTube' });
            this.state.currentStep++;
          }
        }

      } else if (objective.includes('notepad') || objective.includes('bloco de notas')) {
        // Abrir Bloco de Notas
        console.log('📝 Abrindo Bloco de Notas...');
        execSync('powershell -Command "Start-Process notepad.exe"', { stdio: 'ignore' });
        this.state.actions.push({ type: 'open_app', app: 'notepad.exe', reason: 'Abrir Bloco de Notas' });
        this.state.currentStep++;

      } else if (objective.includes('terminal') || objective.includes('cmd') || objective.includes('powershell')) {
        // Abrir terminal
        console.log('💻 Abrindo terminal...');
        execSync('powershell -Command "Start-Process powershell.exe"', { stdio: 'ignore' });
        this.state.actions.push({ type: 'open_app', app: 'powershell.exe', reason: 'Abrir PowerShell' });
        this.state.currentStep++;

      } else if (objective.includes('executar') || objective.includes('rodar') || objective.includes('comando')) {
        // Executar comando específico
        const command = this.extractCommand(this.state.objective);
        if (command) {
          console.log('⚡ Executando comando:', command);
          try {
            const result = execSync(command, { encoding: 'utf8', timeout: 10000 });
            this.state.lastResponse = `Comando executado com sucesso:\n${result}`;
            this.state.actions.push({ type: 'execute', command: command, reason: 'Executar comando do usuário' });
            this.state.currentStep++;
          } catch (error) {
            this.state.error = `Erro ao executar comando: ${(error as Error).message}`;
          }
        }

      } else {
        // Tarefa genérica - tentar interpretar
        console.log(`📌 Processando tarefa genérica: ${this.state.objective}`);
        this.state.lastResponse = `Tarefa "${this.state.objective}" foi interpretada, mas não implementada ainda. O agente pode: buscar na internet, abrir aplicações, executar comandos, etc.`;
        this.state.actions.push({ type: 'done', reason: 'Tarefa genérica processada' });
        this.state.currentStep++;
      }

      this.state.completed = true;
      this.state.status = 'completed';
      console.log('✅ Tarefa concluída com sucesso!');

    } catch (error) {
      console.error('❌ Erro no agente:', error);
      this.state.error = (error as Error).message;
      this.state.status = 'error';
    }

    return this.state;
  }

  private extractSearchQuery(objective: string): string {
    // Extrair termos de busca do objetivo
    const searchTerms = objective
      .replace(/buscar|pesquisar|procurar|encontrar/gi, '')
      .replace(/sobre|informações|dados|notícias/gi, '')
      .trim();

    return searchTerms || 'informações gerais';
  }

  private extractYouTubeSearch(objective: string): string | null {
    // Extrair termo de busca do YouTube - versão melhorada e mais robusta
    const objectiveLower = objective.toLowerCase();

    // Padrões mais abrangentes para detectar comandos YouTube
    const patterns = [
      // "abra o youtube com [termo]"
      /(?:abra|abrir|abre)\s+(?:o\s+)?(?:youtube|youtub|yt)\s+(?:com|de|sobre|buscar|pesquisar)\s+(.+)/i,
      // "youtube com [termo]"
      /(?:youtube|youtub|yt)\s+(?:com|de|sobre|buscar|pesquisar)\s+(.+)/i,
      // "[termo] no youtube"
      /(.+)\s+(?:no|em|no\s+o)\s+(?:youtube|youtub|yt)/i,
      // "buscar [termo] no youtube"
      /(?:buscar|pesquisar|procurar)\s+(.+)\s+(?:no|em|no\s+o)\s+(?:youtube|youtub|yt)/i,
      // "youtube [termo]" (simples)
      /(?:youtube|youtub|yt)\s+(.+)/i,
      // Caso específico: "abrir youtub com [termo]" (com erro de digitação)
      /(?:abrir|abra|abre)\s+(?:youtub|youtube|yt)\s+(?:com|de)\s+(.+)/i
    ];

    for (const pattern of patterns) {
      const match = objective.match(pattern);
      if (match && match[1]) {
        let searchTerm = match[1].trim();

        // Limpar termos desnecessários
        searchTerm = searchTerm
          .replace(/^(o|a|os|as)\s+/i, '') // remover artigos no início
          .replace(/\s+(o|a|os|as)$/i, '') // remover artigos no final
          .trim();

        // Se encontrou um termo válido, retornar
        if (searchTerm.length > 0) {
          console.log(`🎯 Extraído termo YouTube: "${searchTerm}"`);
          return searchTerm;
        }
      }
    }

    // Fallback: se contém "youtube" mas não conseguiu extrair, tentar pegar tudo após "com"
    if (objectiveLower.includes('youtube') || objectiveLower.includes('youtub') || objectiveLower.includes('yt')) {
      const comIndex = objectiveLower.indexOf(' com ');
      if (comIndex !== -1) {
        const searchTerm = objective.slice(comIndex + 5).trim();
        if (searchTerm.length > 0) {
          console.log(`🎯 Fallback extração YouTube: "${searchTerm}"`);
          return searchTerm;
        }
      }
    }

    return null;
  }

  private extractGoogleSearch(objective: string): string | null {
    // Extrair termo de busca do Google - versão melhorada
    const objectiveLower = objective.toLowerCase();

    // Padrões mais abrangentes para detectar comandos Google
    const patterns = [
      // "abra o google com [termo]"
      /(?:abra|abrir|abre)\s+(?:o\s+)?(?:google)\s+(?:com|de|sobre|buscar|pesquisar)\s+(.+)/i,
      // "google com [termo]"
      /(?:google)\s+(?:com|de|sobre|buscar|pesquisar)\s+(.+)/i,
      // "[termo] no google"
      /(.+)\s+(?:no|em|no\s+o)\s+(?:google)/i,
      // "buscar [termo] no google"
      /(?:buscar|pesquisar|procurar)\s+(.+)\s+(?:no|em|no\s+o)\s+(?:google)/i,
      // "google [termo]" (simples)
      /(?:google)\s+(.+)/i
    ];

    for (const pattern of patterns) {
      const match = objective.match(pattern);
      if (match && match[1]) {
        let searchTerm = match[1].trim();

        // Limpar termos desnecessários
        searchTerm = searchTerm
          .replace(/^(o|a|os|as)\s+/i, '') // remover artigos no início
          .replace(/\s+(o|a|os|as)$/i, '') // remover artigos no final
          .trim();

        // Se encontrou um termo válido, retornar
        if (searchTerm.length > 0) {
          console.log(`🎯 Extraído termo Google: "${searchTerm}"`);
          return searchTerm;
        }
      }
    }

    // Fallback: se contém "google" mas não conseguiu extrair, tentar pegar tudo após "com"
    if (objectiveLower.includes('google')) {
      const comIndex = objectiveLower.indexOf(' com ');
      if (comIndex !== -1) {
        const searchTerm = objective.slice(comIndex + 5).trim();
        if (searchTerm.length > 0) {
          console.log(`🎯 Fallback extração Google: "${searchTerm}"`);
          return searchTerm;
        }
      }
    }

    return null;
  }

  private async searchWeb(query: string): Promise<Array<{ title: string; url: string; snippet: string }>> {
    const encoded = encodeURIComponent(query);
    const searchUrl = `https://www.bing.com/search?q=${encoded}`;

    this.state.actions.push({ type: 'open_url', url: searchUrl, reason: 'Pesquisar na web' });
    this.state.currentStep++;

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      },
    });

    const html = await response.text();
    return this.parseSearchResults(html);
  }

  private parseSearchResults(html: string): Array<{ title: string; url: string; snippet: string }> {
    const results: Array<{ title: string; url: string; snippet: string }> = [];
    const itemRegex = /<li class="b_algo"[\s\S]*?<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?(?:<p>([\s\S]*?)<\/p>|<div class="b_caption">[\s\S]*?<p>([\s\S]*?)<\/p>)/gi;

    let match;
    while ((match = itemRegex.exec(html)) !== null && results.length < 8) {
      const url = match[1];
      const title = this.cleanText(match[2]);
      const snippet = this.cleanText(match[3] || match[4] || '');

      if (title && url) {
        results.push({ title, url, snippet });
      }
    }

    return results;
  }

  private cleanText(text: string): string {
    return text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  // Obter status
  getStatus(): AgentState {
    return this.state;
  }

  // Obter logs das ações
  getLogs(): { actions: AgentAction[] } {
    return { actions: this.state.actions };
  }
}

export default AutonomousAgent;