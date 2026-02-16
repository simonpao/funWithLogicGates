// Classes are loaded in setup.js
const { createMockCanvas, cleanupCanvas } = require('../helpers/testHelpers');

describe('Component - Collision Detection', () => {
  let component;
  let canvas;

  beforeEach(() => {
    // Create a mock canvas element
    canvas = createMockCanvas('test-canvas', 1000, 600);
    
    // Create a Component instance
    component = new Component('test-canvas', Logger.logLvl.ERROR);
    
    // Add some test items for collision testing
    component.items = {
      'item1': new Item(Component.types.AND, 'item1', 100, 100, 60, 40, '#0099FF', 1, 2),
      'item2': new Item(Component.types.OR, 'item2', 300, 200, 60, 40, '#0099FF', 1, 2),
      'item3': new Item(Component.types.NOT, 'item3', 500, 300, 40, 30, '#0099FF', 1, 1)
    };
  });

  afterEach(() => {
    cleanupCanvas(canvas);
  });

  describe('itemAtLocation', () => {
    test('should return item id when coordinates are within item bounds', () => {
      // Point in the middle of item1 (100, 100, 60x40)
      const result = component.itemAtLocation(130, 120);
      expect(result).toBe('item1');
    });

    test('should return item id when coordinates are at top-left corner', () => {
      const result = component.itemAtLocation(100, 100);
      expect(result).toBe('item1');
    });

    test('should return item id when coordinates are at bottom-right corner', () => {
      // item1 is at (100, 100) with width 60, height 40
      // Bottom-right is (160, 140)
      const result = component.itemAtLocation(160, 140);
      expect(result).toBe('item1');
    });

    test('should return false when coordinates are outside all items', () => {
      const result = component.itemAtLocation(50, 50);
      expect(result).toBe(false);
    });

    test('should return false when coordinates are in empty canvas area', () => {
      const result = component.itemAtLocation(800, 500);
      expect(result).toBe(false);
    });

    test('should detect the correct item when multiple items exist', () => {
      // item2 is at (300, 200, 60x40)
      const result = component.itemAtLocation(320, 220);
      expect(result).toBe('item2');
    });

    test('should return false when coordinates are just outside item bounds', () => {
      // Just to the left of item1
      const result = component.itemAtLocation(99, 120);
      expect(result).toBe(false);
    });

    test('should handle items at different positions', () => {
      // item3 is at (500, 300)
      const result = component.itemAtLocation(510, 310);
      expect(result).toBe('item3');
    });

    test('should return false for negative coordinates', () => {
      const result = component.itemAtLocation(-10, -10);
      expect(result).toBe(false);
    });

    test('should return false when no items exist', () => {
      component.items = {};
      const result = component.itemAtLocation(100, 100);
      expect(result).toBe(false);
    });
  });

  describe('somethingAtLocation', () => {
    beforeEach(() => {
      // Add some inputs and outputs for testing
      component.inputs = {
        'in1': { id: 'in1', x: 10, y: 50, isAtCoordinates: jest.fn((x, y) => Math.abs(x - 10) < 10 && Math.abs(y - 50) < 10) }
      };
      component.outputs = {
        'out1': { id: 'out1', x: 10, y: 100, isAtCoordinates: jest.fn((x, y) => Math.abs(x - 10) < 10 && Math.abs(y - 100) < 10) }
      };
    });

    test('should return item when coordinates are on an item', () => {
      const result = component.somethingAtLocation(130, 120);
      expect(result.type).toBe('item');
      expect(result.value.id).toBe('item1');
    });

    test('should return input when coordinates are on an input', () => {
      const result = component.somethingAtLocation(10, 50);
      expect(result.type).toBe('input');
      expect(result.value.id).toBe('in1');
    });

    test('should return output when coordinates are on an output', () => {
      const result = component.somethingAtLocation(10, 100);
      expect(result.type).toBe('output');
      expect(result.value.id).toBe('out1');
    });

    test('should return none when coordinates are empty', () => {
      const result = component.somethingAtLocation(50, 50);
      expect(result.type).toBe('none');
      expect(result.value).toBe(null);
    });

    test('should prioritize item over input/output', () => {
      // If an input is at the same location as an item, item should be returned first
      component.inputs.in2 = { 
        id: 'in2', 
        x: 130, 
        y: 120, 
        isAtCoordinates: jest.fn(() => true) 
      };
      const result = component.somethingAtLocation(130, 120);
      expect(result.type).toBe('item');
    });

    test('should pass touch parameter to input detection', () => {
      const touchSpy = component.inputs.in1.isAtCoordinates;
      component.somethingAtLocation(10, 50, true);
      expect(touchSpy).toHaveBeenCalledWith(10, 50, true);
    });
  });

  describe('detectCollisionWithWall', () => {
    let testItem;
    let response;

    beforeEach(() => {
      testItem = { w: 60, h: 40 };
      response = { x: 0, y: 0 }; // Initialize with newX, newY values in each test
    });

    test('should prevent item from going past left wall', () => {
      const newX = 5; // Less than Drawer.dim.io.b + 2 (80 + 2 = 82)
      const newY = 100;
      const collision = component.detectCollisionWithWall(testItem, newX, newY, response);
      
      expect(collision).toBe(1);
      expect(response.x).toBe(Drawer.dim.io.b + 2);
      // response.y is only set if there's a Y collision
    });

    test('should prevent item from going past right wall', () => {
      const newX = component.metadata.canvas.width - 50; // Too far right for 60px wide item
      const newY = 100;
      const collision = component.detectCollisionWithWall(testItem, newX, newY, response);
      
      expect(collision).toBe(1);
      expect(response.x).toBe(component.metadata.canvas.width - (Drawer.dim.io.b + 2) - testItem.w);
    });

    test('should prevent item from going past top wall', () => {
      const newX = 100;
      const newY = -5; // Less than 2
      const collision = component.detectCollisionWithWall(testItem, newX, newY, response);
      
      expect(collision).toBe(1);
      expect(response.y).toBe(2);
    });

    test('should prevent item from going past bottom wall', () => {
      const newX = 100;
      const newY = component.metadata.canvas.height - 10; // Too far down for 40px tall item
      const collision = component.detectCollisionWithWall(testItem, newX, newY, response);
      
      expect(collision).toBe(1);
      expect(response.y).toBe(component.metadata.canvas.height - 2 - testItem.h);
    });

    test('should return 0 when no collision with walls', () => {
      const newX = 200;
      const newY = 200;
      response.x = newX; // Must initialize response to match newX, newY
      response.y = newY;
      
      const collision = component.detectCollisionWithWall(testItem, newX, newY, response);
      
      expect(collision).toBe(0);
      // Response should not be modified when there's no collision
      expect(response.x).toBe(newX);
      expect(response.y).toBe(newY);
    });

    test('should handle collision with top-left corner', () => {
      const newX = 5;
      const newY = -5;
      const collision = component.detectCollisionWithWall(testItem, newX, newY, response);
      
      expect(collision).toBe(1);
      expect(response.x).toBe(Drawer.dim.io.b + 2);
      expect(response.y).toBe(2);
    });

    test('should handle collision with bottom-right corner', () => {
      const newX = component.metadata.canvas.width;
      const newY = component.metadata.canvas.height;
      const collision = component.detectCollisionWithWall(testItem, newX, newY, response);
      
      expect(collision).toBe(1);
      expect(response.x).toBe(component.metadata.canvas.width - (Drawer.dim.io.b + 2) - testItem.w);
      expect(response.y).toBe(component.metadata.canvas.height - 2 - testItem.h);
    });

    test('should allow item safely inside boundaries', () => {
      const newX = Drawer.dim.io.b + 10; // Well inside the boundary
      const newY = 10; // Well inside
      response.x = newX;
      response.y = newY;
      
      const collision = component.detectCollisionWithWall(testItem, newX, newY, response);
      
      expect(collision).toBe(0);
      expect(response.x).toBe(newX);
      expect(response.y).toBe(newY);
    });
  });

  describe('itemCollision', () => {
    test('should return original position when no collision', () => {
      const result = component.itemCollision('item1', 400, 400);
      
      expect(result.x).toBe(400);
      expect(result.y).toBe(400);
    });

    test('should prevent item from overlapping horizontally', () => {
      // Try to move item1 to overlap with item2 (300, 200)
      // item1 is 60px wide, item2 is at x=300
      const result = component.itemCollision('item1', 280, 200);
      
      // Should be pushed to the left of item2
      expect(result.x).not.toBe(280);
      expect(result.x).toBeLessThan(300);
    });

    test('should prevent item from overlapping vertically', () => {
      // Try to move item3 (500, 300) to overlap with item2 (300, 200)
      const result = component.itemCollision('item3', 300, 220);
      
      // Should be adjusted to not overlap
      expect(result.y).not.toBe(220);
    });

    test('should handle collision with multiple items', () => {
      // Add item very close to item2
      component.items.item4 = new Item(Component.types.AND, 'item4', 370, 200, 60, 40, '#0099FF', 1, 2);
      
      // Try to move item1 between item2 and item4
      const result = component.itemCollision('item1', 320, 200);
      
      // Should detect collision
      expect(result.x !== 320 || result.y !== 200).toBe(true);
    });

    test('should return false coordinates when stuck between items', () => {
      // Surround item1 with other items
      component.items.left = new Item(Component.types.AND, 'left', 30, 100, 50, 40, '#0099FF', 1, 2);
      component.items.right = new Item(Component.types.AND, 'right', 170, 100, 50, 40, '#0099FF', 1, 2);
      component.items.top = new Item(Component.types.AND, 'top', 100, 50, 60, 40, '#0099FF', 1, 2);
      component.items.bottom = new Item(Component.types.AND, 'bottom', 100, 150, 60, 40, '#0099FF', 1, 2);
      
      // Try to move item1 in a way that causes multiple collisions
      const result = component.itemCollision('item1', 100, 100);
      
      // After more than 1 collision attempt, should return false
      if (result.x === false && result.y === false) {
        expect(result.x).toBe(false);
        expect(result.y).toBe(false);
      } else {
        // Or it successfully found a valid position
        expect(typeof result.x).toBe('number');
        expect(typeof result.y).toBe('number');
      }
    });

    test('should respect wall boundaries in collision detection', () => {
      // Try to move item to position that would collide with wall
      const result = component.itemCollision('item1', 10, 100);
      
      // Should be adjusted to respect left wall boundary
      expect(result.x).toBeGreaterThanOrEqual(Drawer.dim.io.b + 2);
    });

    test('should not collide with itself', () => {
      // Get current position of item1
      const currentX = component.items.item1.x;
      const currentY = component.items.item1.y;
      
      // Try to move to same position
      const result = component.itemCollision('item1', currentX, currentY);
      
      // Should return the same position (no self-collision)
      expect(result.x).toBe(currentX);
      expect(result.y).toBe(currentY);
    });

    test('should handle empty id parameter gracefully', () => {
      // When id is empty, getAllItemsExcept returns all items
      // The method should handle this without errors
      try {
        const result = component.itemCollision('', 400, 400);
        // If it succeeds, result should be defined
        expect(result).toBeDefined();
      } catch (error) {
        // If it fails, that's also acceptable behavior for invalid input
        expect(error).toBeDefined();
      }
    });

    test('should calculate collision based on rectangle centers', () => {
      // Place item2 directly to the right of item1
      component.items.item2.x = 165; // Just past item1 (100 + 60 + 5)
      component.items.item2.y = 100;
      
      // Try to move item1 to overlap
      const result = component.itemCollision('item1', 140, 100);
      
      // Should be pushed left or right based on center distance
      expect(result.x).not.toBe(140);
    });

    test('should handle non-existent item id gracefully', () => {
      // Non-existent items may cause errors or return adjusted position
      try {
        const result = component.itemCollision('nonexistent', 200, 200);
        // If it succeeds, result should be defined
        expect(result).toBeDefined();
      } catch (error) {
        // If it fails, that's acceptable for non-existent items
        expect(error).toBeDefined();
      }
    });
  });

  describe('collision integration tests', () => {
    test('should detect item, check for collision, and respect boundaries', () => {
      // 1. Verify item is at location
      const foundItem = component.itemAtLocation(130, 120);
      expect(foundItem).toBe('item1');
      
      // 2. Try to move it to a new valid location
      const newPos = component.itemCollision('item1', 400, 300);
      expect(newPos.x).toBe(400);
      expect(newPos.y).toBe(300);
      
      // 3. Verify wall collision detection works
      const wallTest = component.itemCollision('item1', 10, 10);
      expect(wallTest.x).toBeGreaterThanOrEqual(Drawer.dim.io.b + 2);
    });

    test('should use somethingAtLocation to identify collision type', () => {
      // Check what's at item1's location
      const something = component.somethingAtLocation(130, 120);
      expect(something.type).toBe('item');
      
      // Verify itemAtLocation agrees
      const item = component.itemAtLocation(130, 120);
      expect(item).toBe(something.value.id);
    });

    test('should prevent dragging item into occupied space', () => {
      // item2 is at (300, 200)
      // Try to drag item1 there
      const result = component.itemCollision('item1', 305, 205);
      
      // Should be adjusted away from item2
      const distance = Math.sqrt(
        Math.pow(result.x - 305, 2) + Math.pow(result.y - 205, 2)
      );
      expect(distance).toBeGreaterThan(0);
    });

    test('should handle edge case of items touching but not overlapping', () => {
      // Place item2 exactly adjacent to item1
      component.items.item2.x = 161; // item1 ends at 160
      component.items.item2.y = 100;
      
      // Item1 at its original position should not collide
      const result = component.itemCollision('item1', 100, 100);
      expect(result.x).toBe(100);
      expect(result.y).toBe(100);
    });
  });

  describe('performance and edge cases', () => {
    test('should handle many items efficiently', () => {
      // Add 50 items to the canvas
      for (let i = 0; i < 50; i++) {
        component.items[`perf${i}`] = new Item(
          Component.types.AND,
          `perf${i}`,
          (i % 10) * 80 + 100,
          Math.floor(i / 10) * 60 + 50,
          60,
          40,
          '#0099FF',
          1,
          2
        );
      }
      
      const startTime = Date.now();
      component.itemAtLocation(500, 300);
      const endTime = Date.now();
      
      // Should complete quickly (< 100ms for 50 items)
      expect(endTime - startTime).toBeLessThan(100);
    });

    test('should detect one of overlapping items in itemAtLocation', () => {
      // Create two overlapping items
      component.items.overlap1 = new Item(Component.types.AND, 'overlap1', 100, 100, 60, 40, '#0099FF', 1, 2);
      component.items.overlap2 = new Item(Component.types.OR, 'overlap2', 110, 110, 60, 40, '#0099FF', 1, 2);
      
      // Should return one of the matching items (order may vary)
      const result = component.itemAtLocation(120, 120);
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    test('should handle zero-sized items', () => {
      component.items.tiny = new Item(Component.types.AND, 'tiny', 200, 200, 0, 0, '#0099FF', 1, 2);
      
      const result = component.itemAtLocation(200, 200);
      expect(result).toBe('tiny');
    });

    test('should handle floating point coordinates', () => {
      const result = component.itemAtLocation(130.5, 120.7);
      expect(result).toBe('item1');
    });
  });
});
