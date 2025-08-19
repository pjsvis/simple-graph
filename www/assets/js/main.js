/**
 * Knowledge Graph Explorer - Main JavaScript
 */

// Visualization data structure
const visualizations = {
  organic: [
    {
      id: 'complete-knowledge-graph',
      title: 'Complete Knowledge Graph',
      description: 'Full network view of all CDA directives and conceptual lexicon terms',
      thumbnail: 'assets/images/thumbnails/complete-knowledge-graph_thumb.png',
      fullImage: 'assets/images/complete-knowledge-graph.png',
      svg: 'assets/images/svg/complete-knowledge-graph.svg'
    },
    {
      id: 'directives-only',
      title: 'CDA Directives Network',
      description: 'Focused view of Core Directive Array relationships',
      thumbnail: 'assets/images/thumbnails/directives-only_thumb.png',
      fullImage: 'assets/images/directives-only.png',
      svg: 'assets/images/svg/directives-only.svg'
    },
    {
      id: 'layout-force-directed',
      title: 'Force-Directed Layout',
      description: 'Natural clustering based on relationship strength',
      thumbnail: 'assets/images/thumbnails/layout-force-directed_thumb.png',
      fullImage: 'assets/images/layout-force-directed.png',
      svg: 'assets/images/svg/layout-force-directed.svg'
    },
    {
      id: 'layout-hierarchical',
      title: 'Hierarchical Layout',
      description: 'Tree-like structure showing categorical organization',
      thumbnail: 'assets/images/thumbnails/layout-hierarchical_thumb.png',
      fullImage: 'assets/images/layout-hierarchical.png',
      svg: 'assets/images/svg/layout-hierarchical.svg'
    },
    {
      id: 'layout-circular',
      title: 'Circular Layout',
      description: 'Radial arrangement highlighting central concepts',
      thumbnail: 'assets/images/thumbnails/layout-circular_thumb.png',
      fullImage: 'assets/images/layout-circular.png',
      svg: 'assets/images/svg/layout-circular.svg'
    },
    {
      id: 'layout-radial',
      title: 'Radial Layout',
      description: 'Hub-and-spoke visualization of key relationships',
      thumbnail: 'assets/images/thumbnails/layout-radial_thumb.png',
      fullImage: 'assets/images/layout-radial.png',
      svg: 'assets/images/svg/layout-radial.svg'
    }
  ],
  synth: [
    {
      id: 'hub-authority',
      title: 'Hub & Authority Analysis',
      description: 'Identifies most connected and influential nodes',
      thumbnail: 'assets/images/thumbnails/hub-authority_thumb.png',
      fullImage: 'assets/images/hub-authority.png',
      svg: 'assets/images/svg/hub-authority.svg'
    },
    {
      id: 'semantic-similarity',
      title: 'Semantic Similarity Clusters',
      description: 'Groups related concepts by semantic meaning',
      thumbnail: 'assets/images/thumbnails/semantic-similarity_thumb.png',
      fullImage: 'assets/images/semantic-similarity.png',
      svg: 'assets/images/svg/semantic-similarity.svg'
    },
    {
      id: 'cross-category-bridges',
      title: 'Cross-Category Bridges',
      description: 'Highlights connections between different directive categories',
      thumbnail: 'assets/images/thumbnails/cross-category-bridges_thumb.png',
      fullImage: 'assets/images/cross-category-bridges.png',
      svg: 'assets/images/svg/cross-category-bridges.svg'
    },
    {
      id: 'inspirational-clusters',
      title: 'Inspirational Clusters',
      description: 'Thematic groupings of related operational concepts',
      thumbnail: 'assets/images/thumbnails/inspirational-clusters_thumb.png',
      fullImage: 'assets/images/inspirational-clusters.png',
      svg: 'assets/images/svg/inspirational-clusters.svg'
    },
    {
      id: 'category-phi',
      title: 'Processing Philosophy (PHI)',
      description: 'Deep dive into philosophical processing directives',
      thumbnail: 'assets/images/thumbnails/category-phi_thumb.png',
      fullImage: 'assets/images/category-phi.png',
      svg: 'assets/images/svg/category-phi.svg'
    },
    {
      id: 'category-cog',
      title: 'Cognitive Strategies (COG)',
      description: 'Cognitive processing and reasoning strategies',
      thumbnail: 'assets/images/thumbnails/category-cog_thumb.png',
      fullImage: 'assets/images/category-cog.png',
      svg: 'assets/images/svg/category-cog.svg'
    }
  ]
};

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
  initializeVisualizationGallery();
  initializeSmoothScrolling();
  initializeImageModal();
  updateStatistics();
});

/**
 * Initialize the visualization gallery
 */
