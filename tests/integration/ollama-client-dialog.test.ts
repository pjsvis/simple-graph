import { OllamaClient, OllamaChatMessage } from '../../src/llm/ollama-client';
import { describe, it, expect } from 'bun:test';
import { writeFileSync } from 'fs';
import { join } from 'path';

const DIALOG_FILE = join(__dirname, `ollama-dialog-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`);
const DESCRIPTION = 'Ollama chat session test: simple Q&A dialog.';

describe('OllamaClient dialog session', () => {
  it('should run a chat session and write dialog to file', async () => {
    const client = new OllamaClient();
    const messages: OllamaChatMessage[] = [
      { role: 'user', content: 'Hello! What is your name?' },
      { role: 'user', content: 'Can you tell me a fun fact about AI?' },
      { role: 'user', content: 'What is the capital of France?' }
    ];
    const response = await client.chat(messages);
    const now = new Date().toISOString();
    const log = `Date: ${now}\nDescription: ${DESCRIPTION}\n\nUser Messages:\n${messages.map(m => m.content).join('\n')}\n\nLLM Response:\n${response}\n`;
    writeFileSync(DIALOG_FILE, log);
    expect(typeof response).toBe('string');
    expect(response.length).toBeGreaterThan(0);
  });
});
