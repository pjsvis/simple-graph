import { DatabaseConnection } from '../types/base-types';
import { generateMindMap } from '../visualization/mind-map-generator';
import { renderDotToImage, isGraphvizInstalled } from '../visualization/renderers/graphviz-renderer';
import { DotGraphGenerator } from '../visualization/dot-generator';
import { GRAPH_RECIPES } from '../visualization/canned-graphs';
import { GraphType } from '../types/visualization-types';

export interface MindMapOptions {
    startNodeId: string;
    depth: number;
}

export interface RenderOptions {
    format: 'svg' | 'png';
    path: string;
}

export class VisualizationManager {
    constructor(private connection: DatabaseConnection) {}

    public async mindMap(options: MindMapOptions): Promise<string> {
        return generateMindMap(options.startNodeId, options.depth, this.connection);
    }

    public async cannedGraph(type: GraphType): Promise<string> {
        const config = GRAPH_RECIPES[type];
        if (!config) {
            throw new Error(`Invalid graph type: ${type}`);
        }

        const generator = new DotGraphGenerator(this.connection);
        const dotContent = await generator.generateDot(config);
        return dotContent;
    }

    public async render(dot: string, options: RenderOptions): Promise<void> {
        if (!(await isGraphvizInstalled())) {
            throw new Error('Graphviz is not installed. Please install it to render graphs.');
        }
        return renderDotToImage(dot, options.format, options.path);
    }
}
