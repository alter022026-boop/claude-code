#!/usr/bin/env bun
import { spawn, execSync } from 'child_process';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

// Tipos
interface AgentAction {
  type: 'click' | 'type' | 'press' | 'execute' | 'open_app' | 'open_url' | 'screenshot' | 'wait' | 'scroll' | 'done';
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
  screenshots: string[];
  lastResponse: string;
}

class AutonomousAgent {
  private state: AgentState;
  private maxSteps = 50;
  private stepDelay = 1000;

  constructor(taskId: string, objective: string) {
    this.state = {
      taskId,
      objective,
      currentStep: 0,
      completed: false,
      error: null,
      actions: [],
      screenshots: [],
      lastResponse: '',
    };
  }

  // Capturar screenshot usando PowerShell
  async captureScreenshot(): Promise<string> {
    const filename = join('/tmp', `screenshot-${Date.now()}.png`);
    
    const psScript = `
      Add-Type -AssemblyName System.Windows.Forms
      $screen = [System.Windows.Forms.Screen]::PrimaryScreen
      $bitmap = New-Object System.Drawing.Bitmap($screen.Bounds.Width, $screen.Bounds.Height)
      $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
      $graphics.CopyFromScreen($screen.Bounds.Location, [System.Drawing.Point]::Empty, $screen.Bounds.Size)
      $bitmap.Save("${filename}")
      $graphics.Dispose()
      $bitmap.Dispose()
      Write-Host "${filename}"
    `;

    try {
      const result = execSync(`powershell -Command "${psScript.replace(/"/g, '\\"')}"`, {
        encoding: 'utf-8',
      });
      const path = result.trim();
      this.state.screenshots.push(path);
      return path;
    } catch (error) {
      console.error('Erro ao capturar screenshot:', error);
      throw error;
    }
  }

  // Executar uma ação
  async executeAction(action: AgentAction): Promise<void> {
    console.log(`\n[Ação ${this.state.currentStep}] ${action.type}:`, action);

    switch (action.type) {
      case 'click':
        if (action.x && action.y) {
          this.executeClick(action.x, action.y);
        }
        break;

      case 'type':
        if (action.text) {
          this.executeType(action.text);
        }
        break;

      case 'press':
        if (action.key) {
          this.executeKeyPress(action.key);
        }
        break;

      case 'execute':
        if (action.command) {
          this.executeCommand(action.command);
        }
        break;

      case 'open_app':
        if (action.app) {
          this.openApplication(action.app);
        }
        break;

      case 'open_url':
        if (action.url) {
          this.openUrl(action.url);
        }
        break;

      case 'screenshot':
        await this.captureScreenshot();
        break;

      case 'wait':
        if (action.delay) {
          await new Promise(resolve => setTimeout(resolve, action.delay));
        }
        break;

      case 'scroll':
        if (action.direction && action.amount) {
          this.scroll(action.direction, action.amount);
        }
        break;

      case 'done':
        this.state.completed = true;
        console.log('✅ Tarefa concluída!');
        break;
    }

    this.state.actions.push(action);
  }

