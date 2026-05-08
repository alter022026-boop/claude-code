# Claude Code - AI Chat System

Uma plataforma poderosa de IA com interface web, integrada com Ollama (IA local) e Claude API.

## 🎯 Recursos

- ✅ **Chat Web Moderno** - Interface bonita e responsiva
- ✅ **Ollama Local** - Roda IA privadamente sem internet
- ✅ **Multi-Modelo** - Suporte para Llama, Mistral, Granite, GPT-OSS
- ✅ **Terminal CLI** - Interface para power users
- ✅ **Histórico de Conversa** - Contexto persistente
- ✅ **API REST** - Integração fácil com outras apps

## 🚀 Quick Start

### Pré-requisitos
- Bun runtime: https://bun.sh
- Ollama instalado: https://ollama.ai

### Instalação

```bash
# Clonar o repositório
git clone https://github.com/seu-usuario/claude-code.git
cd claude-code/src

# Instalar dependências (já estão no bun.lock)
bun install

# Iniciar Ollama em outro terminal
ollama serve

# Download de um modelo (ex: mistral)
ollama pull mistral
```

### Rodar o Projeto

```bash
# Iniciar tudo automaticamente
bun setup

# Ou individualmente:
bun chat          # Só o servidor
bun demo          # Interface terminal
```

Acesse: **http://localhost:3000**

## 📁 Estrutura do Projeto

```
src/
├── server-ollama.ts       # Servidor Express + API Ollama
├── demo-minimal.tsx       # Demo interativa no terminal
├── setup-chat.ts          # Script de setup automático
├── public/
│   └── index.html         # UI web moderna
├── commands/              # Sistema de commands
├── services/              # Integração com IA
├── utils/                 # Utilitários
└── package.json           # Dependências
```

## 🛠️ Tecnologias

- **Bun** - Runtime JavaScript ultra-rápido
- **Express.js** - Servidor web
- **React + Ink** - UI no terminal
- **Ollama** - IA local open-source
- **TypeScript** - Type-safe development
- **Claude API** - IA premium (opcional)

## 📋 Comandos Disponíveis

```bash
bun setup          # Setup automático + inicia tudo
bun chat           # Inicia servidor na porta 3000
bun demo           # Interface de chat no terminal
bun start          # Entry point principal
```

## 🔌 API Endpoints

```
GET  /api/health       # Status do servidor
GET  /api/models       # Lista modelos do Ollama
POST /api/chat         # Enviar mensagem
POST /api/clear        # Limpar histórico
```

## 🎨 UI Features

- 💬 Chat interativo em tempo real
- 🤖 Múltiplos modelos de IA
- 📊 Seletor de modelos
- 🔄 Histórico persistente
- ⚡ Carregamento visual
- 📱 Responsivo em mobile

## 🔧 Configuração

### Variáveis de Ambiente

```bash
# .env (opcional)
OLLAMA_API=http://localhost:11434
ANTHROPIC_API_KEY=sua-chave-aqui
PORT=3000
```

## 🚀 Deploy

### Render.com (Gratuito)

```bash
git push origin main
# Criar novo Web Service no Render
# Conectar este repositório
# Build: bun install
# Start: bun chat
```

### Vercel

```bash
vercel --prod
```

### Docker

```dockerfile
FROM oven/bun:latest
WORKDIR /app
COPY . .
RUN bun install
CMD ["bun", "chat"]
```

```bash
docker build -t claude-code .
docker run -p 3000:3000 claude-code
```

## 📝 Exemplos de Uso

### Via Web UI
1. Abra http://localhost:3000
2. Escolha um modelo
3. Digite sua pergunta
4. Aguarde a resposta

### Via Terminal
```bash
bun demo
```

### Via API
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Olá!", "model": "mistral"}'
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

MIT License - veja LICENSE para detalhes

## 🆘 Troubleshooting

### Ollama não conecta
```bash
# Verifique se Ollama está rodando
ollama serve

# Teste a conexão
curl http://localhost:11434/api/tags
```

### Nenhum modelo disponível
```bash
ollama pull mistral
```

### Porta 3000 em uso
```bash
# Mudar a porta no server-ollama.ts
const PORT = 3001;
```

## 📞 Suporte

- Issues: https://github.com/seu-usuario/claude-code/issues
- Discussões: https://github.com/seu-usuario/claude-code/discussions

## 🌟 Roadmap

- [ ] Autenticação de usuários
- [ ] Banco de dados persistente
- [ ] Upload de arquivos
- [ ] Integração com GitHub
- [ ] Voice input/output
- [ ] Vision (análise de imagens)
- [ ] Agents autônomos
- [ ] Multi-usuário colaborativo

---

**Desenvolvido com ❤️ usando Bun + React + Ollama**
