#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

/**
 * Project reorganization script
 */
class ProjectReorganizer {
  constructor() {
    this.dryRun = process.argv.includes('--dry-run')
    this.verbose = process.argv.includes('--verbose')
    this.moveCount = 0
    this.createCount = 0
  }

  /**
   * Main reorganization process
   */
  reorganize() {
    console.log('🗂️  PROJECT REORGANIZATION STARTING')
    console.log('=' .repeat(50))
    
    if (this.dryRun) {
      console.log('🔍 DRY RUN MODE - No files will be moved')
    }
    
    console.log('')

    try {
      // Phase 1: Create directory structure
      this.createDirectoryStructure()
      
      // Phase 2: Move source files
      this.moveSourceFiles()
      
      // Phase 3: Move data files
      this.moveDataFiles()
      
      // Phase 4: Move output files
      this.moveOutputFiles()
      
      // Phase 5: Move test files
      this.moveTestFiles()
      
      // Phase 6: Move scripts
      this.moveScripts()
      
      // Phase 7: Move documentation
      this.moveDocumentation()
      
      // Phase 8: Create new files
      this.createNewFiles()
      
      // Summary
      this.printSummary()
      
    } catch (error) {
      console.error('❌ Reorganization failed:', error.message)
      process.exit(1)
    }
  }

  /**
   * Create the new directory structure
   */
  createDirectoryStructure() {
    console.log('📁 Creating directory structure...')
    
    const directories = [
      'src/database',
      'src/parsers', 
      'src/analysis',
      'src/visualization/renderers',
      'src/visualization/templates',
      'src/types',
      'src/utils',
      'data/source',
      'data/processed',
      'data/databases',
      'outputs/visualizations/category-views',
      'outputs/visualizations/relationship-networks',
      'outputs/visualizations/layout-comparisons',
      'outputs/images/png',
      'outputs/images/svg',
      'outputs/images/thumbnails',
      'outputs/reports',
      'outputs/exports/graphml',
      'outputs/exports/gexf',
      'outputs/exports/csv',
      'tests/unit',
      'tests/integration',
      'tests/fixtures',
      'tests/helpers',
      'scripts/build',
      'scripts/data-processing',
      'scripts/visualization',
      'docs/api',
      'docs/guides',
      'docs/architecture',
      'docs/examples',
      'config',
      'tools'
    ]

    directories.forEach(dir => {
      this.createDirectory(dir)
    })
  }

  /**
   * Move TypeScript source files
   */
  moveSourceFiles() {
    console.log('\n📦 Moving source files...')
    
    const moves = [
      // Database files
      { from: 'ts/schema.ts', to: 'src/database/schema.ts' },
      { from: 'ts/insert-node.ts', to: 'src/database/insert-node.ts' },
      { from: 'ts/insert-edge.ts', to: 'src/database/insert-edge.ts' },
      
      // Parser files
      { from: 'ts/cda-parser.ts', to: 'src/parsers/cda-parser.ts' },
      
      // Type files
      { from: 'ts/cl-types.ts', to: 'src/types/cl-types.ts' },
      
      // Visualization files
      { from: 'ts/dot-graph-generator.ts', to: 'src/visualization/dot-generator.ts' }
    ]

    moves.forEach(move => {
      this.moveFile(move.from, move.to)
    })
  }

  /**
   * Move data files
   */
  moveDataFiles() {
    console.log('\n📊 Moving data files...')
    
    const moves = [
      // Source data
      { from: 'cda-matrix-ref/core-directive-array.md', to: 'data/source/core-directive-array.md' },
      
      // Database files
      { from: 'conceptual-lexicon-full.db', to: 'data/databases/conceptual-lexicon.db' },
      { from: 'cda-import-test.db', to: 'data/databases/cda-enhanced.db' }
    ]

    moves.forEach(move => {
      this.moveFile(move.from, move.to)
    })
  }

  /**
   * Move output files
   */
  moveOutputFiles() {
    console.log('\n🎨 Moving output files...')
    
    const moves = [
      // Visualizations
      { from: 'graph-visualizations', to: 'outputs/visualizations' },
      
      // Rendered images
      { from: 'rendered-graphs', to: 'outputs/images' }
    ]

    moves.forEach(move => {
      this.moveDirectory(move.from, move.to)
    })
  }

