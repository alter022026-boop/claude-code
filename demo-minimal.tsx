#!/usr/bin/env bun
import React from 'react';
import { render, Text, Box } from 'ink';
import { Anthropic } from '@anthropic-ai/sdk';
import readline from 'readline';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const App = () => {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [input, setInput] = React.useState('');

  React.useEffect(() => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const handleInput = async (line: string) => {
      if (!line.trim()) return;

      const userMessage = line.trim();
      setInput('');
      
      // Add user message to chat
      const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
      setMessages(newMessages);
      setLoading(true);

      try {
        // Call Anthropic API
        const response = await client.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          messages: newMessages,
        });

        const assistantMessage = response.content[0].type === 'text' 
          ? response.content[0].text 
          : 'Erro ao processar resposta';

        setMessages([...newMessages, { role: 'assistant', content: assistantMessage }]);
      } catch (error: any) {
        const errorMsg = error.message || 'Erro ao conectar com a API';
        setMessages([...newMessages, { role: 'assistant', content: `❌ Erro: ${errorMsg}` }]);
      } finally {
        setLoading(false);
      }
    };

    // Setup stdin listener
    rl.on('line', handleInput);

    return () => {
      rl.close();
    };
  }, [messages]);

  return React.createElement(Box, { flexDirection: 'column', padding: 1 },
    React.createElement(Text, { bold: true, color: 'cyan' }, '🤖 Claude Code Demo - AI Assistant'),
    React.createElement(Text, null, ''),
    
    // Display chat history
    messages.length === 0 
      ? React.createElement(Text, { color: 'gray' }, 'Começe digitando sua pergunta...')
      : React.createElement(Box, { flexDirection: 'column' },
          messages.map((msg, idx) =>
            React.createElement(Box, { key: idx, flexDirection: 'column', marginBottom: 1 },
              React.createElement(Text, { 
                color: msg.role === 'user' ? 'blue' : 'green',
                bold: true 
              }, msg.role === 'user' ? '👤 Você:' : '🤖 Claude:'),
              React.createElement(Text, { 
                color: msg.role === 'user' ? 'cyan' : 'white',
                wrap: 'word'
              }, msg.content)
            )
          )
        ),
    
    React.createElement(Text, null, ''),
    
    // Loading indicator
    loading 
      ? React.createElement(Text, { color: 'yellow' }, '⏳ Aguardando resposta...')
      : React.createElement(Text, { color: 'gray' }, '> Digite sua pergunta (Ctrl+C para sair):'),
  );
};

render(React.createElement(App));
