# 🎨 DOT Graph Visualizer for CDA Knowledge Graph

A comprehensive visualization solution for the Core Directive Array (CDA) knowledge graph using Graphviz DOT format.

## 🎯 Overview

This visualizer transforms our enhanced CDA knowledge graph into beautiful, interactive visualizations that reveal:

- **Directive relationships** and dependencies
- **Category interconnections** and bridges
- **Semantic clusters** and inspirational sources
- **Hub nodes** and authority directives
- **Network topology** with multiple layout algorithms

## 📊 Generated Visualizations

### **Core Visualizations**

1. **`complete-knowledge-graph.dot`** - Full network overview with all nodes and relationships
2. **`directives-only.dot`** - Directive network using Neato force-directed layout
3. **`relationships-network.dot`** - Focus on relationship types and patterns

### **Category-Specific Views**

4. **`category-adv.dot`** - Advanced Directives (8 nodes)
5. **`category-cog.dot`** - Cognitive Strategies (10 nodes)
6. **`category-phi.dot`** - Processing Philosophy (10 nodes)
7. **`category-qpg.dot`** - Query Processing Guidelines (10 nodes)
8. **`category-opm.dot`** - Operational Protocol Management (10 nodes)

### **Specialized Analysis**

9. **`cross-category-bridges.dot`** - Inter-category connections and bridges
10. **`inspirational-clusters.dot`** - Groupings by inspirational sources (McLuhan, HSE, A-Covert, etc.)
11. **`semantic-similarity.dot`** - Semantic relationship network
12. **`hub-authority.dot`** - Central hub nodes and authority directives

### **Layout Comparisons**

13. **`layout-hierarchical.dot`** - Hierarchical top-down (dot)
14. **`layout-force-directed.dot`** - Force-directed spring model (neato)
15. **`layout-spring-model.dot`** - Spring model for large graphs (fdp)
16. **`layout-circular.dot`** - Circular layout (circo)
17. **`layout-radial.dot`** - Radial layout (twopi)

## 🚀 Quick Start

### **1. Generate DOT Files**

```bash
# Generate all visualization files
npm run test:run dot-graph-visualization.test.ts

# Or run the simple test for basic files
npm run test:run dot-graph-simple.test.ts
```

### **2. Install Graphviz**

```bash
# Windows (with Chocolatey)
choco install graphviz

# macOS (with Homebrew)
brew install graphviz

# Ubuntu/Debian
sudo apt-get install graphviz
```

### **3. Render to Visual Formats**

```bash
# Render to SVG (recommended - scalable, interactive)
dot -Tsvg graph-visualizations/complete-knowledge-graph.dot -o complete-graph.svg

# Render to PNG (high-resolution)
dot -Tpng -Gdpi=300 graph-visualizations/complete-knowledge-graph.dot -o complete-graph.png

# Render to PDF (print-ready)
dot -Tpdf graph-visualizations/complete-knowledge-graph.dot -o complete-graph.pdf
```

### **4. Batch Rendering (Future)**

```bash
# Render all graphs to multiple formats
npm run render-graphs

# Generate visualizations and render them
npm run generate-visualizations
```

## 🎨 Visualization Features

### **Node Styling**

- **Directives**: Blue boxes with directive IDs and titles
- **CDA Metadata**: Orange ellipses with version information
- **OH Terms**: Purple diamonds (when integrated)
- **Core Concepts**: Green hexagons (when available)

### **Edge Styling**

- **References**: Solid blue lines (original relationships)
- **Semantic Similarity**: Dashed green lines (theme-based connections)
- **Shared Inspiration**: Dotted purple lines (McLuhan, HSE, etc.)
- **Category Bridges**: Bold orange lines (inter-category connections)
- **Keyword Similarity**: Solid brown lines (keyword-based connections)

### **Layout Options**

- **Hierarchical (dot)**: Best for showing directive hierarchies and dependencies
- **Force-Directed (neato)**: Reveals natural clustering and relationships
- **Spring Model (fdp)**: Optimized for large graphs with many connections
- **Circular (circo)**: Good for showing category relationships
- **Radial (twopi)**: Centers important nodes with radiating connections

## 📋 Key Insights from Visualizations

### **Hub Nodes (Most Connected)**

1. **COG-6**: Ambiguity Cartography (7 incoming connections)
2. **OPM-8**: Conceptual Lexicon Management (7 incoming connections)
3. **COG-9**: Structural Impact Assessment (6 incoming connections)
4. **QPG-9**: Query Processing Guidelines (5 incoming connections)
5. **ADV-2**: Uncertainty Expression (4 incoming connections)