  /**
   * Move test files
   */
  moveTestFiles() {
    console.log('\n🧪 Moving test files...')
    
    // Move test helpers first
    this.moveFile('tests/helpers/database.ts', 'tests/helpers/database.ts')
    
    // Move test files
    const testFiles = [
      'conceptual-lexicon-import.test.ts',
      'cda-import.test.ts',
      'cda-enhancement-simple.test.ts',
      'cda-comprehensive-analysis.test.ts',
      'dot-graph-visualization.test.ts',
      'dot-graph-simple.test.ts'
    ]

    testFiles.forEach(file => {
      const fromPath = `tests/${file}`
      const toPath = file.includes('comprehensive') || file.includes('visualization') 
        ? `tests/integration/${file}`
        : `tests/unit/${file}`
      
      this.moveFile(fromPath, toPath)
    })
  }

  /**
   * Move script files
   */
  moveScripts() {
    console.log('\n⚙️  Moving script files...')
    
    const moves = [
      { from: 'scripts/render-graphs.ts', to: 'scripts/visualization/render-graphs.ts' },
      { from: 'scripts/render-png.ts', to: 'scripts/visualization/render-png.ts' },
      { from: 'scripts/render-png.cjs', to: 'scripts/visualization/render-png.cjs' }
    ]

    moves.forEach(move => {
      this.moveFile(move.from, move.to)
    })
  }

  /**
   * Move documentation files
   */
  moveDocumentation() {
    console.log('\n📚 Moving documentation...')
    
    const moves = [
      { from: 'DOT-GRAPH-VISUALIZER.md', to: 'docs/guides/visualization-guide.md' },
      { from: 'PNG-VISUALIZATION-SUMMARY.md', to: 'docs/guides/png-visualization.md' },
      { from: 'REORGANIZATION-PLAN.md', to: 'docs/architecture/reorganization-plan.md' }
    ]

    moves.forEach(move => {
      this.moveFile(move.from, move.to)
    })
  }

  /**
   * Create new configuration and documentation files
   */
  createNewFiles() {
    console.log('\n📄 Creating new files...')
    
    // Create new README
    this.createFile('README.md', this.generateReadme())
    
    // Create configuration files
    this.createFile('config/database.config.ts', this.generateDatabaseConfig())
    this.createFile('config/visualization.config.ts', this.generateVisualizationConfig())
    
    // Create .gitignore updates
    this.createFile('.gitignore.new', this.generateGitignore())
  }

  /**
   * Utility methods
   */
  createDirectory(dir) {
    if (!this.dryRun) {
      fs.mkdirSync(dir, { recursive: true })
    }
    if (this.verbose) {
      console.log(`   📁 Created: ${dir}`)
    }
    this.createCount++
  }

  moveFile(from, to) {
    if (fs.existsSync(from)) {
      if (!this.dryRun) {
        // Ensure target directory exists
        const targetDir = path.dirname(to)
        fs.mkdirSync(targetDir, { recursive: true })
        
        // Move file
        fs.renameSync(from, to)
      }
      console.log(`   📄 ${from} → ${to}`)
      this.moveCount++
    } else if (this.verbose) {
      console.log(`   ⚠️  Not found: ${from}`)
    }
  }

  moveDirectory(from, to) {
    if (fs.existsSync(from)) {
      if (!this.dryRun) {
        try {
          // Ensure target parent directory exists
          const targetParent = path.dirname(to)
          fs.mkdirSync(targetParent, { recursive: true })

          // Try to move directory
          fs.renameSync(from, to)
          console.log(`   📁 ${from}/ → ${to}/`)
          this.moveCount++
        } catch (error) {
          console.log(`   ⚠️  Could not move ${from}/ (${error.code}): ${error.message}`)
          console.log(`   💡 Please manually move this directory after reorganization`)
        }
      } else {
        console.log(`   📁 ${from}/ → ${to}/`)
        this.moveCount++
      }
    } else if (this.verbose) {
      console.log(`   ⚠️  Not found: ${from}/`)
    }
  }

  createFile(filePath, content) {
    if (!this.dryRun) {
      const dir = path.dirname(filePath)
      fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(filePath, content)
    }
    console.log(`   📄 Created: ${filePath}`)
    this.createCount++
  }

