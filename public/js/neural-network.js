/**
 * Neural Network Visualization
 * Renders a force-directed graph of neural dreamscape connections
 */

document.addEventListener('DOMContentLoaded', function() {
  const networkContainer = document.getElementById('network-visualization');
  if (!networkContainer) return;
  
  // Get network data from the data attribute
  let networkData;
  try {
    networkData = JSON.parse(networkContainer.dataset.network);
  } catch (error) {
    console.error('Error parsing network data:', error);
    return;
  }
  
  // Set up the SVG container
  const width = networkContainer.clientWidth;
  const height = 600;
  
  const svg = d3.select('#network-visualization')
    .append('svg')
    .attr('width', width)
    .attr('height', height);
  
  // Create a group for the network
  const g = svg.append('g');
  
  // Add zoom behavior
  const zoom = d3.zoom()
    .scaleExtent([0.1, 4])
    .on('zoom', (event) => {
      g.attr('transform', event.transform);
    });
  
  svg.call(zoom);
  
  // Create the simulation
  const simulation = d3.forceSimulation()
    .force('link', d3.forceLink().id(d => d._id).distance(100))
    .force('charge', d3.forceManyBody().strength(-300))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(60));
  
  // Process the data
  const nodes = networkData.nodes.map(node => ({
    ...node,
    radius: 30 + Math.min(node.stats.connections, 10) * 2
  }));
  
  const links = networkData.edges.map(edge => ({
    source: edge.sourceDreamscapeId,
    target: edge.targetDreamscapeId,
    strength: edge.strength,
    type: edge.type
  }));
  
  // Create the links
  const link = g.append('g')
    .attr('class', 'links')
    .selectAll('line')
    .data(links)
    .enter()
    .append('line')
    .attr('stroke-width', d => Math.max(1, d.strength / 20))
    .attr('stroke', getLinkColor)
    .attr('stroke-opacity', 0.6);
  
  // Create the nodes
  const node = g.append('g')
    .attr('class', 'nodes')
    .selectAll('g')
    .data(nodes)
    .enter()
    .append('g')
    .call(d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended));
  
  // Add circles to nodes
  node.append('circle')
    .attr('r', d => d.radius)
    .attr('fill', getNodeColor)
    .attr('stroke', '#ffffff')
    .attr('stroke-width', 1)
    .attr('stroke-opacity', 0.3);
  
  // Add glow effect
  node.append('circle')
    .attr('r', d => d.radius * 1.2)
    .attr('fill', 'none')
    .attr('stroke', getNodeColor)
    .attr('stroke-width', 2)
    .attr('stroke-opacity', 0.2)
    .attr('class', 'glow');
  
  // Add text to nodes
  node.append('text')
    .text(d => d.title)
    .attr('text-anchor', 'middle')
    .attr('dy', 4)
    .attr('fill', '#ffffff')
    .style('font-size', '12px')
    .style('pointer-events', 'none');
  
  // Add title for hover
  node.append('title')
    .text(d => `${d.title}\nCreated by: ${d.userId.username}\nConnections: ${d.stats.connections}`);
  
  // Add click handler
  node.on('click', function(event, d) {
    window.location.href = `/neural-dreamscape/view/${d._id}`;
  });
  
  // Update the simulation
  simulation
    .nodes(nodes)
    .on('tick', ticked);
  
  simulation.force('link')
    .links(links);
  
  // Add legend
  addLegend(svg);
  
  // Functions
  function ticked() {
    link
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);
    
    node
      .attr('transform', d => `translate(${d.x},${d.y})`);
  }
  
  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }
  
  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }
  
  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }
  
  function getNodeColor(d) {
    // Color based on themes
    if (d.themes && d.themes.length > 0) {
      const theme = d.themes[0].toLowerCase();
      
      if (theme.includes('creative') || theme.includes('art')) {
        return '#00f2ff'; // Neon blue
      } else if (theme.includes('tech') || theme.includes('science')) {
        return '#8a2be2'; // Neon purple
      } else if (theme.includes('emotion') || theme.includes('feeling')) {
        return '#ff00ff'; // Magenta
      } else if (theme.includes('nature') || theme.includes('environment')) {
        return '#00ff00'; // Green
      } else if (theme.includes('philosophy') || theme.includes('thought')) {
        return '#ffff00'; // Yellow
      } else {
        return '#ff6b6b'; // Coral
      }
    }
    
    return '#00f2ff'; // Default neon blue
  }
  
  function getLinkColor(d) {
    switch (d.type) {
      case 'similarity':
        return '#00f2ff'; // Neon blue
      case 'contrast':
        return '#ff00ff'; // Magenta
      case 'inspiration':
        return '#ffff00'; // Yellow
      case 'evolution':
        return '#00ff00'; // Green
      default:
        return '#ffffff'; // White
    }
  }
  
  function addLegend(svg) {
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', 'translate(20, 20)');
    
    // Connection types
    const connectionTypes = [
      { type: 'similarity', color: '#00f2ff', label: 'Similarity' },
      { type: 'contrast', color: '#ff00ff', label: 'Contrast' },
      { type: 'inspiration', color: '#ffff00', label: 'Inspiration' },
      { type: 'evolution', color: '#00ff00', label: 'Evolution' }
    ];
    
    // Add background
    legend.append('rect')
      .attr('width', 120)
      .attr('height', 110)
      .attr('fill', 'rgba(0, 0, 0, 0.7)')
      .attr('rx', 5)
      .attr('ry', 5);
    
    // Add title
    legend.append('text')
      .attr('x', 10)
      .attr('y', 20)
      .attr('fill', '#ffffff')
      .text('Connection Types')
      .style('font-size', '12px')
      .style('font-weight', 'bold');
    
    // Add items
    connectionTypes.forEach((item, i) => {
      const g = legend.append('g')
        .attr('transform', `translate(10, ${i * 20 + 40})`);
      
      g.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', 20)
        .attr('y2', 0)
        .attr('stroke', item.color)
        .attr('stroke-width', 2);
      
      g.append('text')
        .attr('x', 30)
        .attr('y', 4)
        .attr('fill', '#ffffff')
        .text(item.label)
        .style('font-size', '10px');
    });
  }
  
  // Add animation for glow effect
  function animateGlow() {
    d3.selectAll('.glow')
      .transition()
      .duration(2000)
      .attr('stroke-opacity', 0.5)
      .transition()
      .duration(2000)
      .attr('stroke-opacity', 0.1)
      .on('end', animateGlow);
  }
  
  animateGlow();
});
