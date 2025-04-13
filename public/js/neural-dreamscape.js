/**
 * Neural Dreamscape Canvas
 * Handles the interactive canvas for creating and editing neural dreamscapes
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize the canvas if it exists
  const canvas = document.getElementById('dreamscape-canvas');
  if (!canvas) return;

  // Get the canvas context
  const ctx = canvas.getContext('2d');
  
  // Set canvas dimensions
  function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.offsetWidth;
    canvas.height = 500; // Fixed height
    
    // Redraw canvas content after resize
    if (window.dreamscapeState) {
      drawDreamscape(window.dreamscapeState);
    }
  }
  
  // Initialize canvas
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  // Initialize state
  window.dreamscapeState = {
    nodes: [],
    connections: [],
    activeNode: null,
    isDragging: false,
    lastMousePos: { x: 0, y: 0 }
  };
  
  // Load existing data if editing
  const existingData = document.getElementById('existing-canvas-data');
  if (existingData && existingData.value) {
    try {
      window.dreamscapeState = JSON.parse(existingData.value);
      drawDreamscape(window.dreamscapeState);
    } catch (error) {
      console.error('Error parsing existing canvas data:', error);
    }
  }
  
  // Event listeners
  canvas.addEventListener('mousedown', startDrag);
  canvas.addEventListener('mousemove', drag);
  canvas.addEventListener('mouseup', endDrag);
  canvas.addEventListener('dblclick', createNode);
  
  // Add touch support
  canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
  canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
  canvas.addEventListener('touchend', handleTouchEnd);
  
  // Add toolbar event listeners
  document.querySelectorAll('.node-color').forEach(button => {
    button.addEventListener('click', function() {
      const color = this.dataset.color;
      if (window.dreamscapeState.activeNode) {
        window.dreamscapeState.activeNode.color = color;
        drawDreamscape(window.dreamscapeState);
        updateFormData();
      }
    });
  });
  
  document.getElementById('add-node-btn').addEventListener('click', function() {
    // Create a node in the center of the canvas
    const x = canvas.width / 2;
    const y = canvas.height / 2;
    createNodeAt(x, y);
  });
  
  document.getElementById('connect-nodes-btn').addEventListener('click', function() {
    window.connectingNodes = !window.connectingNodes;
    this.classList.toggle('active', window.connectingNodes);
    
    if (window.connectingNodes) {
      window.connectionStart = null;
      canvas.style.cursor = 'crosshair';
    } else {
      canvas.style.cursor = 'default';
    }
  });
  
  document.getElementById('delete-node-btn').addEventListener('click', function() {
    if (window.dreamscapeState.activeNode) {
      // Remove connections involving this node
      window.dreamscapeState.connections = window.dreamscapeState.connections.filter(conn => 
        conn.source !== window.dreamscapeState.activeNode.id && 
        conn.target !== window.dreamscapeState.activeNode.id
      );
      
      // Remove the node
      window.dreamscapeState.nodes = window.dreamscapeState.nodes.filter(node => 
        node.id !== window.dreamscapeState.activeNode.id
      );
      
      window.dreamscapeState.activeNode = null;
      drawDreamscape(window.dreamscapeState);
      updateFormData();
    }
  });
  
  // Node text input
  document.getElementById('node-text').addEventListener('input', function() {
    if (window.dreamscapeState.activeNode) {
      window.dreamscapeState.activeNode.text = this.value;
      drawDreamscape(window.dreamscapeState);
      updateFormData();
    }
  });
  
  // Functions
  function createNode(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    createNodeAt(x, y);
  }
  
  function createNodeAt(x, y) {
    // Generate a unique ID
    const id = Date.now().toString();
    
    // Create a new node
    const newNode = {
      id,
      x,
      y,
      radius: 50,
      color: '#00f2ff', // Default color
      text: 'New Thought',
      pulseEffect: 5 // Initial pulse effect
    };
    
    // Add to state
    window.dreamscapeState.nodes.push(newNode);
    window.dreamscapeState.activeNode = newNode;
    
    // Update node text input
    document.getElementById('node-text').value = newNode.text;
    document.getElementById('node-text').focus();
    
    // Show node options
    document.getElementById('node-options').classList.remove('hidden');
    
    drawDreamscape(window.dreamscapeState);
    updateFormData();
  }
  
  function startDrag(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Check if we're in connecting mode
    if (window.connectingNodes) {
      // Find if we clicked on a node
      const clickedNode = findNodeAt(mouseX, mouseY);
      
      if (clickedNode) {
        if (!window.connectionStart) {
          // Start connection
          window.connectionStart = clickedNode;
        } else {
          // Complete connection
          if (window.connectionStart.id !== clickedNode.id) {
            // Create a new connection
            window.dreamscapeState.connections.push({
              source: window.connectionStart.id,
              target: clickedNode.id,
              strength: 0.5, // Default strength
              type: 'similarity' // Default type
            });
            
            drawDreamscape(window.dreamscapeState);
            updateFormData();
          }
          
          // Reset connection state
          window.connectionStart = null;
        }
      }
      
      return;
    }
    
    // Find if we clicked on a node
    const clickedNode = findNodeAt(mouseX, mouseY);
    
    if (clickedNode) {
      window.dreamscapeState.activeNode = clickedNode;
      window.dreamscapeState.isDragging = true;
      window.dreamscapeState.lastMousePos = { x: mouseX, y: mouseY };
      
      // Update node text input
      document.getElementById('node-text').value = clickedNode.text;
      
      // Show node options
      document.getElementById('node-options').classList.remove('hidden');
    } else {
      window.dreamscapeState.activeNode = null;
      
      // Hide node options
      document.getElementById('node-options').classList.add('hidden');
    }
    
    drawDreamscape(window.dreamscapeState);
  }
  
  function drag(e) {
    if (!window.dreamscapeState.isDragging || !window.dreamscapeState.activeNode) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calculate the movement
    const dx = mouseX - window.dreamscapeState.lastMousePos.x;
    const dy = mouseY - window.dreamscapeState.lastMousePos.y;
    
    // Update the node position
    window.dreamscapeState.activeNode.x += dx;
    window.dreamscapeState.activeNode.y += dy;
    
    // Update the last mouse position
    window.dreamscapeState.lastMousePos = { x: mouseX, y: mouseY };
    
    drawDreamscape(window.dreamscapeState);
    updateFormData();
  }
  
  function endDrag() {
    window.dreamscapeState.isDragging = false;
  }
  
  function findNodeAt(x, y) {
    // Find a node at the given coordinates
    return window.dreamscapeState.nodes.find(node => {
      const dx = node.x - x;
      const dy = node.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance <= node.radius;
    });
  }
  
  function drawDreamscape(state) {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    drawBackground();
    
    // Draw connections
    state.connections.forEach(connection => {
      drawConnection(connection, state.nodes);
    });
    
    // Draw nodes
    state.nodes.forEach(node => {
      drawNode(node, node === state.activeNode);
    });
    
    // Draw connection in progress
    if (window.connectingNodes && window.connectionStart) {
      const startNode = window.connectionStart;
      const mousePos = window.dreamscapeState.lastMousePos;
      
      ctx.beginPath();
      ctx.moveTo(startNode.x, startNode.y);
      ctx.lineTo(mousePos.x, mousePos.y);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
  
  function drawBackground() {
    // Create a gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#1f2937');
    gradient.addColorStop(1, '#111827');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add some subtle neural network patterns
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    
    for (let i = 0; i < 10; i++) {
      const x1 = Math.random() * canvas.width;
      const y1 = Math.random() * canvas.height;
      const x2 = Math.random() * canvas.width;
      const y2 = Math.random() * canvas.height;
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }
  
  function drawNode(node, isActive) {
    // Draw glow effect
    ctx.beginPath();
    const gradient = ctx.createRadialGradient(node.x, node.y, node.radius / 2, node.x, node.y, node.radius * 1.5);
    gradient.addColorStop(0, node.color + '80'); // Semi-transparent
    gradient.addColorStop(1, node.color + '00'); // Transparent
    ctx.fillStyle = gradient;
    ctx.arc(node.x, node.y, node.radius * 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
    
    // Create a gradient fill
    const nodeGradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.radius);
    nodeGradient.addColorStop(0, node.color);
    nodeGradient.addColorStop(1, shadeColor(node.color, -20));
    
    ctx.fillStyle = nodeGradient;
    ctx.fill();
    
    // Draw border
    ctx.strokeStyle = isActive ? '#ffffff' : node.color;
    ctx.lineWidth = isActive ? 3 : 1;
    ctx.stroke();
    
    // Draw text
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Wrap text to fit in the node
    const words = node.text.split(' ');
    const lines = [];
    let currentLine = words[0];
    
    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + ' ' + word).width;
      
      if (width < node.radius * 1.5) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    
    // Draw each line
    const lineHeight = 18;
    const startY = node.y - ((lines.length - 1) * lineHeight) / 2;
    
    lines.forEach((line, index) => {
      ctx.fillText(line, node.x, startY + index * lineHeight);
    });
    
    // Add pulse effect for new nodes
    if (node.pulseEffect > 0) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius + node.pulseEffect * 3, 0, Math.PI * 2);
      ctx.strokeStyle = node.color + Math.floor(node.pulseEffect * 20).toString(16);
      ctx.lineWidth = 2;
      ctx.stroke();
      
      node.pulseEffect -= 0.1;
      if (node.pulseEffect < 0) node.pulseEffect = 0;
    }
  }
  
  function drawConnection(connection, nodes) {
    // Find the source and target nodes
    const sourceNode = nodes.find(node => node.id === connection.source);
    const targetNode = nodes.find(node => node.id === connection.target);
    
    if (!sourceNode || !targetNode) return;
    
    // Draw the connection line
    ctx.beginPath();
    ctx.moveTo(sourceNode.x, sourceNode.y);
    ctx.lineTo(targetNode.x, targetNode.y);
    
    // Create a gradient based on the node colors
    const gradient = ctx.createLinearGradient(sourceNode.x, sourceNode.y, targetNode.x, targetNode.y);
    gradient.addColorStop(0, sourceNode.color + '80'); // Semi-transparent
    gradient.addColorStop(1, targetNode.color + '80'); // Semi-transparent
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = connection.strength * 5;
    ctx.stroke();
    
    // Draw animated particles along the connection
    drawConnectionParticles(sourceNode, targetNode, connection);
  }
  
  function drawConnectionParticles(sourceNode, targetNode, connection) {
    // Calculate the direction vector
    const dx = targetNode.x - sourceNode.x;
    const dy = targetNode.y - sourceNode.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Normalize the direction vector
    const nx = dx / distance;
    const ny = dy / distance;
    
    // Draw particles
    const now = Date.now();
    const particleCount = Math.floor(distance / 30);
    
    for (let i = 0; i < particleCount; i++) {
      // Calculate particle position
      const offset = (now / 1000 + i / particleCount) % 1;
      const x = sourceNode.x + dx * offset;
      const y = sourceNode.y + dy * offset;
      
      // Draw particle
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fillStyle = offset < 0.5 ? sourceNode.color : targetNode.color;
      ctx.fill();
    }
  }
  
  function updateFormData() {
    // Update the hidden form field with the current state
    const canvasDataField = document.getElementById('canvas-data');
    if (canvasDataField) {
      canvasDataField.value = JSON.stringify(window.dreamscapeState);
    }
  }
  
  // Touch event handlers
  function handleTouchStart(e) {
    e.preventDefault();
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      canvas.dispatchEvent(mouseEvent);
    }
  }
  
  function handleTouchMove(e) {
    e.preventDefault();
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      canvas.dispatchEvent(mouseEvent);
    }
  }
  
  function handleTouchEnd(e) {
    const mouseEvent = new MouseEvent('mouseup', {});
    canvas.dispatchEvent(mouseEvent);
  }
  
  // Utility function to shade a color
  function shadeColor(color, percent) {
    let R = parseInt(color.substring(1, 3), 16);
    let G = parseInt(color.substring(3, 5), 16);
    let B = parseInt(color.substring(5, 7), 16);

    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);

    R = (R < 255) ? R : 255;
    G = (G < 255) ? G : 255;
    B = (B < 255) ? B : 255;

    const RR = ((R.toString(16).length === 1) ? '0' + R.toString(16) : R.toString(16));
    const GG = ((G.toString(16).length === 1) ? '0' + G.toString(16) : G.toString(16));
    const BB = ((B.toString(16).length === 1) ? '0' + B.toString(16) : B.toString(16));

    return '#' + RR + GG + BB;
  }
  
  // Start animation loop
  function animate() {
    drawDreamscape(window.dreamscapeState);
    requestAnimationFrame(animate);
  }
  
  animate();
});
