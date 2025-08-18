import { readFileSync } from 'fs';
import type { 
  CoreDirectiveArrayFile, 
  CoreDirectiveEntry,
  CDANode,
  DirectiveNode,
  CoreConceptNode
} from '../types/cl-types';
import { ConceptualLexiconUtils } from '../types/cl-types';
import { SimpleGraph } from '../SimpleGraph';
import { Node } from '../types/base-types';

/**
 * Parser for Core Directive Array markdown files
 */
export class CDAParser {
  /**
   * Parse the core-directive-array.md file into structured data
   */
  static parseMarkdownFile(filePath: string): CoreDirectiveArrayFile {
    const content = readFileSync(filePath, 'utf-8');
    
    // Extract YAML front matter
    const yamlMatch = content.match(/```yaml\s*\n---\s*\n([\s\S]*?)\n---\s*\n```/);
    if (!yamlMatch) {
      throw new Error('Could not find YAML front matter in markdown file');
    }
    
    const yamlContent = yamlMatch[1];
    const metadata = this.parseYAMLMetadata(yamlContent);
    
    // Extract core directives from the main content
    const directives = this.extractDirectives(content);
    
    return {
      ...metadata,
      core_directives: directives
    };
  }

  /**
   * Parse YAML metadata section
   */
  private static parseYAMLMetadata(yamlContent: string): Omit<CoreDirectiveArrayFile, 'core_directives'> {
    const lines = yamlContent.split('\n');
    const metadata: any = {};
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex === -1) continue;
      
