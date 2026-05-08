import type { Command } from '../../commands'

const demoAI = {
  type: 'local-jsx',
  name: 'demo-ai',
  aliases: ['demo-ui', 'demo'],
  description: 'Abrir uma interface gráfica de demonstração de IA e enviar a pergunta ao modelo',
  load: () => import('./demo-ai.tsx'),
} satisfies Command

export default demoAI
