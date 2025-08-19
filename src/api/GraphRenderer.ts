import { DatabaseConnection } from '../types/base-types';
import { generateMindMap } from '../visualization/mind-map-generator';
import { renderDotToImage, isGraphvizInstalled } from '../visualization/renderers/graphviz-renderer';
import { DotGraphGenerator } from '../visualization/dot-generator';
import { GRAPH_RECIPES } from '../visualization/canned-graphs';
import { GraphType } from '../types/visualization-types';
import { GraphQuery } from './GraphQuery';

export interface MindMapOptions {
    startNodeId: string;
    depth: number;
}

export interface RenderOptions {
    format: 'svg' | 'png';
    path: string;
}

/**
 * Provides visualization and rendering methods for the graph database.
 * Includes mind map generation, canned graph views, and image rendering.
 *
 * Example usage:
 * ```ts
 * const renderer = new GraphRenderer(connection);
 * const dot = await renderer.mindMap({ startNodeId: 'A', depth: 2 });
 * await renderer.render(dot, { format: 'svg', path: 'output.svg' });
 * ```
 */
export class GraphRenderer {
    private query: GraphQuery;

    constructor(private connection: DatabaseConnection) {
        this.query = new GraphQuery(connection);
    }

    public async mindMap(options: MindMapOptions): Promise<string> {
        // Pass this.connection to generateMindMap
        return generateMindMap(options.startNodeId, options.depth, this.connection);
    }

    /**
     * Generate a pre-configured ("canned") graph visualization.
     * Use this to quickly create standard graph views (e.g., overview, category map).
     * @param type The type of canned graph to generate.
     * @returns DOT-format string representing the graph.
     */
    public async cannedGraph(type: GraphType): Promise<string> {
        const config = GRAPH_RECIPES[type];
        if (!config) {
            throw new Error(`Invalid graph type: ${type}`);
        }

        // Pass this.query to DotGraphGenerator
        const generator = new DotGraphGenerator(this.query);
        const dotContent = await generator.generateDot(config);
        return dotContent;
    }

    /**
     * Render a DOT-format graph to an image file (SVG or PNG).
     * Use this to produce visual output for documentation or presentations.
     * Requires Graphviz to be installed on the system.
     * @param dot DOT-format graph string.
     * @param options Render options including format and output path.
     */
    public async render(dot: string, options: RenderOptions): Promise<void> {
        if (!(await isGraphvizInstalled())) {
            throw new Error('Graphviz is not installed. Please install it to render graphs.');
        }
        return renderDotToImage(dot, options.format, options.path);
    }
}