/**
 * Request payload for Ollama /api/generate endpoint.
 * @example
 * const req: OllamaGenerateRequest = { model: 'gemma3:270m', prompt: 'Hello world' };
 */
export interface OllamaGenerateRequest {
  /** Model name, e.g. 'gemma3:270m' */
  model: string;
  /** Prompt to send to the LLM */
  prompt: string;
}

/**
 * Response from Ollama /api/generate endpoint.
 * @example
 * const res: OllamaGenerateResponse = { response: 'Hello world!' };
 */
export interface OllamaGenerateResponse {
  /** Generated text from the LLM */
  response: string;
}

/**
 * Message object for Ollama chat API.
 * @example
 * const msg: OllamaChatMessage = { role: 'user', content: 'Hi!' };
 */
export interface OllamaChatMessage {
  /** Message role: 'user', 'assistant', or 'system' */
  role: 'user' | 'assistant' | 'system';
  /** Message content */
  content: string;
}

/**
 * Request payload for Ollama /api/chat endpoint.
 * @example
 * const req: OllamaChatRequest = { model: 'gemma3:270m', messages: [ ... ] };
 */
export interface OllamaChatRequest {
  /** Model name */
  model: string;
  /** Array of chat messages */
  messages: OllamaChatMessage[];
}

/**
 * Response from Ollama /api/chat endpoint.
 * @example
 * const res: OllamaChatResponse = { message: { role: 'assistant', content: 'Hello!' } };
 */
export interface OllamaChatResponse {
  /** Assistant message returned from the LLM */
  message: OllamaChatMessage;
}

/**
 * OllamaClient provides a type-safe interface to a local Ollama server.
 * Supports single-shot text generation and multi-turn chat.
 *
 * @example
 * const client = new OllamaClient();
 * const text = await client.generate('Hello world');
 * const chat = await client.chat([{ role: 'user', content: 'Hi!' }]);
 */
export class OllamaClient {
  private model: string;
  private baseUrl: string;

  /**
   * Create a new OllamaClient instance.
   * @param options Optional configuration: model name and base URL
   * @example
   * const client = new OllamaClient({ model: 'gemma3:270m', baseUrl: 'http://localhost:11434' });
   */
  constructor(options?: { model?: string; baseUrl?: string }) {
    this.model = options?.model ?? 'gemma3:270m';
    this.baseUrl = options?.baseUrl ?? 'http://localhost:11434';
  }

  /**
   * Check if the Ollama server is reachable and healthy.
   * @returns true if the server responds to /api/tags
   * @example
   * const healthy = await client.healthCheck();
   */
  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Generate text from a prompt using the Ollama /api/generate endpoint.
   * Handles streaming JSON lines.
   * @param prompt The prompt to send to the LLM
   * @returns Generated text from the LLM
   * @example
   * const text = await client.generate('Say hello world');
   */
  async generate(prompt: string): Promise<string> {
    if (!(await this.healthCheck())) {
      throw new Error(`Ollama server not reachable at ${this.baseUrl}`);
    }
    const payload: OllamaGenerateRequest = { model: this.model, prompt };
    try {
      const res = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Ollama generate failed: ${res.status}`);
      const raw = await res.text();
      // Ollama streams JSON objects, one per line
      const lines = raw.split(/\r?\n/).filter(Boolean);
      let output = '';
      for (const line of lines) {
        try {
          const obj = JSON.parse(line);
          if (typeof obj.response === 'string') {
            output += obj.response;
          }
        } catch (jsonErr) {
          console.error('Failed to parse line as JSON:', line);
        }
      }
      if (!output) {
        throw new Error('No valid response found in Ollama generate output');
      }
      return output;
    } catch (err) {
      throw new Error(`OllamaClient.generate error: ${err}`);
    }
  }

  /**
   * Send a multi-turn chat to the Ollama /api/chat endpoint.
   * Handles streaming JSON lines.
   * @param messages Array of chat messages
   * @returns Assistant's response as a string
   * @example
   * const chat = await client.chat([{ role: 'user', content: 'What is the capital of France?' }]);
   */
  async chat(messages: OllamaChatMessage[]): Promise<string> {
    if (!(await this.healthCheck())) {
      throw new Error(`Ollama server not reachable at ${this.baseUrl}`);
    }
    const payload: OllamaChatRequest = { model: this.model, messages };
    try {
      const res = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Ollama chat failed: ${res.status}`);
      const raw = await res.text();
      // Ollama streams JSON objects, one per line
      const lines = raw.split(/\r?\n/).filter(Boolean);
      let output = '';
      for (const line of lines) {
        try {
          const obj = JSON.parse(line);
          if (obj.message && typeof obj.message.content === 'string') {
            output += obj.message.content;
          }
        } catch (jsonErr) {
          console.error('Failed to parse line as JSON:', line);
        }
      }
      if (!output) {
        throw new Error('No valid message content found in Ollama chat response');
      }
      return output;
    } catch (err) {
      throw new Error(`OllamaClient.chat error: ${err}`);
    }
  }
}
