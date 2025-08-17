import { DatabaseConnection, Node } from '../types/base-types';

/**
 * Configuration for DOT graph generation
 */
export interface DotGraphConfig {
  // Graph layout and appearance
  layout?: 'dot' | 'neato' | 'fdp' | 'sfdp' | 'circo' | 'twopi'
  rankdir?: 'TB' | 'BT' | 'LR' | 'RL'
  
  // Node filtering
  includeNodeTypes?: string[]
  excludeNodeTypes?: string[]
  includeCategories?: string[]
  excludeCategories?: string[]
  
  // Edge filtering
  includeEdgeTypes?: string[]
  excludeEdgeTypes?: string[]
  maxEdges?: number
  
  // Visual styling
  nodeColors?: Record<string, string>
  edgeColors?: Record<string, string>
  nodeShapes?: Record<string, string>
  edgeStyles?: Record<string, string>
  
  // Labels and text
  showNodeLabels?: boolean
  showEdgeLabels?: boolean
  maxLabelLength?: number
  
  // Clustering
  clusterByCategory?: boolean
  clusterByNodeType?: boolean
  
  // Output options
  title?: string
  fontSize?: number
  dpi?: number
}

// ... (rest of the file is the same, just the Database interface is removed)


/**
 * Default configuration for DOT graph generation
 */
export const DEFAULT_DOT_CONFIG: DotGraphConfig = {
  layout: 'dot',
  rankdir: 'TB',
  includeNodeTypes: ['directive', 'cda', 'oh_term'],
  includeEdgeTypes: ['references', 'semantic_similarity', 'category_bridge', 'shared_inspiration'],
  maxEdges: 200,
  nodeColors: {
    'directive': '#E3F2FD',
    'cda': '#FFF3E0', 
    'oh_term': '#F3E5F5',
    'core_concept': '#E8F5E8'
  },
  edgeColors: {
    'references': '#1976D2',
    'semantic_similarity': '#388E3C',
    'category_bridge': '#F57C00',
    'shared_inspiration': '#7B1FA2',
    'keyword_similarity': '#5D4037',
    'belongs_to_cda': '#757575'
  },
  nodeShapes: {
    'directive': 'box',
    'cda': 'ellipse',
    'oh_term': 'diamond',
    'core_concept': 'hexagon'
  },
  edgeStyles: {
    'references': 'solid',
    'semantic_similarity': 'dashed',
    'category_bridge': 'bold',
    'shared_inspiration': 'dotted'
  },
  showNodeLabels: true,
  showEdgeLabels: false,
  maxLabelLength: 30,
  clusterByCategory: true,
  fontSize: 10,
  dpi: 300
}

/**
 * Node data for DOT generation
 */
interface DotNode {
  id: string
  label: string
  nodeType: string
  category?: string
  color?: string
  shape?: string
  tooltip?: string
}

/**
 * Edge data for DOT generation
 */
interface DotEdge {
  source: string
  target: string
  label?: string
  type: string
  color?: string
  style?: string
  tooltip?: string
}

/**
 * DOT graph generator for knowledge graph visualization
 */
export class DotGraphGenerator {
  constructor(private db: DatabaseConnection) {}

  /**
   * Generate DOT graph from database
   */
  async generateDot(config: Partial<DotGraphConfig> = {}): Promise<string> {
    const finalConfig = { ...DEFAULT_DOT_CONFIG, ...config }
    
    // Extract nodes and edges from database
    const nodes = await this.extractNodes(finalConfig)
    const edges = await this.extractEdges(finalConfig)
    
    // Generate DOT content
    return this.buildDotGraph(nodes, edges, finalConfig)
  }

