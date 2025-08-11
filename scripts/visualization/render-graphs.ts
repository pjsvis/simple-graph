#!/usr/bin/env node

import { execSync } from 'child_process'
import { readdirSync, statSync, existsSync, mkdirSync } from 'fs'
import { join, basename, extname } from 'path'

/**
 * Graph rendering configuration
 */
interface RenderConfig {
  inputDir: string
  outputDir: string
  formats: string[]
  layouts?: string[]
  dpi?: number
  verbose?: boolean
}

/**
 * Default rendering configuration
 */
const DEFAULT_CONFIG: RenderConfig = {
  inputDir: 'graph-visualizations',
  outputDir: 'rendered-graphs',
  formats: ['svg', 'png', 'pdf'],
  dpi: 300,
  verbose: true
}

/**
 * Graph renderer using Graphviz
 */
class GraphRenderer {
  constructor(private config: RenderConfig) {}

  /**
   * Check if Graphviz is installed
   */
  checkGraphviz(): boolean {
    try {
      execSync('dot -V', { stdio: 'pipe' })
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Render all DOT files in the input directory
   */
  renderAll(): void {
    if (!this.checkGraphviz()) {
      console.error('❌ Graphviz not found! Please install Graphviz:')
      console.error('   Windows: choco install graphviz')
      console.error('   macOS: brew install graphviz')
      console.error('   Ubuntu: sudo apt-get install graphviz')
      process.exit(1)
    }

    console.log('🎨 GRAPH RENDERING STARTED')
    console.log('=' .repeat(50))
    console.log(`📁 Input directory: ${this.config.inputDir}`)
    console.log(`📁 Output directory: ${this.config.outputDir}`)
    console.log(`🎯 Formats: ${this.config.formats.join(', ')}`)
    console.log('')

    // Create output directory
    if (!existsSync(this.config.outputDir)) {
      mkdirSync(this.config.outputDir, { recursive: true })
    }

    // Find all DOT files
    const dotFiles = this.findDotFiles()
    
    if (dotFiles.length === 0) {
      console.log('⚠️  No DOT files found in input directory')
      return
    }

    console.log(`📊 Found ${dotFiles.length} DOT files to render`)
    console.log('')

    // Render each file
    let successCount = 0
    let errorCount = 0

    for (const dotFile of dotFiles) {
      try {
        this.renderFile(dotFile)
        successCount++
      } catch (error) {
        console.error(`❌ Failed to render ${dotFile}: ${error}`)
        errorCount++
      }
    }

    console.log('')
    console.log('🎯 RENDERING SUMMARY')
    console.log('=' .repeat(50))
    console.log(`✅ Successfully rendered: ${successCount} files`)
    console.log(`❌ Failed to render: ${errorCount} files`)
    console.log(`📁 Output location: ${this.config.outputDir}`)
    
    if (successCount > 0) {
      console.log('')
      console.log('🌐 To view SVG files in browser:')
      console.log(`   Open: file://${process.cwd()}/${this.config.outputDir}/`)
    }
  }

  /**
   * Find all DOT files in the input directory
   */
  private findDotFiles(): string[] {
    if (!existsSync(this.config.inputDir)) {
      console.error(`❌ Input directory not found: ${this.config.inputDir}`)
      return []
    }

    const files = readdirSync(this.config.inputDir)
    return files
      .filter(file => extname(file).toLowerCase() === '.dot')
      .map(file => join(this.config.inputDir, file))
      .filter(file => statSync(file).isFile())
  }

  /**
   * Render a single DOT file to all configured formats
   */
  private renderFile(dotFile: string): void {
    const baseName = basename(dotFile, '.dot')
    
    if (this.config.verbose) {
      console.log(`🎨 Rendering: ${baseName}`)
    }

    for (const format of this.config.formats) {
      const outputFile = join(this.config.outputDir, `${baseName}.${format}`)
      
      try {
        const command = this.buildRenderCommand(dotFile, outputFile, format)
        
        if (this.config.verbose) {
          console.log(`   → ${format.toUpperCase()}: ${basename(outputFile)}`)
        }
        
        execSync(command, { stdio: 'pipe' })
        
      } catch (error) {
        console.error(`   ❌ Failed to render ${format}: ${error}`)
      }
    }
  }

  /**
   * Build Graphviz command for rendering
   */
  private buildRenderCommand(inputFile: string, outputFile: string, format: string): string {
    const baseCommand = `dot -T${format}`
    
    // Add DPI for raster formats
    if (['png', 'jpg', 'jpeg'].includes(format) && this.config.dpi) {
      return `${baseCommand} -Gdpi=${this.config.dpi} "${inputFile}" -o "${outputFile}"`
    }
    
    return `${baseCommand} "${inputFile}" -o "${outputFile}"`
  }

  /**
   * Render specific files with custom options
   */
  renderSpecific(files: string[], options: Partial<RenderConfig> = {}): void {
    const config = { ...this.config, ...options }
    
    console.log(`🎯 Rendering ${files.length} specific files`)
    
    for (const file of files) {
      if (existsSync(file)) {
        this.renderFile(file)
      } else {
        console.error(`❌ File not found: ${file}`)
      }
    }
  }

  /**
   * Generate thumbnail versions (small PNG files)
   */
  generateThumbnails(): void {
    console.log('🖼️  Generating thumbnails...')
    
    const thumbnailDir = join(this.config.outputDir, 'thumbnails')
    if (!existsSync(thumbnailDir)) {
      mkdirSync(thumbnailDir, { recursive: true })
    }

    const dotFiles = this.findDotFiles()
    
    for (const dotFile of dotFiles) {
      const baseName = basename(dotFile, '.dot')
      const thumbnailFile = join(thumbnailDir, `${baseName}_thumb.png`)
      
      try {
        const command = `dot -Tpng -Gdpi=72 -Gsize="4,4!" "${dotFile}" -o "${thumbnailFile}"`
        execSync(command, { stdio: 'pipe' })
        
        if (this.config.verbose) {
          console.log(`   📷 ${baseName}_thumb.png`)
        }
      } catch (error) {
        console.error(`   ❌ Failed to generate thumbnail for ${baseName}`)
      }
    }
  }

  /**
   * Generate an HTML index page for easy viewing
   */
  generateIndex(): void {
    console.log('📄 Generating HTML index...')
    
    const dotFiles = this.findDotFiles()
    const htmlContent = this.buildIndexHTML(dotFiles)
    
    const indexFile = join(this.config.outputDir, 'index.html')
    require('fs').writeFileSync(indexFile, htmlContent)
    
    console.log(`✅ Generated index: ${indexFile}`)
  }

  /**
   * Build HTML index content
   */
  private buildIndexHTML(dotFiles: string[]): string {
    const title = 'CDA Knowledge Graph Visualizations'
    
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        h1 { color: #333; text-align: center; }
        .graph-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 20px; }
        .graph-card { border: 1px solid #ddd; border-radius: 8px; padding: 15px; background: #fafafa; }
        .graph-card h3 { margin-top: 0; color: #555; }
        .graph-links { margin-top: 10px; }
        .graph-links a { display: inline-block; margin-right: 10px; padding: 5px 10px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; font-size: 12px; }
        .graph-links a:hover { background: #0056b3; }
        .thumbnail { max-width: 100%; height: auto; border: 1px solid #ccc; border-radius: 4px; }
        .description { font-size: 14px; color: #666; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>${title}</h1>
        <p>Generated on ${new Date().toLocaleString()}</p>
        <div class="graph-grid">
`

    for (const dotFile of dotFiles) {
      const baseName = basename(dotFile, '.dot')
      const description = this.getGraphDescription(baseName)
      
      html += `
            <div class="graph-card">
                <h3>${this.formatGraphTitle(baseName)}</h3>
                <div class="graph-links">
                    <a href="${baseName}.svg" target="_blank">SVG</a>
                    <a href="${baseName}.png" target="_blank">PNG</a>
                    <a href="${baseName}.pdf" target="_blank">PDF</a>
                    <a href="../${this.config.inputDir}/${baseName}.dot" target="_blank">DOT</a>
                </div>
                <div class="description">${description}</div>
            </div>
`
    }

    html += `
        </div>
    </div>
</body>
</html>`

    return html
  }

  /**
   * Get description for a graph based on its filename
   */
  private getGraphDescription(baseName: string): string {
    const descriptions: Record<string, string> = {
      'complete-knowledge-graph': 'Complete overview of the entire CDA knowledge graph with all nodes and relationships',
      'directives-only': 'Network showing only directive nodes and their interconnections',
      'relationships-network': 'Focus on relationship types and connection patterns',
      'cross-category-bridges': 'Inter-category connections and bridges between directive categories',
      'inspirational-clusters': 'Groupings based on shared inspirational sources (McLuhan, HSE, etc.)',
      'semantic-similarity': 'Connections based on semantic similarity and keyword matching',
      'hub-authority': 'Visualization highlighting central hub nodes and authority directives'
    }

    // Check for category-specific graphs
    if (baseName.startsWith('category-')) {
      const category = baseName.replace('category-', '').toUpperCase()
      return `Detailed view of the ${category} category directives and their relationships`
    }

    // Check for layout comparisons
    if (baseName.startsWith('layout-')) {
      const layout = baseName.replace('layout-', '').replace('-', ' ')
      return `Demonstration of ${layout} layout algorithm for graph visualization`
    }

    return descriptions[baseName] || 'Knowledge graph visualization'
  }

  /**
   * Format graph title for display
   */
  private formatGraphTitle(baseName: string): string {
    return baseName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2)
  const config = { ...DEFAULT_CONFIG }

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--input':
        config.inputDir = args[++i]
        break
      case '--output':
        config.outputDir = args[++i]
        break
      case '--formats':
        config.formats = args[++i].split(',')
        break
      case '--dpi':
        config.dpi = parseInt(args[++i])
        break
      case '--quiet':
        config.verbose = false
        break
      case '--help':
        console.log(`
Graph Renderer - Render DOT files to various formats

Usage: node render-graphs.ts [options]

Options:
  --input <dir>     Input directory containing DOT files (default: graph-visualizations)
  --output <dir>    Output directory for rendered files (default: rendered-graphs)
  --formats <list>  Comma-separated list of formats (default: svg,png,pdf)
  --dpi <number>    DPI for raster formats (default: 300)
  --quiet           Suppress verbose output
  --help            Show this help message

Examples:
  node render-graphs.ts
  node render-graphs.ts --formats svg,png --dpi 150
  node render-graphs.ts --input my-graphs --output my-output
`)
        process.exit(0)
    }
  }

  const renderer = new GraphRenderer(config)
  
  // Render all graphs
  renderer.renderAll()
  
  // Generate thumbnails
  renderer.generateThumbnails()
  
  // Generate HTML index
  renderer.generateIndex()
}

// Run if called directly
if (require.main === module) {
  main()
}

export { GraphRenderer, type RenderConfig }