  /**
   * Generate new README content
   */
  generateReadme() {
    return `# 🌐 Simple Graph - Knowledge Graph System

A comprehensive knowledge graph system for analyzing and visualizing the Core Directive Array (CDA) and Conceptual Lexicon.

## 🚀 Quick Start

\`\`\`bash
# Install dependencies
npm install

# Run tests
npm test

# Generate visualizations
npm run generate-visualizations

# View results
open outputs/images/index.html
\`\`\`

## 📁 Project Structure

- **\`src/\`** - Core source code
- **\`data/\`** - Input data and databases
- **\`outputs/\`** - Generated visualizations and reports
- **\`tests/\`** - Test suites
- **\`docs/\`** - Documentation
- **\`scripts/\`** - Automation scripts

## 📚 Documentation

See \`docs/\` for comprehensive guides and API documentation.

## 🎨 Visualizations

Generated visualizations are available in \`outputs/images/\` with an interactive HTML browser.

## 🧪 Testing

\`\`\`bash
npm test              # Run all tests
npm run test:unit     # Unit tests only
npm run test:integration  # Integration tests only
\`\`\`

## 📊 Analysis

The system provides comprehensive analysis of:
- Directive relationships and dependencies
- Hub and authority nodes
- Semantic clustering
- Category interconnections

---

**Built with TypeScript, SQLite, and Graphviz**
`
  }

  /**
   * Generate database configuration
   */
  generateDatabaseConfig() {
    return `export const DatabaseConfig = {
  defaultPath: 'data/databases/',
  conceptualLexicon: 'conceptual-lexicon.db',
  cdaEnhanced: 'cda-enhanced.db',
  unified: 'unified-knowledge.db',
  
  options: {
    verbose: false,
    timeout: 30000,
    readonly: false
  }
}
`
  }

  /**
   * Generate visualization configuration
   */
  generateVisualizationConfig() {
    return `export const VisualizationConfig = {
  outputPath: 'outputs/',
  
  dot: {
    path: 'visualizations/',
    defaultLayout: 'dot',
    maxNodes: 1000,
    maxEdges: 2000
  },
  
  images: {
    path: 'images/',
    formats: ['png', 'svg'],
    dpi: 300,
    thumbnailSize: 400
  },
  
  colors: {
    directive: '#E3F2FD',
    cda: '#FFF3E0',
    ohTerm: '#F3E5F5',
    coreConcept: '#E8F5E8'
  }
}
`
  }

  /**
   * Generate updated .gitignore
   */
  generateGitignore() {
    return `# Dependencies
node_modules/
npm-debug.log*

# Build outputs
dist/
build/

# Databases (keep structure, ignore data)
data/databases/*.db
!data/databases/.gitkeep

# Generated outputs
outputs/visualizations/*.dot
outputs/images/*.png
outputs/images/*.svg
outputs/reports/*.md

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Logs
*.log

# Temporary files
tmp/
temp/
.cache/
`
  }

  /**
   * Print reorganization summary
   */
  printSummary() {
    console.log('\n🎯 REORGANIZATION SUMMARY')
    console.log('=' .repeat(50))
    console.log(`📁 Directories created: ${this.createCount}`)
    console.log(`📄 Files moved: ${this.moveCount}`)
    
    if (this.dryRun) {
      console.log('\n🔍 This was a DRY RUN - no files were actually moved')
      console.log('Run without --dry-run to perform the reorganization')
    } else {
      console.log('\n✅ Reorganization complete!')
      console.log('\n📋 Next steps:')
      console.log('1. Update package.json scripts')
      console.log('2. Fix import paths in TypeScript files')
      console.log('3. Run tests to verify everything works')
      console.log('4. Update documentation')
    }
  }
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2)
  
  if (args.includes('--help')) {
    console.log(`
Project Reorganization Tool

Usage: node reorganize-project.js [options]

Options:
  --dry-run    Show what would be moved without actually moving files
  --verbose    Show detailed output including skipped files
  --help       Show this help message

Examples:
  node reorganize-project.js --dry-run    # Preview changes
  node reorganize-project.js              # Perform reorganization
`)
    process.exit(0)
  }

  const reorganizer = new ProjectReorganizer()
  reorganizer.reorganize()
}

// Run if called directly
if (require.main === module) {
  main()
}

module.exports = { ProjectReorganizer }