function initializeVisualizationGallery() {
  const organicContainer = document.getElementById('organic-visualizations');
  const synthContainer = document.getElementById('synth-visualizations');

  if (organicContainer) {
    renderVisualizationGrid(visualizations.organic, organicContainer);
  }

  if (synthContainer) {
    renderVisualizationGrid(visualizations.synth, synthContainer);
  }
}

/**
 * Render visualization cards in a container
 */
function renderVisualizationGrid(vizList, container) {
  container.innerHTML = '';

  vizList.forEach(viz => {
    const card = createVisualizationCard(viz);
    container.appendChild(card);
  });
}

/**
 * Create a visualization card element
 */
function createVisualizationCard(viz) {
  const card = document.createElement('div');
  card.className = 'viz-card';
  card.innerHTML = `
    <img src="${viz.thumbnail}" alt="${viz.title}" loading="lazy" onerror="this.src='assets/images/placeholder.svg'">
    <div class="viz-card-content">
      <h4>${viz.title}</h4>
      <p>${viz.description}</p>
      <div class="viz-actions">
        <button class="btn btn-outline btn-sm" onclick="openImageModal('${viz.fullImage}', '${viz.title}')">
          View PNG
        </button>
        <a href="${viz.svg}" target="_blank" class="btn btn-outline btn-sm">
          View SVG
        </a>
      </div>
    </div>
  `;

  return card;
}

/**
 * Initialize smooth scrolling for navigation links
 */
function initializeSmoothScrolling() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

/**
 * Initialize image modal functionality
 */
function initializeImageModal() {
  // Create modal HTML
  const modalHTML = `
    <div id="imageModal" class="modal" style="display: none;">
      <div class="modal-content">
        <span class="modal-close">&times;</span>
        <img id="modalImage" src="" alt="">
        <div class="modal-caption">
          <h3 id="modalTitle"></h3>
          <p id="modalDescription"></p>
        </div>
      </div>
    </div>
  `;

  // Add modal CSS
  const modalCSS = `
    <style>
      .modal {
        position: fixed;
        z-index: 2000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.9);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .modal-content {
        position: relative;
        max-width: 90%;
        max-height: 90%;
        background: white;
        border-radius: 8px;
        overflow: hidden;
      }
      .modal-close {
        position: absolute;
        top: 15px;
        right: 25px;
        color: white;
        font-size: 35px;
        font-weight: bold;
        cursor: pointer;
        z-index: 2001;
        background: rgba(0,0,0,0.5);
        border-radius: 50%;
        width: 50px;
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .modal-close:hover {
        background: rgba(0,0,0,0.8);
      }
      #modalImage {
        width: 100%;
        height: auto;
        display: block;
      }
      .modal-caption {
        padding: 20px;
        background: white;
      }
      .modal-caption h3 {
        margin: 0 0 10px 0;
        color: var(--primary-color);
      }
      .modal-caption p {
        margin: 0;
        color: var(--text-light);
      }
    </style>
  `;

  // Add to document
  document.head.insertAdjacentHTML('beforeend', modalCSS);
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // Add event listeners
  const modal = document.getElementById('imageModal');
  const closeBtn = document.querySelector('.modal-close');

  closeBtn.addEventListener('click', closeImageModal);
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      closeImageModal();
    }
  });

  // Escape key to close
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeImageModal();
    }
  });
}

/**
 * Open image modal
 */
function openImageModal(imageSrc, title, description = '') {
  const modal = document.getElementById('imageModal');
  const modalImage = document.getElementById('modalImage');
  const modalTitle = document.getElementById('modalTitle');
  const modalDescription = document.getElementById('modalDescription');

  modalImage.src = imageSrc;
  modalTitle.textContent = title;
  modalDescription.textContent = description;
  
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

/**
 * Close image modal
 */
function closeImageModal() {
  const modal = document.getElementById('imageModal');
  modal.style.display = 'none';
  document.body.style.overflow = 'auto';
}

/**
 * Update statistics dynamically
 */
function updateStatistics() {
  // This could fetch real-time data from an API
  // For now, we'll use static values that match our current data
  const stats = {
    directives: 85,
    terms: 134,
    relationships: 24,
    categories: 93
  };

  // Update stat cards if they exist
  const statCards = document.querySelectorAll('.stat-number');
  if (statCards.length >= 4) {
    statCards[0].textContent = stats.directives;
    statCards[1].textContent = stats.terms;
    statCards[2].textContent = stats.relationships;
    statCards[3].textContent = stats.categories;
  }
}

/**
 * Search functionality (for future implementation)
 */
function initializeSearch() {
  // Placeholder for search functionality
  // Could integrate with the database API
}

/**
 * Export current view as image (for future implementation)
 */
function exportView(format = 'png') {
  // Placeholder for export functionality
  console.log(`Exporting view as ${format}`);
}

// Make functions globally available
window.openImageModal = openImageModal;
window.closeImageModal = closeImageModal;
window.exportView = exportView;
