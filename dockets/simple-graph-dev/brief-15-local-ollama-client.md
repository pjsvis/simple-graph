# **Brief: Implement Local Ollama Client Interface**

## **1\. Objective**

To create a reusable, type-safe TypeScript module for interacting with a local Ollama server. This module will serve as the primary interface for all local LLM-powered features within the simple-graph project, starting with the gemma3:270m model.

## **2\. Memory Shard (MSM)**

* **Context**: We require local LLM capabilities to power advanced features like the semantic validation of persona graph nodes and automated data enrichment.  
* **Reasoning**: Using a local Ollama instance provides a fast, private, and cost-effective solution for development and testing. A dedicated client class is necessary to abstract the underlying fetch API calls, ensuring that interactions with the LLM are clean, reusable, and type-safe.  
* **Decision**: We will implement a new OllamaClient class. This client will support both single-shot text generation (/api/generate) and multi-turn conversational chat (/api/chat) to provide maximum flexibility for future use cases.

## **3\. Technical Implementation Plan**

### **Phase 1: Scaffolding and Type Definitions**

1. Create a new directory: src/llm/.  
2. Create a new file within this directory: ollama-client.ts.  
3. In this file, define the necessary TypeScript interfaces for the Ollama API payloads, including:  
   * OllamaGenerateRequest and OllamaGenerateResponse.  
   * OllamaChatMessage (with role and content).  
   * OllamaChatRequest and OllamaChatResponse.

### **Phase 2: Client Class Implementation**

1. In ollama-client.ts, implement an OllamaClient class.  
2. The constructor should accept an options object containing the model name (defaulting to gemma3:270m) and the baseUrl (defaulting to http://localhost:11434).  
3. Implement an async generate(prompt: string): Promise\<string\> method that sends a request to the /api/generate endpoint and returns the response text.  
4. Implement an async chat(messages: OllamaChatMessage\[\]): Promise\<string\> method that sends a request to the /api/chat endpoint and returns the content of the resulting message.  
5. Ensure robust error handling for failed API requests.

### **Phase 3: Integration Test**

1. Create a new test file: tests/integration/ollama-client.test.ts.  
2. This test will require a running local Ollama instance with the gemma3:270m model pulled. Add a descriptive describe.skip or comment indicating this prerequisite.  
3. Write a test case that instantiates the OllamaClient.  
4. Write a test that calls the generate method with a simple prompt and asserts that the response is a non-empty string.  
5. Write a test that calls the chat method with a simple conversation and asserts that the response is a non-empty string.

## **4\. Verification**

* The agent **must** run bun tsc \--noEmit to confirm there are no type errors.  
* The agent **must** run bun test to confirm that all new and existing tests pass.