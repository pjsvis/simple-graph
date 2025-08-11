import { Node, Edge } from './types';

/**
 * Raw conceptual lexicon entry as it appears in the JSON file
 */
export interface ConceptualLexiconEntry {
  Term: string;
  Definition: string;
  Category: string;
  Status: string;
  Timestamp_Added: string;
  Context_Reference?: string;
  Colloquial_Alias?: string | string[];
  [key: string]: any; // For any additional fields
}

/**
 * Raw conceptual lexicon file structure
 */
export interface ConceptualLexiconFile {
  lexicon_version: string;
  entry_count: number;
  export_timestamp: string;
  cda_reference_version: string;
  lexicon_purpose: string;
  entries: ConceptualLexiconEntry[];
}

/**
 * Term node for storing in the graph database
 */
export interface TermNode extends Node {
  id: string;                    // Normalized term ID (e.g., "mentation")
  term: string;                  // Original term name (e.g., "Mentation")
  definition: string;            // Definition text
  category: string;              // Category (e.g., "Core Concept")
  status: string;                // Status (active, tbd, etc.)
  timestamp_added: string;       // When the term was added
  context_reference?: string;    // Context reference text
  colloquial_alias?: string[];   // Alternative names/aliases
  lexicon_version: string;       // Source lexicon version
  node_type: 'term';            // Discriminator for node type
}

/**
 * Category node for organizing terms
 */
export interface CategoryNode extends Node {
  id: string;                    // Category ID (e.g., "core-concept")
  name: string;                  // Display name (e.g., "Core Concept")
  description?: string;          // Optional description
  node_type: 'category';        // Discriminator for node type
}

/**
 * Version node for tracking lexicon versions
 */
export interface VersionNode extends Node {
  id: string;                    // Version ID (e.g., "v1.76")
  version: string;               // Version string
  export_timestamp: string;      // When this version was exported
  entry_count: number;           // Number of entries in this version
  cda_reference_version: string; // Associated CDA version
  lexicon_purpose: string;       // Purpose statement
  node_type: 'version';         // Discriminator for node type
}

/**
 * Term relationship edge
 */
export interface TermRelationship extends Edge {
  source: string;                // Source term ID
  target: string;                // Target term ID
  properties: {
    type: 'references' | 'related_to' | 'supersedes' | 'informs' | 'formalized_in' | 'managed_under';
    context?: string;            // Context where relationship was mentioned
    strength?: number;           // Relationship strength (0-1)
    extracted_from?: string;     // Which field this was extracted from
  };
}

/**
 * Category membership edge
 */
export interface CategoryMembership extends Edge {
  source: string;                // Term ID
  target: string;                // Category ID
  properties: {
    type: 'belongs_to';
    primary: boolean;            // Is this the primary category?
  };
}

/**
 * Version membership edge
 */
export interface VersionMembership extends Edge {
  source: string;                // Term ID
  target: string;                // Version ID
  properties: {
    type: 'introduced_in' | 'modified_in' | 'present_in';
    timestamp: string;
  };
}

/**
 * Union type for all conceptual lexicon nodes
 */
export type ConceptualLexiconNode = TermNode | CategoryNode | VersionNode;

/**
 * Union type for all conceptual lexicon edges
 */
export type ConceptualLexiconEdge = TermRelationship | CategoryMembership | VersionMembership;

/**
 * Raw Core Directive Array file structure
 */
export interface CoreDirectiveArrayFile {
  cda_version: number;
  title: string;
  purpose: string;
  summary: string;
  cda_type: string;
  designation: string;
  short_designation: string;
  cda_series_id: string;
  cda_series_name: string;
  version: number;
  status: string;
  inception_date: string;
  core_directives: CoreDirectiveEntry[];
  operational_heuristics_reference?: string;
}

/**
 * Raw core directive entry from YAML
 */
export interface CoreDirectiveEntry {
  id: string;
  title: string;
  description: string;
}

