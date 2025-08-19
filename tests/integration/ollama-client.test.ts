import { OllamaClient, OllamaChatMessage } from '../../src/llm/ollama-client';
import { describe, it, expect } from 'bun:test';

// NOTE: These tests require a running local Ollama instance with the gemma3:270m model pulled.
describe('OllamaClient (requires local Ollama)', () => {
  const client = new OllamaClient();

  it('should confirm Ollama server is reachable', async () => {
    const healthy = await client.healthCheck();
    expect(typeof healthy).toBe('boolean');
    expect(healthy).toBe(true);
  });

  it('should generate text from a prompt', async () => {
    if (!(await client.healthCheck())) {
      throw new Error('Ollama server not reachable, skipping test');
    }
    const response = await client.generate('Say hello world');
    expect(typeof response).toBe('string');
    expect(response.length).toBeGreaterThan(0);
  });

  it('should handle a simple chat conversation', async () => {
    if (!(await client.healthCheck())) {
      throw new Error('Ollama server not reachable, skipping test');
    }
    const messages: OllamaChatMessage[] = [
      { role: 'user', content: 'What is the capital of France?' }
    ];
    // Increase timeout for slow streaming responses
    const response = await client.chat(messages);
    expect(typeof response).toBe('string');
    expect(response.length).toBeGreaterThan(0);
  }, 15000);
});
