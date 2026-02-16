/**
 * Test helper utilities
 */

/**
 * Create a mock canvas element for testing
 * @param {string} id - Canvas element ID
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @returns {HTMLCanvasElement} mock canvas element
 */
function createMockCanvas(id = 'test-canvas', width = 1000, height = 600) {
  const canvas = document.createElement('canvas');
  canvas.id = id;
  canvas.width = width;
  canvas.height = height;
  canvas.setAttribute('width', width.toString());
  canvas.setAttribute('height', height.toString());
  
  // Mock getContext
  canvas.getContext = jest.fn(() => ({
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: 'left',
    textBaseline: 'alphabetic',
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    strokeRect: jest.fn(),
    fillText: jest.fn(),
    strokeText: jest.fn(),
    measureText: jest.fn(() => ({ width: 0 })),
    beginPath: jest.fn(),
    closePath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    arc: jest.fn(),
    stroke: jest.fn(),
    fill: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    scale: jest.fn(),
    translate: jest.fn(),
    rotate: jest.fn(),
    setTransform: jest.fn(),
    drawImage: jest.fn()
  }));
  
  document.body.appendChild(canvas);
  
  // Create placeholder div (required by Component)
  const placeholder = document.createElement('div');
  placeholder.id = 'new-items-placeholder';
  document.body.appendChild(placeholder);
  
  return canvas;
}

/**
 * Clean up mock canvas and related elements
 * @param {HTMLCanvasElement} canvas - Canvas element to remove
 */
function cleanupCanvas(canvas) {
  if (canvas && canvas.parentNode) {
    canvas.parentNode.removeChild(canvas);
  }
  
  // Clean up placeholder
  const placeholder = document.getElementById('new-items-placeholder');
  if (placeholder && placeholder.parentNode) {
    placeholder.parentNode.removeChild(placeholder);
  }
  
  // Clean up any canvas container that Component might have created
  const container = document.getElementById('canvas-container--div');
  if (container && container.parentNode) {
    container.parentNode.removeChild(container);
  }
}

/**
 * Create a test item with default values
 * @param {Object} overrides - Properties to override defaults
 * @returns {Item} test item
 */
function createTestItem(overrides = {}) {
  const defaults = {
    type: Component.types.AND,
    id: 'test-item',
    x: 100,
    y: 100,
    w: 60,
    h: 40,
    color: '#0099FF',
    inputs: 1,
    outputs: 2
  };
  
  const props = { ...defaults, ...overrides };
  return new Item(
    props.type,
    props.id,
    props.x,
    props.y,
    props.w,
    props.h,
    props.color,
    props.inputs,
    props.outputs
  );
}

/**
 * Create a mock input/output object
 * @param {Object} config - Configuration
 * @returns {Object} mock IO object
 */
function createMockIO(config = {}) {
  return {
    id: config.id || 'io-1',
    x: config.x || 0,
    y: config.y || 0,
    state: config.state || 0,
    label: config.label || '',
    isAtCoordinates: jest.fn((x, y, touch) => {
      const radius = touch ? 20 : 10;
      return Math.abs(x - (config.x || 0)) < radius && 
             Math.abs(y - (config.y || 0)) < radius;
    })
  };
}

module.exports = {
  createMockCanvas,
  cleanupCanvas,
  createTestItem,
  createMockIO
};