/**
 * Core Directive Array metadata node
 */
export interface CDANode extends Node {
  id: string;                    // CDA ID (e.g., "cda-61")
  cda_version: number;           // Version number
  title: string;                 // Full title
  purpose: string;               // Purpose statement
  summary: string;               // Summary description
  cda_type: string;              // Type (e.g., "Persona")
  designation: string;           // Full designation
  short_designation: string;     // Short designation (e.g., "Ctx")
  cda_series_id: string;         // Series ID (e.g., "E")
  cda_series_name: string;       // Series name (e.g., "EPSILON")
  status: string;                // Status (e.g., "Active")
  inception_date: string;        // Date of inception
  node_type: 'cda';             // Discriminator
}

/**
 * Core directive node
 */
export interface DirectiveNode extends Node {
  id: string;                    // Directive ID (e.g., "cip-1")
  directive_id: string;          // Original ID (e.g., "CIP-1")
  title: string;                 // Directive title
  description: string;           // Directive description
  category: string;              // Category (CIP, IPR, PHI, etc.)
  category_title: string;        // Category full title
  cda_version: number;           // Source CDA version
  node_type: 'directive';       // Discriminator
}

/**
 * Core concept node (from foundational concepts section)
 */
export interface CoreConceptNode extends Node {
  id: string;                    // Concept ID (e.g., "mentation")
  concept_name: string;          // Concept name
  definition: string;            // Definition text
  concept_type: 'core_concept' | 'operational_principle';
  cda_version: number;           // Source CDA version
  node_type: 'core_concept';    // Discriminator
}

/**
 * CDA membership edge (directive belongs to CDA)
 */
export interface CDAMembership extends Edge {
  source: string;                // Directive ID
  target: string;                // CDA ID
  properties: {
    type: 'belongs_to_cda';
    category: string;            // Directive category
  };
}

/**
 * Directive relationship edge
 */
export interface DirectiveRelationship extends Edge {
  source: string;                // Source directive ID
  target: string;                // Target directive ID
  properties: {
    type: 'references' | 'supports' | 'supersedes' | 'conflicts_with' | 'depends_on';
    context?: string;            // Context where relationship was mentioned
    extracted_from?: string;     // Which field this was extracted from
  };
}

/**
 * Union type for all CDA nodes
 */
export type CDANodeType = CDANode | DirectiveNode | CoreConceptNode;

/**
 * Union type for all CDA edges
 */
export type CDAEdgeType = CDAMembership | DirectiveRelationship;

/**
 * Utility functions for working with conceptual lexicon data
 */
export class ConceptualLexiconUtils {
  /**
   * Normalize a term name to create a consistent ID
   */
  static normalizeTermId(term: string): string {
    return term
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special chars except hyphens
      .replace(/\s+/g, '-')     // Replace spaces with hyphens
      .replace(/-+/g, '-')      // Collapse multiple hyphens
      .replace(/^-|-$/g, '');   // Remove leading/trailing hyphens
  }

  /**
   * Normalize a category name to create a consistent ID
   */
  static normalizeCategoryId(category: string): string {
    return category
      .toLowerCase()
      .replace(/[^\w\s]/g, '')  // Remove special chars
      .replace(/\s+/g, '-')     // Replace spaces with hyphens
      .replace(/-+/g, '-')      // Collapse multiple hyphens
      .replace(/^-|-$/g, '');   // Remove leading/trailing hyphens
  }

