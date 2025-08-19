# Checklist: Implement Local Ollama Client Interface

## Phase 1: Scaffolding and Type Definitions

- [x] Create `src/llm/` directory.
- [x] Create `src/llm/ollama-client.ts`.
- [x] Define TypeScript interfaces:
  - [x] `OllamaGenerateRequest`
  - [x] `OllamaGenerateResponse`
  - [x] `OllamaChatMessage` (role, content)
  - [x] `OllamaChatRequest`
  - [x] `OllamaChatResponse`

## Phase 2: Client Class Implementation

- [x] Implement `OllamaClient` class in `ollama-client.ts`:
  - [x] Constructor accepts options: model name (default: gemma3:270m), baseUrl (default: http://localhost:11434)
  - [x] `generate(prompt: string): Promise<string>` method (calls `/api/generate`)
  - [x] `chat(messages: OllamaChatMessage[]): Promise<string>` method (calls `/api/chat`)
  - [x] Robust error handling for failed API requests

## Phase 3: Integration Test

- [x] Create `tests/integration/ollama-client.test.ts`
- [x] Add a comment or `describe.skip` noting the need for a running local Ollama instance with gemma3:270m model
- [x] Test instantiation of `OllamaClient`
- [x] Test `generate` method with a simple prompt (assert non-empty string)
- [x] Test `chat` method with a simple conversation (assert non-empty string)

## Verification

- [x] Run `bun tsc --noEmit` to confirm zero type errors
- [x] Run `bun test tests/integration/ollama-client.test.ts` to confirm OllamaClient tests pass

## Lessons Learned

- Only run targeted tests for new functionality to avoid unrelated failures (e.g., graph-pipeline-bun-test).
- Circle back to full test suite after core features are validated.
