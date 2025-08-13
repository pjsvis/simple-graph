/**
 * Conceptual Lexicon Parser
 * 
 * Parses the conceptual-lexicon.json file and converts entries to database nodes
 */

import { readFileSync } from 'fs';
import type { 
  ConceptualLexiconFile,
  ConceptualLexiconEntry,
  TermNode,
  CategoryNode,
  VersionNode,
  CategoryMembership,
  VersionMembership
} from '../types/cl-types';
import { ConceptualLexiconUtils } from '../types/cl-types';

export class ConceptualLexiconParser {
  /**
   * Parse the conceptual lexicon JSON file
   */
  static parseJsonFile(filePath: string): ConceptualLexiconFile {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content) as ConceptualLexiconFile;
      
      // Validate required fields
      if (!data.lexicon_version || !data.entries || !Array.isArray(data.entries)) {
        throw new Error('Invalid conceptual lexicon file structure');
      }
      
      return data;
    } catch (error) {
      throw new Error(`Failed to parse conceptual lexicon file: ${error.message}`);
    }
  }

  /**
   * Create a version node from lexicon metadata
   */
  static createVersionNode(lexiconData: ConceptualLexiconFile): VersionNode {
    return {
      id: ConceptualLexiconUtils.normalizeTermId(`cl-v${lexiconData.lexicon_version}`),
      version: lexiconData.lexicon_version,
      export_timestamp: lexiconData.export_timestamp,
      entry_count: lexiconData.entry_count,
      cda_reference_version: lexiconData.cda_reference_version,
      purpose: lexiconData.lexicon_purpose,
      node_type: 'version'
    };
  }

  /**
   * Extract unique categories from entries
   */
  static extractCategories(entries: ConceptualLexiconEntry[]): string[] {
    const categories = new Set<string>();
    
    entries.forEach(entry => {
      if (entry.Category) {
        categories.add(entry.Category);
      }
    });
    
    return Array.from(categories).sort();
  }

  /**
   * Create category nodes from unique categories
   */
  static createCategoryNodes(categories: string[]): CategoryNode[] {
    return categories.map(category => ({
      id: ConceptualLexiconUtils.normalizeTermId(`category-${category}`),
      category_name: category,
      description: `Category for terms of type: ${category}`,
      node_type: 'category'
    }));
  }

  /**
   * Convert lexicon entries to term nodes
   */
  static createTermNodes(entries: ConceptualLexiconEntry[], lexiconVersion: string): TermNode[] {
    return entries
      .filter(entry => entry.Term && entry.Definition) // Filter out invalid entries
      .map(entry => {
        const aliases = Array.isArray(entry.Colloquial_Alias)
          ? entry.Colloquial_Alias
          : entry.Colloquial_Alias
            ? [entry.Colloquial_Alias]
            : undefined;

        return {
          id: ConceptualLexiconUtils.normalizeTermId(entry.Term),
          term: entry.Term,
          definition: typeof entry.Definition === 'string' ? entry.Definition : String(entry.Definition),
          category: entry.Category,
          status: entry.Status,
          timestamp_added: entry.Timestamp_Added,
          context_reference: entry.Context_Reference,
          colloquial_alias: aliases,
          lexicon_version: lexiconVersion,
          node_type: 'term'
        };
      });
  }

  /**
   * Create category membership edges
   */
  static createCategoryMemberships(termNodes: TermNode[]): CategoryMembership[] {
    return termNodes
      .filter(term => term.category)
      .map(term => ({
        source: term.id,
        target: ConceptualLexiconUtils.normalizeTermId(`category-${term.category}`),
        properties: {
          type: 'belongs_to' as const,
          primary: true
        }
      }));
  }

  /**
   * Create version membership edges
   */
  static createVersionMemberships(termNodes: TermNode[], versionNode: VersionNode): VersionMembership[] {
    return termNodes.map(term => ({
      source: term.id,
      target: versionNode.id,
      properties: {
        type: 'present_in' as const,
        timestamp: term.timestamp_added
      }
    }));
  }

  /**
   * Get statistics about the lexicon data
   */
  static getStatistics(lexiconData: ConceptualLexiconFile): {
    totalEntries: number;
    categoryCounts: Record<string, number>;
    statusCounts: Record<string, number>;
    entriesWithAliases: number;
    entriesWithContext: number;
  } {
    const categoryCounts: Record<string, number> = {};
    const statusCounts: Record<string, number> = {};
    let entriesWithAliases = 0;
    let entriesWithContext = 0;

    lexiconData.entries.forEach(entry => {
      // Count categories
      if (entry.Category) {
        categoryCounts[entry.Category] = (categoryCounts[entry.Category] || 0) + 1;
      }

      // Count statuses
      if (entry.Status) {
        statusCounts[entry.Status] = (statusCounts[entry.Status] || 0) + 1;
      }

      // Count entries with aliases
      if (entry.Colloquial_Alias) {
        entriesWithAliases++;
      }

      // Count entries with context
      if (entry.Context_Reference) {
        entriesWithContext++;
      }
    });

    return {
      totalEntries: lexiconData.entries.length,
      categoryCounts,
      statusCounts,
      entriesWithAliases,
      entriesWithContext
    };
  }

  /**
   * Find terms that reference CDA directives
   */
  static findCDAReferences(entries: ConceptualLexiconEntry[]): Array<{
    term: string;
    references: string[];
    contexts: string[];
  }> {
    const cdaPattern = /\b([A-Z]{2,4}-\d+)\b/g;
    const results: Array<{ term: string; references: string[]; contexts: string[] }> = [];

    entries.forEach(entry => {
      const references = new Set<string>();
      const contexts: string[] = [];

      // Check definition for CDA references (handle non-string definitions)
      if (entry.Definition && typeof entry.Definition === 'string') {
        const definitionMatches = entry.Definition.match(cdaPattern);
        if (definitionMatches) {
          definitionMatches.forEach(match => {
            references.add(match);
            contexts.push(`Definition: ${entry.Definition.substring(0, 100)}...`);
          });
        }
      }

      // Check context reference for CDA references
      if (entry.Context_Reference && typeof entry.Context_Reference === 'string') {
        const contextMatches = entry.Context_Reference.match(cdaPattern);
        if (contextMatches) {
          contextMatches.forEach(match => {
            references.add(match);
            contexts.push(`Context: ${entry.Context_Reference.substring(0, 100)}...`);
          });
        }
      }

      if (references.size > 0) {
        results.push({
          term: entry.Term,
          references: Array.from(references),
          contexts
        });
      }
    });

    return results;
  }

  /**
   * Complete import workflow - parse and create all nodes and edges
   */
  static processLexiconFile(filePath: string): {
    lexiconData: ConceptualLexiconFile;
    versionNode: VersionNode;
    categoryNodes: CategoryNode[];
    termNodes: TermNode[];
    categoryMemberships: CategoryMembership[];
    versionMemberships: VersionMembership[];
    statistics: ReturnType<typeof ConceptualLexiconParser.getStatistics>;
    cdaReferences: ReturnType<typeof ConceptualLexiconParser.findCDAReferences>;
  } {
    // Parse the file
    const lexiconData = this.parseJsonFile(filePath);

    // Create nodes
    const versionNode = this.createVersionNode(lexiconData);
    const categories = this.extractCategories(lexiconData.entries);
    const categoryNodes = this.createCategoryNodes(categories);
    const termNodes = this.createTermNodes(lexiconData.entries, lexiconData.lexicon_version);

    // Create edges
    const categoryMemberships = this.createCategoryMemberships(termNodes);
    const versionMemberships = this.createVersionMemberships(termNodes, versionNode);

    // Generate statistics and analysis
    const statistics = this.getStatistics(lexiconData);
    const cdaReferences = this.findCDAReferences(lexiconData.entries);

    return {
      lexiconData,
      versionNode,
      categoryNodes,
      termNodes,
      categoryMemberships,
      versionMemberships,
      statistics,
      cdaReferences
    };
  }
}
