# 🌐 Simple Graph - Knowledge Graph System

A comprehensive knowledge graph system for analyzing and visualizing the Core Directive Array (CDA) and Conceptual Lexicon.

## 🚀 Quick Start

> **⚡ Node.js & Bun Compatible**: This project now supports both [Node.js](https://nodejs.org/) and [Bun](https://bun.sh) runtimes.

### Node.js Usage

```bash
# Install dependencies
npm install

# Run tests
npm run test

# Generate visualizations
npm run generate-visualizations

# View results
open outputs/images/index.html
```

### Bun Usage (optional)

```bash
# Install dependencies
bun install

# Run tests
bun test

# Generate visualizations
bun run generate-visualizations

# View results
open outputs/images/index.html
```

## 📁 Project Structure

- **`src/`** - Core source code
- **`data/`** - Input data and databases
- **`outputs/`** - Generated visualizations and reports
- **`tests/`** - Test suites
- **`docs/`** - Documentation
- **`scripts/`** - Automation scripts

## 📚 Documentation

See `docs/` for comprehensive guides and API documentation.

## 🎨 Visualizations

Generated visualizations are available in `outputs/images/` with an interactive HTML browser.

## 🧪 Testing

```bash
# Node.js
npm run test              # Run all tests
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only

# Bun
bun test                  # Run all tests
bun run test:unit         # Unit tests only
bun run test:integration  # Integration tests only
```

## ⚙️ Environment Variables

- `SIMPLE_GRAPH_DB_PATH`: Specifies the absolute path to the SQLite database file that the CLI (`src/cli.ts`) should connect to. If not set, the CLI defaults to `cda-import-test.db`.

## 📊 Analysis

The system provides comprehensive analysis of:

- Directive relationships and dependencies
- Hub and authority nodes
- Semantic clustering
- Category interconnections

---

### Built with TypeScript, SQLite, Graphviz, Node.js, and Bun
