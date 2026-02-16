// Classes are loaded in setup.js

describe('Coordinates', () => {
  describe('orientation constants', () => {
    test('should have LANDSCAPE orientation constant', () => {
      expect(Coordinates.orientation.LANDSCAPE).toBeDefined();
      expect(typeof Coordinates.orientation.LANDSCAPE).toBe('number');
    });

    test('should have PORTRAIT orientation constant', () => {
      expect(Coordinates.orientation.PORTRAIT).toBeDefined();
      expect(typeof Coordinates.orientation.PORTRAIT).toBe('number');
    });

    test('should have different values for LANDSCAPE and PORTRAIT', () => {
      expect(Coordinates.orientation.LANDSCAPE).not.toBe(Coordinates.orientation.PORTRAIT);
    });
  });

  describe('static methods', () => {
    test('should have getCoordinates static method', () => {
      expect(typeof Coordinates.getCoordinates).toBe('function');
    });

    test('should have getCanvasOffset static method', () => {
      expect(typeof Coordinates.getCanvasOffset).toBe('function');
    });

    test('should have getDocumentOffset static method', () => {
      expect(typeof Coordinates.getDocumentOffset).toBe('function');
    });
  });
});
