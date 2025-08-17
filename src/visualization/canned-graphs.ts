
import type { Database } from '../../database/connection';
import { DotGraphGenerator, type DotGraphConfig } from './dot-generator';
import type { GraphType } from '../types/visualization-types';

const GRAPH_RECIPES: Record<GraphType, Partial<DotGraphConfig>> = {
  'complete': {
    title: 'Complete CDA Knowledge Graph',
    layout: 'dot',
    clusterByCategory: true,
    maxEdges: 100,
    showNodeLabels: true,
    showEdgeLabels: false
  },
  'directives-only': {
    title: 'Core Directives Network',
    includeNodeTypes: ['directive'],
    includeEdgeTypes: ['references', 'semantic_similarity', 'category_bridge'],
    layout: 'neato',
    clusterByCategory: true,
    showNodeLabels: true,
    maxLabelLength: 20
  },
  'relationships-network': {
    title: 'Directive Relationships Network',
    includeNodeTypes: ['directive'],
    includeEdgeTypes: ['semantic_similarity', 'shared_inspiration', 'keyword_similarity'],
    layout: 'fdp',
    clusterByNodeType: false,
    showNodeLabels: true,
    showEdgeLabels: true,
    maxLabelLength: 15,
    edgeColors: {
      'semantic_similarity': '#4CAF50',
      'shared_inspiration': '#9C27B0',
      'keyword_similarity': '#FF9800'
    }
  },
  'category-adv': {
    title: 'ADV Category Network',
    includeCategories: ['ADV'],
    includeNodeTypes: ['directive'],
    layout: 'circo',
    clusterByCategory: false,
    showNodeLabels: true,
    showEdgeLabels: true,
    maxLabelLength: 25,
    nodeColors: { 'directive': '#FFCDD2' }
  },
  'category-cog': {
    title: 'COG Category Network',
    includeCategories: ['COG'],
    includeNodeTypes: ['directive'],
    layout: 'circo',
    clusterByCategory: false,
    showNodeLabels: true,
    showEdgeLabels: true,
    maxLabelLength: 25,
    nodeColors: { 'directive': '#C8E6C9' }
  },
  'category-phi': {
    title: 'PHI Category Network',
    includeCategories: ['PHI'],
    includeNodeTypes: ['directive'],
    layout: 'circo',
    clusterByCategory: false,
    showNodeLabels: true,
    showEdgeLabels: true,
    maxLabelLength: 25,
    nodeColors: { 'directive': '#DCEDC8' }
  },
  'category-qpg': {
    title: 'QPG Category Network',
    includeCategories: ['QPG'],
    includeNodeTypes: ['directive'],
    layout: 'circo',
    clusterByCategory: false,
    showNodeLabels: true,
    showEdgeLabels: true,
    maxLabelLength: 25,
    nodeColors: { 'directive': '#FFE0B2' }
  },
  'category-opm': {
    title: 'OPM Category Network',
    includeCategories: ['OPM'],
    includeNodeTypes: ['directive'],
    layout: 'circo',
    clusterByCategory: false,
    showNodeLabels: true,
    showEdgeLabels: true,
    maxLabelLength: 25,
    nodeColors: { 'directive': '#E1BEE7' }
  },
  'cross-category-bridges': {
    title: 'Cross-Category Bridges',
    includeNodeTypes: ['directive'],
    includeEdgeTypes: ['category_bridge'],
    layout: 'dot',
    rankdir: 'LR',
    clusterByCategory: true,
    showNodeLabels: true,
    showEdgeLabels: true,
    edgeColors: { 'category_bridge': '#FF5722' },
    edgeStyles: { 'category_bridge': 'bold' }
  },
  'inspirational-clusters': {
    title: 'Inspirational Source Networks',
    includeNodeTypes: ['directive'],
    includeEdgeTypes: ['shared_inspiration'],
    layout: 'neato',
    clusterByCategory: false,
    showNodeLabels: true,
    showEdgeLabels: false,
    nodeColors: { 'directive': '#F3E5F5' },
    edgeColors: { 'shared_inspiration': '#9C27B0' },
    edgeStyles: { 'shared_inspiration': 'dotted' }
  },
  'semantic-similarity': {
    title: 'Semantic Similarity Network',
    includeNodeTypes: ['directive'],
    includeEdgeTypes: ['semantic_similarity', 'keyword_similarity'],
    layout: 'sfdp',
    clusterByCategory: false,
    showNodeLabels: true,
    showEdgeLabels: false,
    nodeColors: { 'directive': '#E8F5E8' },
    edgeColors: {
      'semantic_similarity': '#4CAF50',
      'keyword_similarity': '#8BC34A'
    },
    edgeStyles: {
      'semantic_similarity': 'dashed',
      'keyword_similarity': 'solid'
    }
  },
  'hub-authority': {
    title: 'Hub and Authority Nodes',
    includeNodeTypes: ['directive'],
    layout: 'dot',
    clusterByCategory: false,
    showNodeLabels: true,
    showEdgeLabels: false,
    maxEdges: 50
  },
  'layout-hierarchical': {
    title: 'Layout: Hierarchical top-down',
    layout: 'dot',
    includeNodeTypes: ['directive'],
    includeCategories: ['ADV', 'COG', 'PHI'],
    maxEdges: 30,
    showNodeLabels: true,
    showEdgeLabels: false
  },
  'layout-force-directed': {
    title: 'Layout: Force-directed spring model',
    layout: 'neato',
    includeNodeTypes: ['directive'],
    includeCategories: ['ADV', 'COG', 'PHI'],
    maxEdges: 30,
    showNodeLabels: true,
    showEdgeLabels: false
  },
  'layout-spring-model': {
    title: 'Layout: Spring model for large graphs',
    layout: 'fdp',
    includeNodeTypes: ['directive'],
    includeCategories: ['ADV', 'COG', 'PHI'],
    maxEdges: 30,
    showNodeLabels: true,
    showEdgeLabels: false
  },
  'layout-circular': {
    title: 'Layout: Circular layout',
    layout: 'circo',
    includeNodeTypes: ['directive'],
    includeCategories: ['ADV', 'COG', 'PHI'],
    maxEdges: 30,
    showNodeLabels: true,
    showEdgeLabels: false
  },
  'layout-radial': {
    title: 'Layout: Radial layout',
    layout: 'twopi',
    includeNodeTypes: ['directive'],
    includeCategories: ['ADV', 'COG', 'PHI'],
    maxEdges: 30,
    showNodeLabels: true,
    showEdgeLabels: false
  }
};

/**
 * Generates a DOT graph string for a specified canned graph type.
 * @param {GraphType} graphType The type of canned graph to generate.
 * @param {Database} db The database connection instance.
 * @returns {Promise<string>} A promise that resolves with the DOT graph string.
 */
export async function generateCannedDotGraph(
  graphType: GraphType,
  db: Database
): Promise<string> {
  const config = GRAPH_RECIPES[graphType];
  if (!config) {
    throw new Error(`Invalid graph type: ${graphType}`);
  }

  const generator = new DotGraphGenerator(db);
  const dotContent = await generator.generateDot(config);
  return dotContent;
}