  // Usar Ollama para analisar screenshot e decidir ação
  async analyzeAndDecide(): Promise<AgentAction[]> {
    if (this.state.screenshots.length === 0) {
      await this.captureScreenshot();
    }

    const lastScreenshot = this.state.screenshots[this.state.screenshots.length - 1];
    
    // Para análise visual, vamos usar uma estratégia simplificada:
    // 1. Converter screenshot para base64
    // 2. Usar OCR ou análise de texto
    // 3. Usar Ollama para decidir ação

    const screenshotBase64 = readFileSync(lastScreenshot, 'base64');
    
    const prompt = `
Você é um agente autônomo que controla um computador.

OBJETIVO ATUAL: ${this.state.objective}

PASSOS COMPLETADOS: ${this.state.currentStep}

AÇÕES ANTERIORES:
${this.state.actions.map((a, i) => `${i + 1}. ${a.type}${a.reason ? ` - ${a.reason}` : ''}`).join('\n')}

Analisando a screenshot atual, o que você faz a seguir?

Responda com UMA ação no formato JSON:
{
  "type": "click|type|press|execute|open_app|open_url|screenshot|wait|scroll|done",
  "x": número,
  "y": número,
  "text": "texto para digitar",
  "key": "Enter|Tab|Escape|etc",
  "command": "comando PowerShell",
  "app": "nome do app",
  "url": "URL",
  "delay": milissegundos,
  "direction": "up|down|left|right",
  "amount": número de pixels,
  "reason": "por que você faz isso"
}

Se o objetivo foi alcançado, retorne tipo "done".
Se há um erro ou não consegue prosseguir, retorne tipo "done" com razão.
`;

    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-oss:120b-cloud',
          prompt: prompt,
          stream: false,
        }),
      });

      const data = await response.json();
      this.state.lastResponse = data.response;

      // Extrair JSON da resposta
      const jsonMatch = data.response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const action = JSON.parse(jsonMatch[0]) as AgentAction;
        return [action];
      }

      return [{ type: 'done', reason: 'Não consegui parsing da ação' }];
    } catch (error) {
      console.error('Erro ao analisar screenshot:', error);
      return [{ type: 'done', reason: 'Erro na análise' }];
    }
  }

  // Métodos auxiliares para executar ações
  private executeClick(x: number, y: number): void {
    const psScript = `
      Add-Type -AssemblyName System.Windows.Forms
      [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${x}, ${y})
      $ms = New-Object System.Windows.Forms.MouseEventArgs([System.Windows.Forms.MouseButtons]::Left, 1, ${x}, ${y}, 0)
      [System.Windows.Forms.SendKeys]::SendWait("{LBUTTON}")
    `;
    try {
      execSync(`powershell -Command "${psScript.replace(/"/g, '\\"')}"`, { stdio: 'ignore' });
    } catch (e) {
      // Continuar mesmo com erro
    }
  }

  private executeType(text: string): void {
    const escaped = text.replace(/"/g, '""');
    const psScript = `[System.Windows.Forms.SendKeys]::SendWait("${escaped}")`;
    try {
      execSync(`powershell -Command "${psScript.replace(/"/g, '\\"')}"`, { stdio: 'ignore' });
    } catch (e) {
      // Continuar mesmo com erro
    }
  }

  private executeKeyPress(key: string): void {
    const keyMap: { [key: string]: string } = {
      'Enter': '{ENTER}',
      'Tab': '{TAB}',
      'Escape': '{ESC}',
      'Space': ' ',
      'Backspace': '{BACKSPACE}',
      'Delete': '{DELETE}',
      'Home': '{HOME}',
      'End': '{END}',
      'PageUp': '{PAGEUP}',
      'PageDown': '{PAGEDOWN}',
    };
    const mappedKey = keyMap[key] || `{${key.toUpperCase()}}`;
    const psScript = `[System.Windows.Forms.SendKeys]::SendWait("${mappedKey}")`;
    try {
      execSync(`powershell -Command "${psScript.replace(/"/g, '\\"')}"`, { stdio: 'ignore' });
    } catch (e) {
      // Continuar mesmo com erro
    }
  }

  private executeCommand(command: string): void {
    try {
      execSync(command, { encoding: 'utf-8', stdio: 'inherit' });
    } catch (error) {
      console.error('Erro ao executar comando:', error);
    }
  }

  private openApplication(app: string): void {
    const psScript = `Start-Process "${app}"`;
    try {
      execSync(`powershell -Command "${psScript.replace(/"/g, '\\"')}"`, { stdio: 'ignore' });
    } catch (e) {
      // Continuar mesmo com erro
    }
  }

  private openUrl(url: string): void {
    const psScript = `Start-Process "${url}"`;
    try {
      execSync(`powershell -Command "${psScript.replace(/"/g, '\\"')}"`, { stdio: 'ignore' });
    } catch (e) {
      // Continuar mesmo com erro
    }
  }

  private scroll(direction: string, amount: number): void {
    const delta = direction === 'down' || direction === 'right' ? -amount : amount;
    const psScript = `[System.Windows.Forms.SendKeys]::SendWait("${direction === 'down' ? '{PAGEDOWN}' : '{PAGEUP}'}")`;
    try {
      execSync(`powershell -Command "${psScript.replace(/"/g, '\\"')}"`, { stdio: 'ignore' });
    } catch (e) {
      // Continuar mesmo com erro
    }
  }

  // Loop principal do agente
  async run(): Promise<AgentState> {
    console.log(`\n🤖 Iniciando agente autônomo para: "${this.state.objective}"\n`);

    while (!this.state.completed && this.state.currentStep < this.maxSteps) {
      this.state.currentStep++;

      try {
        // Capturar screenshot
        await this.captureScreenshot();
        
        // Analisar e decidir ação
        const actions = await this.analyzeAndDecide();
        
        // Executar ação
        for (const action of actions) {
          await this.executeAction(action);
          
          if (action.type === 'done') {
            this.state.completed = true;
            break;
          }
        }

        // Aguardar antes do próximo passo
        if (!this.state.completed) {
          await new Promise(resolve => setTimeout(resolve, this.stepDelay));
        }
      } catch (error) {
        this.state.error = (error as Error).message;
        console.error('Erro no agente:', error);
        break;
      }
    }

    if (this.state.currentStep >= this.maxSteps) {
      this.state.error = 'Limite de passos atingido';
    }

    return this.state;
  }

  // Obter status
  getStatus(): AgentState {
    return this.state;
  }
}

export default AutonomousAgent;
