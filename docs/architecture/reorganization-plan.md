# 📁 Project Reorganization Plan

## 🎯 **Current State → Proposed Structure**

### **Current Issues**

- Files scattered across root directory
- Mixed concerns (database, visualization, analysis)
- No clear separation between source code, data, and outputs
- Test files mixed with production code
- Documentation spread across multiple files

### **Proposed Professional Structure**

```text
simple-graph/
├── 📁 src/                           # Core source code
│   ├── 📁 database/                  # Database operations
│   │   ├── schema.ts                 # Database schema definition
│   │   ├── insert-node.ts            # Node insertion operations
│   │   ├── insert-edge.ts            # Edge insertion operations
│   │   └── migrations/               # Future schema migrations
│   │
│   ├── 📁 parsers/                   # Data parsing and import
│   │   ├── conceptual-lexicon.ts     # CL YAML parser
│   │   ├── cda-parser.ts             # CDA markdown parser
│   │   └── base-parser.ts            # Common parsing utilities
│   │
│   ├── 📁 analysis/                  # Graph analysis tools
│   │   ├── connectivity.ts           # Connectivity analysis
│   │   ├── hub-detection.ts          # Hub and authority analysis
│   │   ├── clustering.ts             # Semantic clustering
│   │   └── enhancement.ts            # Graph enhancement algorithms
│   │
│   ├── 📁 visualization/             # Visualization generation
│   │   ├── dot-generator.ts          # DOT graph generation
│   │   ├── renderers/                # Output format renderers
│   │   │   ├── png-renderer.ts       # PNG rendering
│   │   │   ├── svg-renderer.ts       # SVG rendering
│   │   │   └── html-renderer.ts      # HTML index generation
│   │   └── templates/                # Visualization templates
│   │
│   ├── 📁 types/                     # TypeScript type definitions
│   │   ├── cl-types.ts               # Conceptual lexicon types
│   │   ├── cda-types.ts              # CDA types
│   │   ├── graph-types.ts            # Graph structure types
│   │   └── visualization-types.ts    # Visualization config types
│   │
│   └── 📁 utils/                     # Shared utilities
│       ├── file-utils.ts             # File operations
│       ├── string-utils.ts           # String processing
│       └── validation.ts             # Data validation
│
├── 📁 data/                          # Input data files
│   ├── 📁 source/                    # Original source files
│   │   ├── conceptual-lexicon.yaml   # Original CL data
│   │   └── core-directive-array.md   # Original CDA data
│   │
│   ├── 📁 processed/                 # Processed/cleaned data
│   │   ├── cl-processed.json         # Processed CL data
│   │   └── cda-processed.json        # Processed CDA data
│   │
│   └── 📁 databases/                 # Generated database files
│       ├── conceptual-lexicon.db     # CL database
│       ├── cda-enhanced.db           # Enhanced CDA database
│       └── unified-knowledge.db      # Combined knowledge graph
│
├── 📁 outputs/                       # Generated outputs
│   ├── 📁 visualizations/            # DOT files
│   │   ├── complete-graph.dot
│   │   ├── category-views/
│   │   ├── relationship-networks/
│   │   └── layout-comparisons/
│   │
│   ├── 📁 images/                    # Rendered images
│   │   ├── png/                      # High-res PNG files
│   │   ├── svg/                      # Scalable SVG files
│   │   ├── thumbnails/               # Preview thumbnails
│   │   └── index.html                # Image browser
│   │
│   ├── 📁 reports/                   # Analysis reports
│   │   ├── connectivity-analysis.md
│   │   ├── hub-authority-report.md
│   │   └── enhancement-summary.md
│   │
│   └── 📁 exports/                   # Data exports
│       ├── graphml/                  # GraphML format
│       ├── gexf/                     # Gephi format
│       └── csv/                      # CSV exports
│
├── 📁 tests/                         # Test files
│   ├── 📁 unit/                      # Unit tests
│   │   ├── database.test.ts
│   │   ├── parsers.test.ts
│   │   └── analysis.test.ts
│   │
│   ├── 📁 integration/               # Integration tests
│   │   ├── full-pipeline.test.ts
│   │   └── visualization.test.ts
│   │
│   ├── 📁 fixtures/                  # Test data
│   │   ├── sample-cl.yaml
│   │   └── sample-cda.md
│   │
│   └── 📁 helpers/                   # Test utilities
│       ├── database.ts
│       └── test-utils.ts
│
├── 📁 scripts/                       # Automation scripts
│   ├── 📁 build/                     # Build scripts
│   │   ├── generate-all.ts           # Complete pipeline
│   │   └── clean.ts                  # Cleanup script
│   │
│   ├── 📁 data-processing/           # Data processing
│   │   ├── import-cl.ts              # Import conceptual lexicon
│   │   ├── import-cda.ts             # Import CDA
│   │   └── enhance-graph.ts          # Apply enhancements
│   │
│   └── 📁 visualization/             # Visualization scripts
│       ├── generate-dots.ts          # Generate DOT files
│       ├── render-images.ts          # Render to images
│       └── create-index.ts           # Create HTML index
│
├── 📁 docs/                          # Documentation
│   ├── 📁 api/                       # API documentation
│   │   ├── database-api.md
│   │   ├── parser-api.md
│   │   └── visualization-api.md
│   │
│   ├── 📁 guides/                    # User guides
│   │   ├── getting-started.md
│   │   ├── visualization-guide.md
│   │   └── analysis-guide.md
│   │
│   ├── 📁 architecture/              # System architecture
│   │   ├── system-overview.md
│   │   ├── data-flow.md
│   │   └── component-diagram.md
│   │
│   └── 📁 examples/                  # Usage examples
│       ├── basic-analysis.md
│       ├── custom-visualizations.md
│       └── advanced-queries.md
│
├── 📁 config/                        # Configuration files
│   ├── database.config.ts            # Database configuration
│   ├── visualization.config.ts       # Visualization defaults
│   └── analysis.config.ts            # Analysis parameters
│
├── 📁 tools/                         # Development tools
│   ├── schema-generator.ts           # Generate DB schema
│   ├── type-generator.ts             # Generate TypeScript types
│   └── migration-tool.ts             # Database migrations
│
├── 📄 package.json                   # Dependencies and scripts
├── 📄 tsconfig.json                  # TypeScript configuration
├── 📄 vitest.config.ts               # Test configuration
├── 📄 .gitignore                     # Git ignore rules
├── 📄 README.md                      # Project overview
├── 📄 CHANGELOG.md                   # Version history
└── 📄 LICENSE                        # License information
```

