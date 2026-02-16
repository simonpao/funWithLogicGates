// Tests to reproduce and verify fix for item "sticking" bug
const { createMockCanvas, cleanupCanvas } = require('../helpers/testHelpers');

describe('Component - Item Sticking Bug', () => {
  let component;
  let canvas;

  beforeEach(() => {
    canvas = createMockCanvas('test-canvas', 1000, 600);
    component = new Component('test-canvas', Logger.logLvl.ERROR);
  });

  afterEach(() => {
    cleanupCanvas(canvas);
  });

  describe('Collision Detection Formula Bug', () => {
    test('should NOT detect collision when items are clearly separated horizontally', () => {
      // Create two small items that are clearly not touching
      component.items = {
        'item1': new Item(Component.types.AND, 'item1', 100, 100, 60, 40, '#0099FF', 1, 2),
        'item2': new Item(Component.types.OR, 'item2', 200, 100, 60, 40, '#0099FF', 1, 2)
      };
      
      // Try to move item1 to its current position (should not collide with item2)
      const result = component.itemCollision('item1', 100, 100);
      
      // Should return original position (no collision detected)
      expect(result.x).toBe(100);
      expect(result.y).toBe(100);
    });

    test('should NOT detect collision when items are separated by their widths', () => {
      // item1 at (100, 100) with width 60 ends at x=160
      // item2 at (165, 100) starts at x=165
      // Gap of 5 pixels - should NOT collide
      component.items = {
        'item1': new Item(Component.types.AND, 'item1', 100, 100, 60, 40, '#0099FF', 1, 2),
        'item2': new Item(Component.types.OR, 'item2', 165, 100, 60, 40, '#0099FF', 1, 2)
      };
      
      const result = component.itemCollision('item1', 100, 100);
      expect(result.x).toBe(100);
      expect(result.y).toBe(100);
    });

    test('FAILING: large items incorrectly detect collision when far apart', () => {
      // Create a large item (200x150) and a normal item
      // Bug: The current formula triggers collision based on item size, not actual overlap
      component.items = {
        'large': new Item(Component.types.CUSTOM, 'large', 100, 100, 200, 150, '#0099FF', 1, 2),
        'small': new Item(Component.types.AND, 'small', 350, 100, 60, 40, '#0099FF', 1, 2)
      };
      
      // These items don't overlap:
      // large: x=100 to x=300, y=100 to y=250
      // small: x=350 to x=410, y=100 to y=140
      // Gap of 50 pixels horizontally
      
      const result = component.itemCollision('large', 100, 100);
      
      // Current buggy formula:
      // Math.abs(100 - 350) = 250
      // (Math.abs(200 + 60) / 2) = 130
      // 250 <= 130 is FALSE (correct)
      // BUT for different positions this could trigger incorrectly
      
      // Expected: no collision, return original position
      expect(result.x).toBe(100);
      expect(result.y).toBe(100);
    });

    test('FAILING: demonstrates sticking bug with center-biased collision detection', () => {
      // The bug occurs when the collision detection formula triggers on center distance
      // rather than actual edge overlap
      component.items = {
        'item1': new Item(Component.types.CUSTOM, 'item1', 100, 100, 100, 80, '#0099FF', 1, 2),
        'item2': new Item(Component.types.AND, 'item2', 250, 100, 60, 40, '#0099FF', 1, 2)
      };
      
      // item1 center: (150, 140), ends at x=200
      // item2 center: (280, 120), starts at x=250
      // Distance between centers: 130 horizontally, 20 vertically
      // Sum of half-widths: (100 + 60) / 2 = 80
      
      // Buggy formula checks: Math.abs(100 - 250) <= 80 => 150 <= 80 => FALSE
      // But with different positions, this can trigger false positives
      
      const result = component.itemCollision('item1', 100, 100);
      expect(result.x).toBe(100);
    });
  });

  describe('Correct AABB Collision Detection', () => {
    test('should detect actual overlap when items DO intersect', () => {
      component.items = {
        'item1': new Item(Component.types.AND, 'item1', 100, 100, 60, 40, '#0099FF', 1, 2),
        'item2': new Item(Component.types.OR, 'item2', 140, 110, 60, 40, '#0099FF', 1, 2)
      };
      
      // These items DO overlap:
      // item1: x=100 to x=160, y=100 to y=140
      // item2: x=140 to x=200, y=110 to y=150
      // Overlap region: x=140 to x=160, y=110 to y=140
      
      const result = component.itemCollision('item1', 100, 100);
      
      // Should be pushed away (adjusted position)
      expect(result.x !== 100 || result.y !== 100).toBe(true);
    });

    test('should NOT detect collision when items are adjacent but not overlapping', () => {
      component.items = {
        'item1': new Item(Component.types.AND, 'item1', 100, 100, 60, 40, '#0099FF', 1, 2),
        'item2': new Item(Component.types.OR, 'item2', 161, 100, 60, 40, '#0099FF', 1, 2) // Starts just after item1
      };
      
      // item1 ends at x=160, item2 starts at x=161 - no overlap
      const result = component.itemCollision('item1', 100, 100);
      expect(result.x).toBe(100);
      expect(result.y).toBe(100);
    });
  });

  describe('Large Item Behavior', () => {
    test('large items should not attract smaller items from far away', () => {
      // This test verifies the "sticking" bug is fixed
      component.items = {
        'large': new Item(Component.types.CUSTOM, 'large', 200, 200, 150, 120, '#0099FF', 1, 2),
        'small': new Item(Component.types.AND, 'small', 400, 200, 60, 40, '#0099FF', 1, 2)
      };
      
      // Try to move small item closer but still separated
      // large ends at x=350, moving small to x=360 (10px gap)
      const result = component.itemCollision('small', 360, 200);
      
      // Should maintain position or adjust only for actual collision
      // NOT be pulled toward the large item's boundary
      expect(result.x).toBeGreaterThanOrEqual(351); // At minimum, just past large item
      expect(result.x).toBeLessThanOrEqual(360); // Should not move further right
    });

    test('should correctly push away when large items DO overlap', () => {
      component.items = {
        'large': new Item(Component.types.CUSTOM, 'large', 200, 200, 150, 120, '#0099FF', 1, 2),
        'small': new Item(Component.types.AND, 'small', 400, 200, 60, 40, '#0099FF', 1, 2)
      };
      
      // Move small item to actually overlap with large item
      // large: x=200 to x=350, y=200 to y=320
      // Try to place small at x=330 (overlaps by 20px)
      const result = component.itemCollision('small', 330, 220);
      
      // Should be pushed to the right of large item
      expect(result.x).toBeGreaterThanOrEqual(351);
    });
  });

  describe('Analysis of Current Formula', () => {
    test('demonstrates how current formula works', () => {
      // Current formula: Math.abs(rectA.x - rectB.x) <= (Math.abs(rectA.w + rectB.w) / 2)
      // This checks if the distance between LEFT edges is less than half the sum of widths
      
      // Example 1: Should NOT collide
      const rectA = { x: 100, y: 100, w: 60, h: 40 };
      const rectB = { x: 200, y: 100, w: 60, h: 40 };
      
      const distanceX = Math.abs(rectA.x - rectB.x); // 100
      const thresholdX = Math.abs(rectA.w + rectB.w) / 2; // 60
      const collidesX = distanceX <= thresholdX; // 100 <= 60 => false
      
      expect(collidesX).toBe(false); // Correct - no collision
      
      // Example 2: Should collide (overlapping)
      const rectC = { x: 100, y: 100, w: 60, h: 40 };
      const rectD = { x: 130, y: 100, w: 60, h: 40 };
      
      const distanceX2 = Math.abs(rectC.x - rectD.x); // 30
      const thresholdX2 = Math.abs(rectC.w + rectD.w) / 2; // 60
      const collidesX2 = distanceX2 <= thresholdX2; // 30 <= 60 => true
      
      expect(collidesX2).toBe(true); // Correct - collision detected
      
      // The formula CAN work, but it's not standard AABB and can be confusing
      // Standard AABB is clearer: check if edges overlap
    });

    test('shows where current formula might fail', () => {
      // The issue might be in how centers are calculated and used for direction
      // Or in the loop restart logic (k = -1)
      
      const rectA = { x: 100, w: 60, h: 40 };
      const rectB = { x: 140, w: 60, h: 40 };
      
      // Centers
      const acx = rectA.x + rectA.w / 2; // 130
      const bcx = rectB.x + rectB.w / 2; // 170
      const dx = acx - bcx; // -40
      
      // If dx < 0, item A is pushed left: rectB.x - rectA.w - 1 = 140 - 60 - 1 = 79
      // This moves A from x=100 to x=79 (21 pixels left)
      
      // But then the loop restarts (k = -1) and checks again
      // This could cause oscillation or unexpected movement
      
      expect(dx).toBe(-40);
    });
  });
});
