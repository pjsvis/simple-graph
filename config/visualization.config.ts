export const VisualizationConfig = {
  outputPath: 'outputs/',
  
  dot: {
    path: 'visualizations/',
    defaultLayout: 'dot',
    maxNodes: 1000,
    maxEdges: 2000
  },
  
  images: {
    path: 'images/',
    formats: ['png', 'svg'],
    dpi: 300,
    thumbnailSize: 400
  },
  
  colors: {
    directive: '#E3F2FD',
    cda: '#FFF3E0',
    ohTerm: '#F3E5F5',
    coreConcept: '#E8F5E8'
  }
}