## 🚀 **Migration Strategy**

### **Phase 1: Core Structure**

1. Create new directory structure
2. Move TypeScript source files to `src/`
3. Reorganize by functional area
4. Update import paths

### **Phase 2: Data Organization**

1. Move source data to `data/source/`
2. Move databases to `data/databases/`
3. Organize outputs by type
4. Clean up temporary files

### **Phase 3: Testing & Scripts**

1. Reorganize tests by type
2. Move scripts to appropriate categories
3. Update package.json scripts
4. Fix all import paths

### **Phase 4: Documentation**

1. Consolidate documentation
2. Create comprehensive guides
3. Add API documentation
4. Update README

## 📋 **Benefits of New Structure**

### **🎯 Clear Separation of Concerns**

- **Source code** (`src/`) - Core functionality
- **Data** (`data/`) - Input and processed data
- **Outputs** (`outputs/`) - Generated results
- **Tests** (`tests/`) - All testing code
- **Documentation** (`docs/`) - All documentation

### **🔧 Improved Maintainability**

- Logical grouping by functionality
- Clear dependency relationships
- Easy to find and modify code
- Scalable for future features

### **👥 Better Collaboration**

- Standard project structure
- Clear ownership of components
- Easy onboarding for new developers
- Professional appearance

### **🚀 Enhanced Development**

- Faster builds with clear dependencies
- Better IDE support and navigation
- Easier testing and debugging
- Simplified deployment

## 🛠️ **Implementation Commands**

### **Automated Migration Script**

```bash
# Create the new structure
npm run reorganize

# Update all import paths
npm run fix-imports

# Run tests to verify migration
npm test

# Update documentation
npm run update-docs
```

### **Manual Verification Steps**

1. Verify all tests pass
2. Check visualization generation
3. Confirm database operations
4. Test complete pipeline
5. Update README and documentation

## 📊 **File Movement Summary**

### **Current → New Location**

- `ts/*.ts` → `src/database/`, `src/types/`, `src/parsers/`
- `tests/*.test.ts` → `tests/unit/`, `tests/integration/`
- `scripts/*.ts` → `scripts/build/`, `scripts/visualization/`
- `*.md` → `docs/guides/`, `docs/api/`
- `*.db` → `data/databases/`
- `graph-visualizations/` → `outputs/visualizations/`
- `rendered-graphs/` → `outputs/images/`

### **New Files to Create**

- Configuration files in `config/`
- Comprehensive README
- API documentation
- Migration scripts
- Build automation

---

**🎯 This reorganization transforms our project from a collection of scripts into a professional, maintainable knowledge graph system!**