      const key = trimmed.substring(0, colonIndex).trim();
      let value = trimmed.substring(colonIndex + 1).trim();
      
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'"') && value.endsWith("'"'))) {
        value = value.slice(1, -1);
      }
      
      // Convert numbers
      if (/^\d+$/.test(value)) {
        metadata[key] = parseInt(value);
      } else {
        metadata[key] = value;
      }
    }
    
    return {
      cda_version: metadata.cda_version || 61,
      title: metadata.title || 'Core Directive Array',
      purpose: metadata.purpose || '',
      summary: metadata.summary || '',
      cda_type: metadata.cda_type || 'Persona',
      designation: metadata.designation || 'Contextualise This',
      short_designation: metadata.short_designation || 'Ctx',
      cda_series_id: metadata.cda_series_id || 'E',
      cda_series_name: metadata.cda_series_name || 'EPSILON',
      version: metadata.version || metadata.cda_version || 61,
      status: metadata.status || 'Active',
      inception_date: metadata.inception_date || '2025-06-27',
      operational_heuristics_reference: metadata.operational_heuristics_reference
    };
  }

  /**
   * Extract directives from the markdown content
   */
  private static extractDirectives(content: string): CoreDirectiveEntry[] {
    const directives: CoreDirectiveEntry[] = [];
    
    // Pattern to match directive entries like "- **CIP-1 (Title):** Description"
    const directivePattern = /^- \*\*([A-Z]{2,4}-\d+(?:\.\d+)?)\s*\(([^)]+)\):\*\*\s*([\s\S]*?)(?=^- \*\*[A-Z]{2,4}-\d+|^##|$)/gm;
    
    let match;
    while ((match = directivePattern.exec(content)) !== null) {
      const [, id, title, description] = match;
      
      directives.push({
        id: id.trim(),
        title: title.trim(),
        description: this.cleanDescription(description.trim())
      });
    }
    
    // Also extract directives from the YAML section
    const yamlDirectives = this.extractYAMLDirectives(content);
    directives.push(...yamlDirectives);
    
    // Remove duplicates based on ID
    const uniqueDirectives = directives.filter((directive, index, self) => 
      index === self.findIndex(d => d.id === directive.id)
    );
    
    return uniqueDirectives;
  }

  /**
   * Extract directives from YAML section
   */
  private static extractYAMLDirectives(content: string): CoreDirectiveEntry[] {
    const directives: CoreDirectiveEntry[] = [];
    
    // Extract from YAML core_directives section
    const yamlMatch = content.match(/```yaml\s*\n---\s*\n([\s\S]*?)\n---\s*\n```/);
    if (!yamlMatch) return directives;
    
    const yamlContent = yamlMatch[1];
    const lines = yamlContent.split('\n');
    
    let inDirectives = false;
    let currentDirective: Partial<CoreDirectiveEntry> = {};
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed === 'core_directives:') {
        inDirectives = true;
        continue;
      }
      
      if (inDirectives) {
        if (trimmed.startsWith('- id:')) {
          // Save previous directive if exists
          if (currentDirective.id) {
            directives.push(currentDirective as CoreDirectiveEntry);
          }
          currentDirective = { id: trimmed.replace('- id:', '').trim() };
        } else if (trimmed.startsWith('id:')) {
          currentDirective.id = trimmed.replace('id:', '').trim();
        } else if (trimmed.startsWith('title:')) {
          currentDirective.title = trimmed.replace('title:', '').trim();
        } else if (trimmed.startsWith('description:')) {
          let desc = trimmed.replace('description:', '').trim();
          // Remove quotes
          if ((desc.startsWith('"') && desc.endsWith('"')) || 
              (desc.startsWith("'"') && desc.endsWith("'"'))) {
            desc = desc.slice(1, -1);
          }
          currentDirective.description = desc;
        } else if (trimmed && !trimmed.startsWith('#') && !trimmed.includes(':')) {
          // Stop processing if we hit a non-directive section
          break;
        }
      }
    }
    
    // Save last directive
    if (currentDirective.id) {
      directives.push(currentDirective as CoreDirectiveEntry);
    }
    
    return directives;
  }

  /**
   * Clean up description text
   */
  private static cleanDescription(description: string): string {
    return description
      .replace(/\n\s+/g, ' ')  // Replace newlines with spaces
      .replace(/\s+/g, ' ')    // Collapse multiple spaces
      .trim();
  }

  /**
   * Extract core concepts from the markdown content
   */
  static extractCoreConcepts(content: string): Array<{name: string, definition: string, type: 'core_concept' | 'operational_principle'}> {
    const concepts: Array<{name: string, definition: string, type: 'core_concept' | 'operational_principle'}> = [];
    
    // Extract from "## Core Concepts" section
    const coreConceptsMatch = content.match(/## Core Concepts\s*\n([\s\S]*?)(?=## |$)/);
    if (coreConceptsMatch) {
      const conceptsSection = coreConceptsMatch[1];
      const conceptMatches = conceptsSection.matchAll(/### ([^\n]+)\n\n([^\n]+(?:\n(?!###)[^\n]+)*)/g);
      
      for (const match of conceptMatches) {
        const [, name, definition] = match;
        concepts.push({
          name: name.trim(),
          definition: this.cleanDescription(definition.trim()),
          type: 'core_concept'
        });
      }
    }
    
    // Extract from "## Operational Principles" section
    const principlesMatch = content.match(/## Operational Principles\s*\n([\s\S]*?)(?=## |$)/);
    if (principlesMatch) {
      const principlesSection = principlesMatch[1];
      const principleMatches = principlesSection.matchAll(/### ([^\n]+)\n\n([^\n]+(?:\n(?!###)[^\n]+)*)/g);
      
      for (const match of principleMatches) {
        const [, name, definition] = match;
        concepts.push({
          name: name.trim(),
          definition: this.cleanDescription(definition.trim()),
          type: 'operational_principle'
        });
      }
    }
    
    return concepts;
  }

  /**
   * Convert parsed data to database nodes
   */
  static createCDANode(data: CoreDirectiveArrayFile): CDANode {
    return {
      id: `cda-${data.cda_version}`,
      cda_version: data.cda_version,
      title: data.title,
      purpose: data.purpose,
      summary: data.summary,
      cda_type: data.cda_type,
      designation: data.designation,
      short_designation: data.short_designation,
      cda_series_id: data.cda_series_id,
      cda_series_name: data.cda_series_name,
      status: data.status,
      inception_date: data.inception_date,
      node_type: 'cda'
    };
  }

  /**
   * Convert directive entries to database nodes
   */
  static createDirectiveNodes(directives: CoreDirectiveEntry[], cdaVersion: number): DirectiveNode[] {
    return directives.map(directive => {
      const categoryInfo = ConceptualLexiconUtils.parseDirectiveCategory(directive.id);
      
      return {
        id: ConceptualLexiconUtils.normalizeDirectiveId(directive.id),
        directive_id: directive.id,
        title: directive.title,
        description: directive.description,
        category: categoryInfo.category,
        category_title: categoryInfo.categoryTitle,
        cda_version: cdaVersion,
        node_type: 'directive'
      };
    });
  }

  /**
   * Convert core concepts to database nodes
   */
  static createCoreConceptNodes(concepts: Array<{name: string, definition: string, type: 'core_concept' | 'operational_principle'}>, cdaVersion: number): CoreConceptNode[] {
    return concepts.map(concept => ({
      id: ConceptualLexiconUtils.normalizeTermId(concept.name),
      concept_name: concept.name,
      definition: concept.definition,
      concept_type: concept.type,
      cda_version: cdaVersion,
      node_type: 'core_concept'
    }));
  }
}

export async function importCda(graph: SimpleGraph, filePath: string): Promise<void> {
  const fileContent = readFileSync(filePath, 'utf-8');
  const cdaFile = CDAParser.parseMarkdownFile(filePath);

  const cdaNode = CDAParser.createCDANode(cdaFile);
  const directiveNodes = CDAParser.createDirectiveNodes(cdaFile.core_directives, cdaFile.cda_version);
  const coreConcepts = CDAParser.extractCoreConcepts(fileContent);
  const coreConceptNodes = CDAParser.createCoreConceptNodes(coreConcepts, cdaFile.cda_version);

  const allNodes: Node[] = [
    cdaNode,
    ...directiveNodes,
    ...coreConceptNodes,
  ];

  for (const node of allNodes) {
    await graph.nodes.add(node);
  }
}