### **Network Statistics**

- **86 total nodes**: 85 directives + 1 CDA metadata
- **189 total edges**: 85 memberships + 104 relationships
- **15 categories**: From CIP (3 directives) to QPG (10 directives)
- **8 relationship types**: From original references to enhanced semantic connections

### **Connectivity Improvement**

- **Before Enhancement**: 62 isolated directives (73% disconnected)
- **After Enhancement**: 31 isolated directives (36% disconnected)
- **Improvement**: 50% reduction in isolation, 137% increase in connectivity

## 🔧 Customization

### **Configuration Options**

The `DotGraphConfig` interface supports extensive customization:

```typescript
const config: Partial<DotGraphConfig> = {
  // Layout and appearance
  layout: "dot" | "neato" | "fdp" | "sfdp" | "circo" | "twopi",
  rankdir: "TB" | "BT" | "LR" | "RL",

  // Filtering
  includeNodeTypes: ["directive", "cda", "oh_term"],
  includeEdgeTypes: ["references", "semantic_similarity"],
  includeCategories: ["ADV", "COG", "PHI"],
  maxEdges: 100,

  // Styling
  nodeColors: { directive: "#E3F2FD" },
  edgeColors: { references: "#1976D2" },

  // Clustering
  clusterByCategory: true,
  clusterByNodeType: false,

  // Labels
  showNodeLabels: true,
  showEdgeLabels: false,
  maxLabelLength: 30,
};
```

### **Creating Custom Views**

```typescript
// Focus on specific categories
const advCogView = {
  includeCategories: ["ADV", "COG"],
  layout: "neato",
  title: "Advanced Directives & Cognitive Strategies",
};

// Relationship-specific view
const semanticView = {
  includeEdgeTypes: ["semantic_similarity", "keyword_similarity"],
  showEdgeLabels: true,
  title: "Semantic Relationship Network",
};
```

## 🌐 Interactive Exploration

### **SVG Benefits**

- **Scalable**: Zoom without quality loss
- **Interactive**: Hover tooltips with directive details
- **Searchable**: Browser find function works on node labels
- **Lightweight**: Smaller file sizes than high-res PNG

### **Recommended Workflow**

1. **Start with `complete-knowledge-graph.svg`** for overview
2. **Explore category-specific views** for detailed analysis
3. **Use layout comparisons** to find optimal visualization
4. **Focus on relationship networks** for connection patterns
5. **Examine hub-authority view** for central nodes

## 📁 File Organization

```
graph-visualizations/
├── complete-knowledge-graph.dot     # Full network overview
├── directives-only.dot              # Directive network only
├── relationships-network.dot        # Relationship-focused view
├── category-*.dot                   # Individual category networks
├── cross-category-bridges.dot       # Inter-category connections
├── inspirational-clusters.dot       # Inspirational source groups
├── semantic-similarity.dot          # Semantic relationship network
├── hub-authority.dot               # Central nodes visualization
├── layout-*.dot                    # Different layout comparisons
├── minimal-example.dot             # Simple example for testing
└── simple-test.dot                 # Basic test output
```

## 🎯 Use Cases

### **Research & Analysis**

- **Directive Dependencies**: Understand which directives reference others
- **Category Relationships**: See how different directive categories interact
- **Semantic Clustering**: Find thematically related directives
- **Hub Analysis**: Identify central, critical directives

### **System Design**

- **Architecture Visualization**: See the overall system structure
- **Integration Points**: Find connections between subsystems
- **Optimization Opportunities**: Identify under-connected areas
- **Evolution Planning**: Understand current state for future enhancements

### **Documentation & Communication**

- **Visual Documentation**: Replace text descriptions with clear diagrams
- **Stakeholder Communication**: Show system complexity and relationships
- **Training Materials**: Help new team members understand the system
- **Presentation Graphics**: High-quality visuals for reports and presentations

## 🚀 Future Enhancements

### **Planned Features**

- **Automatic rendering script** with batch processing
- **HTML index generation** for easy browsing
- **Interactive web viewer** with filtering and search
- **Temporal visualization** showing directive evolution
- **Performance metrics** overlay on visualizations
- **Export to other formats** (Gephi, Cytoscape, etc.)

---

**🎨 The DOT Graph Visualizer transforms complex knowledge relationships into beautiful, insightful visualizations that reveal the hidden structure of the CDA knowledge graph!**