  /**
   * Extract term references from context reference text
   */
  static extractTermReferences(contextReference: string): Array<{term: string, type: string, context: string}> {
    const references: Array<{term: string, type: string, context: string}> = [];
    
    // Patterns to match different reference types
    const patterns = [
      { regex: /related to ([A-Z]{2,4}-\d+(?:, [A-Z]{2,4}-\d+)*)/gi, type: 'related_to' },
      { regex: /ref ([A-Z]{2,4}-\d+)/gi, type: 'references' },
      { regex: /supersedes ([A-Z]{2,4}-\d+)/gi, type: 'supersedes' },
      { regex: /formalized in ([A-Z]{2,4}-\d+)/gi, type: 'formalized_in' },
      { regex: /managed under ([A-Z]{2,4}-\d+)/gi, type: 'managed_under' },
      { regex: /\(([A-Z]{2,4}-\d+)\)/gi, type: 'references' },
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.regex.exec(contextReference)) !== null) {
        const termList = match[1];
        // Handle comma-separated lists
        const terms = termList.split(',').map(t => t.trim());
        
        for (const term of terms) {
          if (term && term.match(/^[A-Z]{2,4}-\d+$/)) {
            references.push({
              term: term,
              type: pattern.type,
              context: match[0]
            });
          }
        }
      }
    }

    return references;
  }

  /**
   * Process colloquial aliases into a consistent array format
   */
  static processColloquialAliases(alias: string | string[] | undefined): string[] | undefined {
    if (!alias) return undefined;

    if (typeof alias === 'string') {
      return [alias];
    }

    return alias;
  }

  /**
   * Normalize a directive ID to create a consistent database ID
   */
  static normalizeDirectiveId(directiveId: string): string {
    return directiveId
      .toLowerCase()
      .replace(/[^\w-]/g, '-')   // Replace non-word chars with hyphens
      .replace(/-+/g, '-')       // Collapse multiple hyphens
      .replace(/^-|-$/g, '');    // Remove leading/trailing hyphens
  }

  /**
   * Extract directive references from description text
   */
  static extractDirectiveReferences(description: string): Array<{directive: string, type: string, context: string}> {
    const references: Array<{directive: string, type: string, context: string}> = [];

    // Patterns to match different reference types
    const patterns = [
      { regex: /\(ref ([A-Z]{2,4}-\d+(?:, [A-Z]{2,4}-\d+)*)\)/gi, type: 'references' },
      { regex: /ref ([A-Z]{2,4}-\d+)/gi, type: 'references' },
      { regex: /supports ([A-Z]{2,4}-\d+)/gi, type: 'supports' },
      { regex: /supersedes ([A-Z]{2,4}-\d+)/gi, type: 'supersedes' },
      { regex: /conflicts with ([A-Z]{2,4}-\d+)/gi, type: 'conflicts_with' },
      { regex: /depends on ([A-Z]{2,4}-\d+)/gi, type: 'depends_on' },
      { regex: /guided by ([A-Z]{2,4}-\d+)/gi, type: 'references' },
      { regex: /aligns with ([A-Z]{2,4}-\d+)/gi, type: 'supports' },
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.regex.exec(description)) !== null) {
        const directiveList = match[1];
        // Handle comma-separated lists
        const directives = directiveList.split(',').map(d => d.trim());

        for (const directive of directives) {
          if (directive && directive.match(/^[A-Z]{2,4}-\d+$/)) {
            references.push({
              directive: directive,
              type: pattern.type,
              context: match[0]
            });
          }
        }
      }
    }

    return references;
  }

  /**
   * Parse category information from directive ID
   */
  static parseDirectiveCategory(directiveId: string): {category: string, categoryTitle: string} {
    const categoryMap: Record<string, string> = {
      'CIP': 'Core Identity & Persona',
      'IPR': 'Core Interaction Style',
      'PHI': 'Processing Philosophy',
      'QHD': 'Query Handling Directives',
      'IEP': 'Interactive Elaboration Protocol',
      'QPG': 'Query Processing Guidelines',
      'COG': 'Cognitive Strategies',
      'DYN': 'Dynamic Optimization',
      'ADV': 'Advanced Directives',
      'SIN': 'Special Interests',
      'OPM': 'Operational Protocol Management'
    };

    const category = directiveId.split('-')[0];
    return {
      category,
      categoryTitle: categoryMap[category] || category
    };
  }
}
