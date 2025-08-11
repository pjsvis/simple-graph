#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose()
const fs = require('fs')
const path = require('path')

/**
 * Persona Generator - Extract data from unified knowledge graph
 */
class PersonaGenerator {
  constructor() {
    this.dbPath = 'data/databases/cda-enhanced.db'
    this.db = null
  }

  /**
   * Connect to the database
   */
  async connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          reject(new Error(`Failed to connect to database: ${err.message}`))
        } else {
          console.log('📊 Connected to CDA enhanced database')
          resolve()
        }
      })
    })
  }

  /**
   * Execute a query and return results
   */
  async query(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err)
        } else {
          resolve(rows)
        }
      })
    })
  }

  /**
   * Step 1: Extract all PHI (Processing Philosophy) directives
   */
  async extractPHIDirectives() {
    console.log('\n🧠 STEP 1: Extracting PHI (Processing Philosophy) directives...')
    
    const sql = `
      SELECT 
        json_extract(body, '$.directive_id') as directive_id,
        json_extract(body, '$.title') as title,
        json_extract(body, '$.description') as description
      FROM nodes 
      WHERE json_extract(body, '$.node_type') = 'directive'
        AND json_extract(body, '$.category') = 'PHI'
      ORDER BY directive_id
    `
    
    const results = await this.query(sql)
    console.log(`   Found ${results.length} PHI directives`)
    return results
  }

  /**
   * Step 2: Extract all COG (Cognitive Strategies) directives
   */
  async extractCOGDirectives() {
    console.log('\n🎯 STEP 2: Extracting COG (Cognitive Strategies) directives...')
    
    const sql = `
      SELECT 
        json_extract(body, '$.directive_id') as directive_id,
        json_extract(body, '$.title') as title,
        json_extract(body, '$.description') as description
      FROM nodes 
      WHERE json_extract(body, '$.node_type') = 'directive'
        AND json_extract(body, '$.category') = 'COG'
      ORDER BY directive_id
    `
    
    const results = await this.query(sql)
    console.log(`   Found ${results.length} COG directives`)
    return results
  }

  /**
   * Step 3: Extract top 5 most interconnected OPM directives
   */
  async extractTopOPMDirectives() {
    console.log('\n⚙️  STEP 3: Extracting top 5 most interconnected OPM directives...')
    
    const sql = `
      SELECT 
        n.id,
        json_extract(n.body, '$.directive_id') as directive_id,
        json_extract(n.body, '$.title') as title,
        json_extract(n.body, '$.description') as description,
        (
          SELECT COUNT(*) FROM edges e1 WHERE e1.source = n.id
        ) + (
          SELECT COUNT(*) FROM edges e2 WHERE e2.target = n.id
        ) as total_connections
      FROM nodes n
      WHERE json_extract(n.body, '$.node_type') = 'directive'
        AND json_extract(n.body, '$.category') = 'OPM'
      ORDER BY total_connections DESC
      LIMIT 5
    `
    
    const results = await this.query(sql)
    console.log(`   Found top ${results.length} OPM directives by connectivity:`)
    results.forEach((row, i) => {
      console.log(`     ${i+1}. ${row.directive_id}: ${row.total_connections} connections`)
    })
    return results
  }

  /**
   * Step 4: Extract top 10 most referenced Conceptual Lexicon terms
   */
  async extractTopCLTerms() {
    console.log('\n📚 STEP 4: Extracting top 10 most referenced CL terms...')

    // Try to connect to the conceptual lexicon database
    const clDbPath = 'data/databases/conceptual-lexicon.db'

    return new Promise((resolve) => {
      const clDb = new sqlite3.Database(clDbPath, (err) => {
        if (err) {
          console.log('   ⚠️  Could not access conceptual lexicon database')
          resolve([])
          return
        }

        // Query the CL database for terms
        const sql = `
          SELECT
            json_extract(body, '$.term') as term,
            json_extract(body, '$.definition') as definition,
            json_extract(body, '$.description') as description,
            json_extract(body, '$.category') as category
          FROM nodes
          WHERE json_extract(body, '$.term') IS NOT NULL
          ORDER BY json_extract(body, '$.term')
          LIMIT 10
        `

        clDb.all(sql, [], (err, rows) => {
          clDb.close()
          if (err) {
            console.log('   ⚠️  Error querying CL database:', err.message)
            resolve([])
          } else {
            console.log(`   Found ${rows.length} CL terms from conceptual lexicon database`)
            if (rows.length > 0) {
              console.log('   Sample terms:', rows.slice(0, 3).map(r => r.term))
            }
            resolve(rows)
          }
        })
      })
    })
  }

  /**
   * Generate the persona markdown file
   */
  async generatePersona() {
    console.log('\n🎨 GENERATING CTX-V2-BASELINE PERSONA')
    console.log('=' .repeat(50))

    try {
      await this.connect()

      // Extract all required data
      const phiDirectives = await this.extractPHIDirectives()
      const cogDirectives = await this.extractCOGDirectives()
      const topOPMDirectives = await this.extractTopOPMDirectives()
      const topCLTerms = await this.extractTopCLTerms()

      // Generate the markdown content
      const currentDate = new Date().toISOString().split('T')[0]
      
      let markdown = `---
persona_name: "Ctx-V2-Baseline"
base_cda_version: 61
base_cl_version: 1.76

version_history:
  - version: 1.0
    date: "${currentDate}"
    target_substrate: "Baseline (Substrate Agnostic)"
    changes:
      - Initial formulaic generation from the Ctx knowledge graph.
    lessons_learned: >
      This artifact represents the baseline, architecturally-sound persona derived from
      the analysis of the Ctx v61/1.76 system. It serves as the starting point for
      substrate-specific tuning and evaluation.
---

# Persona Artifact: Ctx-V2-Baseline
# CDA Version: 61 | CL Version: 1.76

---

## 1. Foundational Principles (PHI - Processing Philosophy)

`

      // Add PHI directives
      phiDirectives.forEach(directive => {
        markdown += `### ${directive.directive_id}: ${directive.title}\n\n`
        markdown += `${directive.description}\n\n`
      })

      markdown += `---

## 2. Core Cognitive Strategies (COG)

`

      // Add COG directives
      cogDirectives.forEach(directive => {
        markdown += `### ${directive.directive_id}: ${directive.title}\n\n`
        markdown += `${directive.description}\n\n`
      })

      markdown += `---

## 3. Key Operational Protocols (OPM)

`

      // Add top OPM directives
      topOPMDirectives.forEach((directive, i) => {
        markdown += `### ${directive.directive_id}: ${directive.title}\n`
        markdown += `**Connectivity:** ${directive.total_connections} connections\n\n`
        markdown += `${directive.description}\n\n`
      })

      markdown += `---

## 4. Core Conceptual Lexicon

`

      // Add CL terms
      if (topCLTerms && topCLTerms.length > 0) {
        topCLTerms.forEach(term => {
          const termName = term.term || term.title || term.id
          const definition = term.definition || term.description || 'Definition not available'
          if (termName && definition) {
            markdown += `• **${termName}**: ${definition}\n\n`
          }
        })
      } else {
        markdown += `• *Note: Conceptual Lexicon terms not found in current database structure*\n\n`
      }

      markdown += `---\n`

      // Write the file
      const outputPath = 'ctx-v2-baseline.md'
      fs.writeFileSync(outputPath, markdown)

      console.log('\n✅ PERSONA GENERATION COMPLETE')
      console.log(`📄 Generated: ${outputPath}`)
      console.log(`📊 Included: ${phiDirectives.length} PHI + ${cogDirectives.length} COG + ${topOPMDirectives.length} OPM directives`)
      console.log(`📚 CL Terms: ${topCLTerms.length} terms`)

    } catch (error) {
      console.error('❌ Error generating persona:', error.message)
      throw error
    } finally {
      if (this.db) {
        this.db.close()
      }
    }
  }
}

// Run the generator
if (require.main === module) {
  const generator = new PersonaGenerator()
  generator.generatePersona().catch(console.error)
}

module.exports = { PersonaGenerator }
