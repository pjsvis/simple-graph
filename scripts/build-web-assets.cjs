#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

/**
 * Web Assets Builder
 * 
 * This script prepares the web interface by:
 * 1. Copying visualization assets to www/
 * 2. Generating data export files
 * 3. Creating documentation pages
 * 4. Updating asset references
 */
class WebAssetsBuilder {
  constructor() {
    this.wwwDir = 'www'
    this.outputsDir = 'outputs'
    this.dataDir = 'data'
    this.docsDir = 'docs'
  }

  /**
   * Build all web assets
   */
  async buildAll() {
    console.log('🌐 BUILDING WEB ASSETS')
    console.log('=' .repeat(40))

    try {
      // Step 1: Ensure directory structure
      await this.createDirectoryStructure()
      
      // Step 2: Copy visualization assets
      await this.copyVisualizationAssets()
      
      // Step 3: Create data exports
      await this.createDataExports()
      
      // Step 4: Copy documentation
      await this.copyDocumentation()
      
      // Step 5: Create placeholder assets
      await this.createPlaceholderAssets()
      
      console.log('\n✅ Web assets build complete!')
      console.log('🚀 Run "npm run web-serve" to start the development server')
      
    } catch (error) {
      console.error('❌ Build failed:', error.message)
      throw error
    }
  }

