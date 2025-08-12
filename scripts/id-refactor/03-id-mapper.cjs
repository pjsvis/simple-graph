#!/usr/bin/env node

/**
 * Step 3: ID transformation mapping functions
 */
class IDMapper {
  constructor() {
    this.transformationRules = {
      cda: this.transformCDAId.bind(this),
      directive: this.transformDirectiveId.bind(this),
      cl_term: this.transformCLId.bind(this),
      default: this.transformDefaultId.bind(this)
    }
  }

  /**
   * Transform a CDA metadata ID
   * @param {string} oldId - Original ID (e.g., "cda-61")
   * @param {string} version - CDA version (e.g., "61")
   * @returns {string} New ID (unchanged for CDA metadata)
   */
  transformCDAId(oldId, version = '61') {
    // CDA metadata IDs are already in correct format
    return oldId
  }

  /**
   * Transform a directive ID
   * @param {string} oldId - Original ID (e.g., "cip-1")
   * @param {string} category - Directive category (e.g., "CIP")
   * @param {string} version - CDA version (e.g., "61")
   * @returns {string} New ID (e.g., "cda-61-cip-1")
   */
  transformDirectiveId(oldId, category, version = '61') {
    // Handle special cases
    if (!oldId || oldId === 'null' || oldId === 'undefined') {
      console.warn(`⚠️  Invalid directive ID: ${oldId}`)
      return `cda-${version}-unknown-${Math.random().toString(36).substr(2, 9)}`
    }

    // Transform: cip-1 → cda-61-cip-1
    // Also handles: adv → cda-61-adv, oh-010 → cda-61-oh-010
    return `cda-${version}-${oldId}`
  }

  /**
   * Transform a Conceptual Lexicon term ID
   * @param {string} oldId - Original ID (e.g., "mentation")
   * @param {string} version - CL version (e.g., "1.76")
   * @returns {string} New ID (e.g., "cl-1.76-mentation")
   */
  transformCLId(oldId, version = '1.76') {
    // Transform: mentation → cl-1.76-mentation
    return `cl-${version}-${oldId}`
  }

  /**
   * Transform other node types (default behavior)
   * @param {string} oldId - Original ID
   * @param {string} nodeType - Node type
   * @returns {string} New ID (unchanged by default)
   */
  transformDefaultId(oldId, nodeType) {
    // Keep unchanged for unknown types
    console.log(`⚠️  Unknown node type '${nodeType}', keeping ID unchanged: ${oldId}`)
    return oldId
  }

  /**
   * Transform an ID based on node metadata
   * @param {Object} nodeData - Node data object
   * @returns {string} Transformed ID
   */
  transformId(nodeData) {
    const { 
      id: oldId, 
      node_type, 
      category, 
      cda_version, 
      lexicon_version 
    } = nodeData

    // Determine version based on node type
    let version = '61' // Default CDA version
    if (node_type === 'cl_term' && lexicon_version) {
      version = lexicon_version
    } else if (cda_version) {
      version = cda_version.toString()
    }

    // Apply transformation rule
    const transformFn = this.transformationRules[node_type] || this.transformationRules.default
    const newId = transformFn(oldId, category, version)

    return newId
  }

  /**
   * Validate new ID format
   * @param {string} newId - ID to validate
   * @returns {boolean} True if valid
   */
  validateNewId(newId) {
    // Valid patterns:
    // - cda-61 (CDA metadata)
    // - cda-61-cip-1 (CDA directive)
    // - cda-61-adv (CDA directive without number)
    // - cda-61-oh-010 (CDA directive with special format)
    // - cl-1.76-mentation (CL term)

    const patterns = [
      /^cda-\d+$/, // CDA metadata: cda-61
      /^cda-\d+-[a-z]+-\d+$/, // CDA directive: cda-61-cip-1
      /^cda-\d+-[a-z]+$/, // CDA directive without number: cda-61-adv
      /^cda-\d+-[a-z]+-[a-z0-9]+$/, // CDA directive special: cda-61-oh-010
      /^cl-[\d.]+-.+$/, // CL term: cl-1.76-mentation
      /^[a-z-]+$/ // Legacy format (temporary)
    ]

    return patterns.some(pattern => pattern.test(newId))
  }

  /**
   * Create complete transformation map for all nodes
   * @param {Array} nodes - Array of node objects
   * @returns {Map} Map of oldId → newId
   */
  createTransformationMap(nodes) {
    const transformationMap = new Map()
    const stats = {
      transformed: 0,
      unchanged: 0,
      invalid: 0
    }

    console.log('🔄 Creating complete transformation map...')

    nodes.forEach(node => {
      const oldId = node.id
      const newId = this.transformId(node)

      // Validate new ID
      if (!this.validateNewId(newId)) {
        console.warn(`⚠️  Invalid new ID generated: ${oldId} → ${newId}`)
        stats.invalid++
        return
      }

      transformationMap.set(oldId, newId)

      if (oldId === newId) {
        stats.unchanged++
      } else {
        stats.transformed++
      }
    })

    console.log('📊 Transformation statistics:')
    console.log(`   Transformed: ${stats.transformed}`)
    console.log(`   Unchanged: ${stats.unchanged}`)
    console.log(`   Invalid: ${stats.invalid}`)
    console.log(`   Total: ${transformationMap.size}`)

    return transformationMap
  }

  /**
   * Get transformation examples
   * @param {Map} transformationMap - Transformation map
   * @param {number} limit - Number of examples to show
   */
  showTransformationExamples(transformationMap, limit = 10) {
    console.log('\n📋 Transformation examples:')
    
    let count = 0
    for (const [oldId, newId] of transformationMap) {
      if (count >= limit) break
      
      if (oldId !== newId) {
        console.log(`   ${oldId} → ${newId}`)
        count++
      }
    }

    if (count === 0) {
      console.log('   (No transformations needed)')
    }
  }

  /**
   * Validate transformation map completeness
   * @param {Map} transformationMap - Transformation map
   * @param {Array} edges - Array of edge objects
   * @returns {Object} Validation results
   */
  validateTransformationCompleteness(transformationMap, edges) {
    console.log('\n🔍 Validating transformation completeness...')

    const missingNodes = new Set()
    const edgeReferences = new Set()

    // Collect all node IDs referenced in edges
    edges.forEach(edge => {
      edgeReferences.add(edge.source)
      edgeReferences.add(edge.target)
    })

    // Check if all referenced nodes have transformations
    edgeReferences.forEach(nodeId => {
      if (!transformationMap.has(nodeId)) {
        missingNodes.add(nodeId)
      }
    })

    const results = {
      totalReferences: edgeReferences.size,
      missingTransformations: missingNodes.size,
      missingNodes: Array.from(missingNodes)
    }

    if (results.missingTransformations === 0) {
      console.log('✅ All edge references have transformations')
    } else {
      console.log(`⚠️  Missing transformations for ${results.missingTransformations} nodes:`)
      results.missingNodes.forEach(nodeId => {
        console.log(`   - ${nodeId}`)
      })
    }

    return results
  }
}

// Export for use in other scripts
module.exports = { IDMapper }