  /**
   * Extract nodes from database based on configuration
   */
  private async extractNodes(config: DotGraphConfig): Promise<DotNode[]> {
    let whereConditions: string[] = []
    let params: any[] = []

    // Filter by node types
    if (config.includeNodeTypes && config.includeNodeTypes.length > 0) {
      const placeholders = config.includeNodeTypes.map(() => '?').join(',')
      whereConditions.push(`json_extract(body, '$.node_type') IN (${placeholders})`)
      params.push(...config.includeNodeTypes)
    }

    if (config.excludeNodeTypes && config.excludeNodeTypes.length > 0) {
      const placeholders = config.excludeNodeTypes.map(() => '?').join(',')
      whereConditions.push(`json_extract(body, '$.node_type') NOT IN (${placeholders})`)
      params.push(...config.excludeNodeTypes)
    }

    // Filter by categories
    if (config.includeCategories && config.includeCategories.length > 0) {
      const placeholders = config.includeCategories.map(() => '?').join(',')
      whereConditions.push(`json_extract(body, '$.category') IN (${placeholders})`)
      params.push(...config.includeCategories)
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    const query = `
      SELECT 
        id,
        json_extract(body, '$.node_type') as node_type,
        json_extract(body, '$.directive_id') as directive_id,
        json_extract(body, '$.title') as title,
        json_extract(body, '$.term') as term,
        json_extract(body, '$.concept_name') as concept_name,
        json_extract(body, '$.category') as category,
        json_extract(body, '$.description') as description,
        json_extract(body, '$.definition') as definition
      FROM nodes 
      ${whereClause}
      ORDER BY node_type, category, id
    `

    const rows = await this.db.all(query, ...params)

    // Handle case where rows might not be an array
    if (!Array.isArray(rows)) {
      console.warn('Database query returned non-array result:', rows)
      return []
    }

    return rows.map(row => this.createDotNode(row, config))
  }

  /**
   * Create DOT node from database row
   */
  private createDotNode(row: any, config: DotGraphConfig): DotNode {
    const nodeType = row.node_type
    
    // Determine label based on node type
    let label = ''
    if (nodeType === 'directive') {
      label = row.directive_id || row.id
      if (config.showNodeLabels && row.title) {
        label += `\\n${this.truncateText(row.title, config.maxLabelLength)}`
      }
    } else if (nodeType === 'cda') {
      label = row.title || 'CDA'
    } else if (nodeType === 'oh_term') {
      label = row.term || row.id
    } else if (nodeType === 'core_concept') {
      label = row.concept_name || row.id
    } else {
      label = row.id
    }

    // Create tooltip with additional information
    let tooltip = `Type: ${nodeType}`
    if (row.category) tooltip += `\\nCategory: ${row.category}`
    if (row.description) tooltip += `\\nDescription: ${this.truncateText(row.description, 100)}`
    if (row.definition) tooltip += `\\nDefinition: ${this.truncateText(row.definition, 100)}`

    return {
      id: this.sanitizeId(row.id),
      label: this.escapeLabel(label),
      nodeType,
      category: row.category,
      color: config.nodeColors?.[nodeType],
      shape: config.nodeShapes?.[nodeType],
      tooltip: this.escapeLabel(tooltip)
    }
  }

  /**
   * Extract edges from database based on configuration
   */
  private async extractEdges(config: DotGraphConfig): Promise<DotEdge[]> {
    let whereConditions: string[] = []
    let params: any[] = []

    // Filter by edge types
    if (config.includeEdgeTypes && config.includeEdgeTypes.length > 0) {
      const placeholders = config.includeEdgeTypes.map(() => '?').join(',')
      whereConditions.push(`json_extract(properties, '$.type') IN (${placeholders})`)
      params.push(...config.includeEdgeTypes)
    }

    if (config.excludeEdgeTypes && config.excludeEdgeTypes.length > 0) {
      const placeholders = config.excludeEdgeTypes.map(() => '?').join(',')
      whereConditions.push(`json_extract(properties, '$.type') NOT IN (${placeholders})`)
      params.push(...config.excludeEdgeTypes)
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''
    const limitClause = config.maxEdges ? `LIMIT ${config.maxEdges}` : ''

    const query = `
      SELECT 
        source,
        target,
        json_extract(properties, '$.type') as edge_type,
        json_extract(properties, '$.context') as context
      FROM edges 
      ${whereClause}
      ORDER BY edge_type, source, target
      ${limitClause}
    `

    const rows = await this.db.all(query, ...params)

    // Handle case where rows might not be an array
    if (!Array.isArray(rows)) {
      console.warn('Database query returned non-array result for edges:', rows)
      return []
    }

    return rows.map(row => this.createDotEdge(row, config))
  }

  /**
   * Create DOT edge from database row
   */
  private createDotEdge(row: any, config: DotGraphConfig): DotEdge {
    const edgeType = row.edge_type
    
    let label = ''
    if (config.showEdgeLabels) {
      label = edgeType
      if (row.context) {
        label += `\\n${this.truncateText(row.context, config.maxLabelLength)}`
      }
    }

    let tooltip = `Type: ${edgeType}`
    if (row.context) tooltip += `\\nContext: ${this.truncateText(row.context, 100)}`

    return {
      source: this.sanitizeId(row.source),
      target: this.sanitizeId(row.target),
      label: config.showEdgeLabels ? this.escapeLabel(label) : undefined,
      type: edgeType,
      color: config.edgeColors?.[edgeType],
      style: config.edgeStyles?.[edgeType],
      tooltip: this.escapeLabel(tooltip)
    }
  }

  /**
   * Build complete DOT graph string
   */
  private buildDotGraph(nodes: DotNode[], edges: DotEdge[], config: DotGraphConfig): string {
    const lines: string[] = []
    
    // Graph header
    lines.push('digraph KnowledgeGraph {')
    lines.push(`  layout="${config.layout}"`)
    lines.push(`  rankdir="${config.rankdir}"`)
    lines.push(`  dpi=${config.dpi}`)
    lines.push(`  fontsize=${config.fontSize}`)
    lines.push('  node [fontname="Arial"]')
    lines.push('  edge [fontname="Arial"]')
    
    if (config.title) {
      lines.push(`  labelloc="t"`)
      lines.push(`  label="${this.escapeLabel(config.title)}"`)
    }
    
    lines.push('')

    // Add clusters if requested
    if (config.clusterByCategory) {
      this.addCategoryClusters(lines, nodes, config)
    } else if (config.clusterByNodeType) {
      this.addNodeTypeClusters(lines, nodes, config)
    } else {
      // Add nodes without clustering
      this.addNodes(lines, nodes)
    }

    lines.push('')

    // Add edges
    this.addEdges(lines, edges)

    lines.push('}')
    
    return lines.join('\n')
  }

  /**
   * Add category-based clusters to DOT graph
   */
  private addCategoryClusters(lines: string[], nodes: DotNode[], config: DotGraphConfig): void {
    const nodesByCategory = new Map<string, DotNode[]>()
    
    // Group nodes by category
    for (const node of nodes) {
      const category = node.category || 'Uncategorized'
      if (!nodesByCategory.has(category)) {
        nodesByCategory.set(category, [])
      }
      nodesByCategory.get(category)!.push(node)
    }

    // Create clusters
    let clusterIndex = 0
    for (const [category, categoryNodes] of nodesByCategory) {
      lines.push(`  subgraph cluster_${clusterIndex} {`)
      lines.push(`    label="${this.escapeLabel(category)}"`)
      lines.push('    style=filled')
      lines.push('    fillcolor=lightgrey')
      lines.push('')
      
      for (const node of categoryNodes) {
        lines.push(this.formatNode(node))
      }
      
      lines.push('  }')
      lines.push('')
      clusterIndex++
    }
  }

  /**
   * Add node type-based clusters to DOT graph
   */
  private addNodeTypeClusters(lines: string[], nodes: DotNode[], config: DotGraphConfig): void {
    const nodesByType = new Map<string, DotNode[]>()
    
    // Group nodes by type
    for (const node of nodes) {
      if (!nodesByType.has(node.nodeType)) {
        nodesByType.set(node.nodeType, [])
      }
      nodesByType.get(node.nodeType)!.push(node)
    }

    // Create clusters
    let clusterIndex = 0
    for (const [nodeType, typeNodes] of nodesByType) {
      lines.push(`  subgraph cluster_${clusterIndex} {`)
      lines.push(`    label="${this.escapeLabel(nodeType.toUpperCase())}"`)
      lines.push('    style=filled')
      lines.push('    fillcolor=lightblue')
      lines.push('')
      
      for (const node of typeNodes) {
        lines.push(this.formatNode(node))
      }
      
      lines.push('  }')
      lines.push('')
      clusterIndex++
    }
  }

  /**
   * Add nodes without clustering
   */
  private addNodes(lines: string[], nodes: DotNode[]): void {
    lines.push('  // Nodes')
    for (const node of nodes) {
      lines.push(this.formatNode(node))
    }
  }

  /**
   * Format a single node for DOT output
   */
  private formatNode(node: DotNode): string {
    const attributes: string[] = []
    
    attributes.push(`label="${node.label}"`)
    
    if (node.color) attributes.push(`fillcolor="${node.color}"`)
    if (node.shape) attributes.push(`shape="${node.shape}"`)
    if (node.tooltip) attributes.push(`tooltip="${node.tooltip}"`)
    
    attributes.push('style=filled')
    
    return `    ${node.id} [${attributes.join(', ')}]`
  }

  /**
   * Add edges to DOT graph
   */
  private addEdges(lines: string[], edges: DotEdge[]): void {
    lines.push('  // Edges')
    for (const edge of edges) {
      lines.push(this.formatEdge(edge))
    }
  }

  /**
   * Format a single edge for DOT output
   */
  private formatEdge(edge: DotEdge): string {
    const attributes: string[] = []
    
    if (edge.label) attributes.push(`label="${edge.label}"`)
    if (edge.color) attributes.push(`color="${edge.color}"`)
    if (edge.style) attributes.push(`style="${edge.style}"`)
    if (edge.tooltip) attributes.push(`tooltip="${edge.tooltip}"`)
    
    const attrString = attributes.length > 0 ? ` [${attributes.join(', ')}]` : ''
    return `    ${edge.source} -> ${edge.target}${attrString}`
  }

  /**
   * Utility functions
   */
  private sanitizeId(id: string): string {
    return id.replace(/[^a-zA-Z0-9_]/g, '_')
  }

  private escapeLabel(text: string): string {
    return text.replace(/"/g, '\\"').replace(/\n/g, '\\n')
  }

  private truncateText(text: string, maxLength?: number): string {
    if (!maxLength || text.length <= maxLength) return text
    return text.substring(0, maxLength - 3) + '...'
  }
}
