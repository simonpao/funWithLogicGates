// Test file to verify the collision detection fix
// This should be run AFTER fixing the itemCollision method

const { createMockCanvas, cleanupCanvas } = require('../helpers/testHelpers');

describe('Component - Collision Detection Fix Verification', () => {
  let component;
  let canvas;

  beforeEach(() => {
    canvas = createMockCanvas('test-canvas', 1000, 600);
    component = new Component('test-canvas', Logger.logLvl.ERROR);
  });

  afterEach(() => {
    cleanupCanvas(canvas);
  });

  describe('Fixed AABB Collision Detection', () => {
    test('should detect overlap when items actually intersect', () => {
      component.items = {
        'large': new Item(Component.types.CUSTOM, 'large', 200, 200, 150, 120, '#0099FF', 1, 2),
        'small': new Item(Component.types.AND, 'small', 400, 220, 60, 40, '#0099FF', 1, 2)
      };
      
      // Moving small to x=330 creates overlap:
      // large: x=200 to x=350
      // small at x=330: x=330 to x=390
      // Overlap: x=330 to x=350 (20px overlap)
      const result = component.itemCollision('small', 330, 220);
      
      // Should be pushed to the right of large item
      expect(result.x).toBeGreaterThanOrEqual(351);
    });

    test('should NOT detect collision when items are clearly separated', () => {
      component.items = {
        'item1': new Item(Component.types.AND, 'item1', 100, 100, 60, 40, '#0099FF', 1, 2),
        'item2': new Item(Component.types.OR, 'item2', 200, 100, 60, 40, '#0099FF', 1, 2)
      };
      
      // item1 ends at x=160, item2 starts at x=200
      // 40px gap - no collision
      const result = component.itemCollision('item1', 100, 100);
      expect(result.x).toBe(100);
      expect(result.y).toBe(100);
    });

    test('should handle touching but not overlapping items', () => {
      component.items = {
        'item1': new Item(Component.types.AND, 'item1', 100, 100, 60, 40, '#0099FF', 1, 2),
        'item2': new Item(Component.types.OR, 'item2', 160, 100, 60, 40, '#0099FF', 1, 2)
      };
      
      // item1 ends at x=160, item2 starts at x=160
      // Touching edges but no overlap
      const result = component.itemCollision('item1', 100, 100);
      expect(result.x).toBe(100);
      expect(result.y).toBe(100);
    });

    test('should correctly resolve diagonal overlaps', () => {
      component.items = {
        'item1': new Item(Component.types.AND, 'item1', 100, 100, 80, 60, '#0099FF', 1, 2),
        'item2': new Item(Component.types.OR, 'item2', 150, 120, 80, 60, '#0099FF', 1, 2)
      };
      
      // These overlap diagonally
      // item1: x=100-180, y=100-160
      // item2: x=150-230, y=120-180
      // Overlap: x=150-180, y=120-160
      
      const result = component.itemCollision('item1', 100, 100);
      
      // Should be pushed in the direction of least overlap
      expect(result.x !== 100 || result.y !== 100).toBe(true);
    });

    test('large items should not cause false positive collisions', () => {
      component.items = {
        'huge': new Item(Component.types.CUSTOM, 'huge', 100, 100, 300, 200, '#0099FF', 1, 2),
        'tiny': new Item(Component.types.AND, 'tiny', 450, 150, 40, 30, '#0099FF', 1, 2)
      };
      
      // huge: x=100-400, y=100-300
      // tiny: x=450-490, y=150-180
      // 50px gap - no collision
      
      const result = component.itemCollision('tiny', 450, 150);
      expect(result.x).toBe(450);
      expect(result.y).toBe(150);
    });
  });

  describe('Sticking Bug Resolution', () => {
    test('items should not be pulled toward each other', () => {
      component.items = {
        'item1': new Item(Component.types.CUSTOM, 'item1', 100, 100, 100, 80, '#0099FF', 1, 2),
        'item2': new Item(Component.types.AND, 'item2', 250, 100, 60, 40, '#0099FF', 1, 2)
      };
      
      // item1 ends at x=200
      // Try to move item2 closer but not overlapping (to x=210)
      const result = component.itemCollision('item2', 210, 100);
      
      // Should stay at or near 210, NOT be pulled to 201 (item1's boundary)
      expect(result.x).toBeGreaterThanOrEqual(210);
      expect(result.x).toBeLessThanOrEqual(250); // And not pushed away unnecessarily
    });

    test('moving away from an item should not pull back toward it', () => {
      component.items = {
        'anchor': new Item(Component.types.AND, 'anchor', 200, 200, 60, 40, '#0099FF', 1, 2),
        'moving': new Item(Component.types.OR, 'moving', 300, 200, 60, 40, '#0099FF', 1, 2)
      };
      
      // Try to move 'moving' even further away
      const result = component.itemCollision('moving', 400, 200);
      
      // Should accept the new position, not pull back
      expect(result.x).toBe(400);
      expect(result.y).toBe(200);
    });

    test('very small movements near items should not trigger excessive adjustments', () => {
      component.items = {
        'static': new Item(Component.types.AND, 'static', 200, 200, 60, 40, '#0099FF', 1, 2),
        'moving': new Item(Component.types.OR, 'moving', 300, 200, 60, 40, '#0099FF', 1, 2)
      };
      
      // Move just 5 pixels closer (still 35px gap)
      const result = component.itemCollision('moving', 295, 200);
      
      // Should maintain the position
      expect(result.x).toBe(295);
      expect(result.y).toBe(200);
    });
  });

  describe('Edge Cases', () => {
    test('should handle items with different aspect ratios', () => {
      component.items = {
        'wide': new Item(Component.types.CUSTOM, 'wide', 100, 100, 200, 40, '#0099FF', 1, 2),
        'tall': new Item(Component.types.CUSTOM, 'tall', 150, 150, 40, 200, '#0099FF', 1, 2)
      };
      
      // wide: x=100-300, y=100-140
      // tall: x=150-190, y=150-350
      // No overlap in Y (wide ends at 140, tall starts at 150)
      
      const result = component.itemCollision('wide', 100, 100);
      expect(result.x).toBe(100);
      expect(result.y).toBe(100);
    });

    test('should correctly handle three items in a row', () => {
      component.items = {
        'left': new Item(Component.types.AND, 'left', 100, 200, 60, 40, '#0099FF', 1, 2),
        'middle': new Item(Component.types.OR, 'middle', 200, 200, 60, 40, '#0099FF', 1, 2),
        'right': new Item(Component.types.NOT, 'right', 300, 200, 40, 30, '#0099FF', 1, 1)
      };
      
      // All separated by 40px gaps
      const result = component.itemCollision('middle', 200, 200);
      expect(result.x).toBe(200);
      expect(result.y).toBe(200);
    });
  });
});
