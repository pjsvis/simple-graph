### ## Brief: 006-local-mcp-server

- **Docket**: simple-graph-dev
- **Title**: Implement a local Model Control Protocol (MCP) server.
- **Objective**: To wrap the `SimpleGraph` API in a local web server that exposes its functionality via an MCP-compliant interface.
- **Rationale**: This is the final and most strategic step, transforming our library from a script that can be called via `bash` into a formal **tool** that an agentic AI can reason about and use as part of complex, multi-step tasks. It is the foundation for true agentic interaction with our knowledge graph.

---

### ## Key Requirements

1.  **Web Server Setup**: Create a simple, lightweight web server using a library like `Express.js`.
2.  **MCP Endpoint**: The server must expose a single POST endpoint (e.g., `/mcp`).
3.  **JSON-RPC Handling**: The server must be able to handle JSON-RPC 2.0 requests, which is a common standard for MCP implementations. The request body will specify the `method` to call (e.g., `"graph.nodes.get"`) and the `params`.
4.  **API Integration**: The server will instantiate a `SimpleGraph` instance and route incoming MCP requests to the corresponding API methods.
5.  **Process Management**: The server should be runnable as a background process from the command line.

---

### ## Acceptance Criteria

1.  **Health Check Test**: An integration test must be written that makes a simple GET request to a health check endpoint (e.g., `/health`) on the running server to verify it is active.
2.  **MCP Request Test**: An integration test must be written that sends a valid JSON-RPC request to the `/mcp` endpoint (e.g., to get the genesis node) and asserts that the server returns a valid JSON-RPC response with the correct data.

## Proposed Naming Convention

Using "origami" as the root, the two NPM packages could be named:

Core API: @your-org/origami-core

MCP Server: @your-org/origami-mcp

This is a clean, professional, and descriptive naming scheme.