  /**
   * Create directory structure
   */
  async createDirectoryStructure() {
    console.log('\n📁 Creating directory structure...')
    
    const directories = [
      'www/assets/images',
      'www/assets/css',
      'www/assets/js',
      'www/data',
      'www/docs',
      'www/exports',
      'www/visualizations/organic',
      'www/visualizations/synth'
    ]

    directories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
        console.log(`   Created: ${dir}`)
      }
    })
  }

  /**
   * Copy visualization assets
   */
  async copyVisualizationAssets() {
    console.log('\n🖼️  Copying visualization assets...')
    
    // Copy images and thumbnails
    if (fs.existsSync('outputs/images')) {
      this.copyDirectory('outputs/images', 'www/assets/images')
      console.log('   ✅ Copied images and thumbnails')
    }

    // Copy SVG files if they exist
    if (fs.existsSync('outputs/svg')) {
      this.copyDirectory('outputs/svg', 'www/assets/images/svg')
      console.log('   ✅ Copied SVG files')
    }

    // Copy DOT files for reference
    if (fs.existsSync('outputs/dot')) {
      this.copyDirectory('outputs/dot', 'www/exports/dot')
      console.log('   ✅ Copied DOT files')
    }
  }

  /**
   * Create data export files
   */
  async createDataExports() {
    console.log('\n📊 Creating data exports...')
    
    // Copy database files
    if (fs.existsSync('data/databases/the-loom-v2.db')) {
      fs.copyFileSync('data/databases/the-loom-v2.db', 'www/exports/the-loom-v2.db')
      console.log('   ✅ Copied graph database')
    }

    // Copy JSON files
    if (fs.existsSync('cda-matrix-ref/conceptual-lexicon.json')) {
      fs.copyFileSync('cda-matrix-ref/conceptual-lexicon.json', 'www/exports/conceptual-lexicon.json')
      console.log('   ✅ Copied conceptual lexicon JSON')
    }

    if (fs.existsSync('data/source/core-directive-array.md')) {
      fs.copyFileSync('data/source/core-directive-array.md', 'www/exports/core-directive-array.md')
      console.log('   ✅ Copied CDA markdown')
    }

    // Create a simple API endpoint simulation
    this.createApiEndpoints()
  }

  /**
   * Copy documentation
   */
  async copyDocumentation() {
    console.log('\n📚 Copying documentation...')
    
    if (fs.existsSync('docs')) {
      this.copyDirectory('docs', 'www/docs')
      console.log('   ✅ Copied documentation files')
    }

    // Create README for web interface
    const webReadme = `# Graph Database Web Interface

This web interface provides an interactive way to explore the knowledge graph.

## Features

- **Visualization Gallery**: Browse SVG and PNG visualizations
- **Data Explorer**: Search and browse CDA directives and lexicon terms
- **Export Options**: Download data in various formats
- **API Documentation**: Integration guides and examples

## Local Development

\`\`\`bash
npm run web-serve    # Start development server
npm run web-build    # Rebuild assets
\`\`\`

## Files

- \`index.html\` - Main homepage
- \`assets/\` - CSS, JavaScript, and images
- \`data/\` - Interactive data browsers
- \`docs/\` - Documentation and guides
- \`exports/\` - Downloadable data files
`

    fs.writeFileSync('www/README.md', webReadme)
    console.log('   ✅ Created web interface README')
  }

  /**
   * Create placeholder assets
   */
  async createPlaceholderAssets() {
    console.log('\n🖼️  Creating placeholder assets...')
    
    // Create a simple placeholder image (SVG)
    const placeholderSvg = `<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#ecf0f1"/>
  <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#7f8c8d" font-family="Arial, sans-serif" font-size="16">
    Visualization Loading...
  </text>
</svg>`

    fs.writeFileSync('www/assets/images/placeholder.svg', placeholderSvg)
    console.log('   ✅ Created placeholder SVG')

    // Create favicon
    const faviconSvg = `<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" fill="#2c3e50"/>
  <circle cx="16" cy="16" r="12" fill="#3498db"/>
  <circle cx="16" cy="16" r="8" fill="#2c3e50"/>
  <circle cx="16" cy="16" r="4" fill="#3498db"/>
</svg>`

    fs.writeFileSync('www/assets/favicon.svg', faviconSvg)
    console.log('   ✅ Created favicon')
  }

  /**
   * Create simple API endpoints (JSON files)
   */
  createApiEndpoints() {
    console.log('\n🔌 Creating API endpoints...')
    
    // Stats endpoint
    const stats = {
      timestamp: new Date().toISOString(),
      version: "2.0",
      data: {
        cda_directives: 85,
        lexicon_terms: 134,
        relationships: 24,
        categories: 93,
        visualizations: 12
      }
    }

    fs.writeFileSync('www/data/stats.json', JSON.stringify(stats, null, 2))
    console.log('   ✅ Created stats API endpoint')

    // Visualizations index
    const visualizations = {
      organic: [
        "complete-knowledge-graph",
        "directives-only", 
        "layout-force-directed",
        "layout-hierarchical",
        "layout-circular",
        "layout-radial"
      ],
      synth: [
        "hub-authority",
        "semantic-similarity",
        "cross-category-bridges",
        "inspirational-clusters",
        "category-phi",
        "category-cog"
      ]
    }

    fs.writeFileSync('www/data/visualizations.json', JSON.stringify(visualizations, null, 2))
    console.log('   ✅ Created visualizations index')
  }

  /**
   * Copy directory recursively
   */
  copyDirectory(src, dest) {
    if (!fs.existsSync(src)) return

    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true })
    }

    const entries = fs.readdirSync(src, { withFileTypes: true })

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name)
      const destPath = path.join(dest, entry.name)

      if (entry.isDirectory()) {
        this.copyDirectory(srcPath, destPath)
      } else {
        fs.copyFileSync(srcPath, destPath)
      }
    }
  }

  /**
   * Get build statistics
   */
  getBuildStats() {
    const stats = {
      directories: 0,
      files: 0,
      totalSize: 0
    }

    const countFiles = (dir) => {
      if (!fs.existsSync(dir)) return

      const entries = fs.readdirSync(dir, { withFileTypes: true })
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        
        if (entry.isDirectory()) {
          stats.directories++
          countFiles(fullPath)
        } else {
          stats.files++
          stats.totalSize += fs.statSync(fullPath).size
        }
      }
    }

    countFiles('www')
    return stats
  }
}

// CLI interface
if (require.main === module) {
  const builder = new WebAssetsBuilder()
  
  builder.buildAll()
    .then(() => {
      const stats = builder.getBuildStats()
      console.log('\n📊 Build Statistics:')
      console.log(`   Directories: ${stats.directories}`)
      console.log(`   Files: ${stats.files}`)
      console.log(`   Total size: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`)
    })
    .catch(error => {
      console.error('Build failed:', error)
      process.exit(1)
    })
}

module.exports = { WebAssetsBuilder }
