import { c as _c } from 'react/compiler-runtime'
import * as React from 'react'
import { Box, Text } from '../../ink'
import useInput from '../../ink/hooks/use-input'
import type { LocalJSXCommandOnDone } from '../../types/command'

const DEMO_PROMPT = 'Digite uma pergunta e pressione Enter para testar a demonstração.'

export async function call(
  onDone: LocalJSXCommandOnDone,
): Promise<React.ReactNode> {
  return <DemoAI onDone={onDone} />
}

type DialogEntry = {
  who: 'Você' | 'IA'
  text: string
}

function DemoAI({ onDone }: { onDone: LocalJSXCommandOnDone }) {
  const [input, setInput] = React.useState('')
  const [dialog, setDialog] = React.useState<DialogEntry[]>([])

  useInput((keyInput, key) => {
    if (key.return) {
      const question = input.trim()
      if (!question) return
      setDialog(prev => [
        ...prev,
        { who: 'Você', text: question },
        { who: 'IA', text: 'Enviando sua pergunta para o modelo...' },
      ].slice(-12))
      setInput('')
      onDone(undefined, {
        display: 'skip',
        nextInput: question,
        submitNextInput: true,
      })
      return
    }

    if (key.escape) {
      onDone('Demo de IA finalizada.')
      return
    }

    if (key.backspace) {
      setInput(prev => prev.slice(0, -1))
      return
    }

    if (key.ctrl || key.meta) {
      return
    }

    if (keyInput) {
      setInput(prev => prev + keyInput)
    }
  })

  const placeholder = input === '' ? DEMO_PROMPT : ''

  return (
    <Box flexDirection="column">
      <Box>
        <Text bold color="cyan">
          Demo de IA
        </Text>
      </Box>
      <Box>
        <Text dimColor>
          Digite um texto, pressione Enter para enviar a pergunta ao modelo. Pressione ESC para sair.
        </Text>
      </Box>
      <Box flexDirection="column" marginTop={1}>
        {dialog.length === 0 ? (
          <Text dimColor>Sem interações ainda.</Text>
        ) : (
          dialog.map((entry, index) => (
            <Box key={index} flexDirection="row">
              <Text color={entry.who === 'Você' ? 'green' : 'yellow'}>
                {entry.who}:{' '}
              </Text>
              <Text>{entry.text}</Text>
            </Box>
          ))
        )}
      </Box>
      <Box marginTop={1}>
        <Text color="cyan">› </Text>
        <Text>{input}</Text>
        {placeholder ? <Text dimColor>{placeholder}</Text> : null}
      </Box>
      <Box marginTop={1}>
        <Text dimColor>
          Use Backspace para apagar. ESC fecha a demo.
        </Text>
      </Box>
    </Box>
  )
}
