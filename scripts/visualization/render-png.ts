#!/usr/bin/env node

import { execSync } from 'child_process'
import { readdirSync, existsSync, mkdirSync } from 'fs'
import { join, basename } from 'path'

/**
 * Simple PNG renderer for DOT files
 */
class PNGRenderer {
  private inputDir = 'graph-visualizations'
  private outputDir = 'rendered-graphs'

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
   * Render priority DOT files to PNG
   */
  renderPriorityPNGs(): void {
    if (!this.checkGraphviz()) {
      console.error('❌ Graphviz not found! Please install Graphviz:')
      console.error('   Windows: choco install graphviz')
      console.error('   macOS: brew install graphviz')
      console.error('   Ubuntu: sudo apt-get install graphviz')
      process.exit(1)
    }

    console.log('🎨 RENDERING PRIORITY PNG FILES')
    console.log('=' .repeat(50))

    // Create output directory
    if (!existsSync(this.outputDir)) {
      mkdirSync(this.outputDir, { recursive: true })
    }

    // Priority files to render (most useful visualizations)
    const priorityFiles = [
      { file: 'minimal-example.dot', description: 'Simple example for testing' },
      { file: 'complete-knowledge-graph.dot', description: 'Full network overview' },
      { file: 'directives-only.dot', description: 'Directive network only' },
      { file: 'hub-authority.dot', description: 'Central hub nodes' },
      { file: 'cross-category-bridges.dot', description: 'Inter-category connections' },
      { file: 'semantic-similarity.dot', description: 'Semantic relationships' },
      { file: 'inspirational-clusters.dot', description: 'Inspirational source groups' },
      { file: 'category-adv.dot', description: 'Advanced Directives category' },
      { file: 'category-cog.dot', description: 'Cognitive Strategies category' },
      { file: 'layout-force-directed.dot', description: 'Force-directed layout example' }
    ]

    let successCount = 0
    let errorCount = 0

    for (const { file, description } of priorityFiles) {
      const inputPath = join(this.inputDir, file)
      
      if (!existsSync(inputPath)) {
        console.log(`⚠️  Skipping ${file} (not found)`)
        continue
      }

      try {
        this.renderToPNG(inputPath, description)
        successCount++
      } catch (error) {
        console.error(`❌ Failed to render ${file}: ${error}`)
        errorCount++
      }
    }

    console.log('')
    console.log('🎯 RENDERING SUMMARY')
    console.log('=' .repeat(50))
    console.log(`✅ Successfully rendered: ${successCount} PNG files`)
    console.log(`❌ Failed to render: ${errorCount} files`)
    console.log(`📁 Output location: ${this.outputDir}/`)
    
    if (successCount > 0) {
      console.log('')
      console.log('🖼️  Generated PNG files:')
      const pngFiles = readdirSync(this.outputDir).filter(f => f.endsWith('.png'))
      pngFiles.forEach(file => {
        console.log(`   📄 ${file}`)
      })
    }
  }

  /**
   * Render a single DOT file to PNG
   */
  private renderToPNG(inputPath: string, description: string): void {
    const baseName = basename(inputPath, '.dot')
    const outputPath = join(this.outputDir, `${baseName}.png`)
    
    console.log(`🎨 Rendering: ${baseName}`)
    console.log(`   📝 ${description}`)
    
    // High-quality PNG rendering
    const command = `dot -Tpng -Gdpi=300 -Gsize="12,12!" -Gratio=fill "${inputPath}" -o "${outputPath}"`
    
    try {
      execSync(command, { stdio: 'pipe' })
      console.log(`   ✅ Generated: ${baseName}.png`)
    } catch (error) {
      throw new Error(`Graphviz rendering failed: ${error}`)
    }
  }

  /**
   * Render all DOT files to PNG
   */
  renderAllPNGs(): void {
    if (!existsSync(this.inputDir)) {
      console.error(`❌ Input directory not found: ${this.inputDir}`)
      return
    }

    const dotFiles = readdirSync(this.inputDir)
      .filter(file => file.endsWith('.dot'))
      .map(file => join(this.inputDir, file))

    console.log(`📊 Found ${dotFiles.length} DOT files to render`)

    let successCount = 0
    for (const dotFile of dotFiles) {
      try {
        this.renderToPNG(dotFile, 'Complete visualization')
        successCount++
      } catch (error) {
        console.error(`❌ Failed to render ${basename(dotFile)}: ${error}`)
      }
    }

    console.log(`\n✅ Rendered ${successCount}/${dotFiles.length} files to PNG`)
  }

  /**
   * Create thumbnails (smaller PNG files)
   */
  createThumbnails(): void {
    console.log('\n🖼️  CREATING THUMBNAILS')
    console.log('=' .repeat(50))

    const thumbnailDir = join(this.outputDir, 'thumbnails')
    if (!existsSync(thumbnailDir)) {
      mkdirSync(thumbnailDir, { recursive: true })
    }

    const dotFiles = readdirSync(this.inputDir).filter(f => f.endsWith('.dot'))
    
    for (const dotFile of dotFiles) {
      const inputPath = join(this.inputDir, dotFile)
      const baseName = basename(dotFile, '.dot')
      const thumbnailPath = join(thumbnailDir, `${baseName}_thumb.png`)
      
      try {
        // Small thumbnail: 400x400 max, 72 DPI
        const command = `dot -Tpng -Gdpi=72 -Gsize="4,4!" -Gratio=fill "${inputPath}" -o "${thumbnailPath}"`
        execSync(command, { stdio: 'pipe' })
        console.log(`   📷 ${baseName}_thumb.png`)
      } catch (error) {
        console.error(`   ❌ Failed thumbnail for ${baseName}`)
      }
    }
  }
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2)
  const renderer = new PNGRenderer()

  if (args.includes('--all')) {
    renderer.renderAllPNGs()
  } else if (args.includes('--thumbnails')) {
    renderer.createThumbnails()
  } else if (args.includes('--help')) {
    console.log(`
PNG Renderer - Render DOT files to PNG format

Usage: node render-png.ts [options]

Options:
  (no options)  Render priority PNG files (recommended)
  --all         Render all DOT files to PNG
  --thumbnails  Create thumbnail versions
  --help        Show this help message

Examples:
  node render-png.ts                    # Render priority files
  node render-png.ts --all              # Render everything
  node render-png.ts --thumbnails       # Create thumbnails
`)
    process.exit(0)
  } else {
    // Default: render priority files
    renderer.renderPriorityPNGs()
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export { PNGRenderer }
