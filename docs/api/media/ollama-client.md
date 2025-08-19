# Ollama Client API Documentation

This document describes the local Ollama LLM API integration for the SimpleGraph project. The API is implemented in `src/llm/ollama-client.ts` and provides type-safe methods for text generation and chat using a local Ollama server.

## Overview

The `OllamaClient` class wraps the Ollama HTTP API, supporting:

- Single-shot text generation (`generate`)
- Multi-turn chat (`chat`)
- Health check for server reachability (`healthCheck`)

All API interfaces are fully typed and documented for Typedoc.

## Usage Example

```typescript
import { OllamaClient } from "./src/llm/ollama-client";

const client = new OllamaClient();

// Generate text
const text = await client.generate("Say hello world");
console.log(text);

// Chat
const chat = await client.chat([
  { role: "user", content: "What is the capital of France?" },
]);
console.log(chat);
```

## API Reference

See the Typedoc output for full details on all types and methods.

- `OllamaClient` constructor: accepts optional `model` and `baseUrl`.
- `generate(prompt: string): Promise<string>`: Generates text from a prompt.
- `chat(messages: OllamaChatMessage[]): Promise<string>`: Sends a chat session and returns the assistant's reply.
- `healthCheck(): Promise<boolean>`: Returns true if the Ollama server is reachable.

## Typedoc Generation

To generate API documentation:

```bash
bun run typedoc src/llm/ollama-client.ts --out docs/api/ollama-client
```

The generated documentation will be available in `docs/api/ollama-client/`.

## Notes

- Requires a running local Ollama server (default: http://localhost:11434) with the desired model pulled (e.g., gemma3:270m).
- All methods include error handling and will throw if the server is unreachable or returns an error.

---

For further details, see inline comments in `src/llm/ollama-client.ts` and the integration tests in `tests/integration/ollama-client.test.ts`.
