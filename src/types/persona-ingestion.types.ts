import { Node, Edge } from './base-types';

// Base interface for all persona-related nodes, ensuring timestamps
interface PersonaGraphNode extends Node {
  createdAt: string; // ISO 8601 format
  updatedAt: string; // ISO 8601 format
}

// Specific Node "Recipes"
export interface DirectiveNode extends PersonaGraphNode {
  type: 'directive';
  directiveId: string; // e.g., "PHI-1"
  title: string;
  category: 'CIP' | 'PHI' | 'COG' | 'OPM' | 'QPG';
  description: string;
}

export interface TermNode extends PersonaGraphNode {
  type: 'term';
  term: string; // e.g., "Mentation"
  definition: string;
  category: string;
}

// Specific Edge "Recipes"
export interface ReferencesEdge extends Edge {
  properties: {
    type: 'references';
    context: string;
  };
}

export interface SupportsEdge extends Edge {
  properties: {
    type: 'supports';
    weight: number; // e.g., 0.8
  };
}
