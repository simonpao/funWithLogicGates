// Classes are loaded in setup.js

describe('Logger', () => {

  beforeEach(() => {
    // Clear console mocks
    console.log = jest.fn();
    console.debug = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  });

  describe('log levels', () => {
    test('should have DEBUG level', () => {
      expect(Logger.logLvl.DEBUG).toBeDefined();
    });

    test('should have INFO level', () => {
      expect(Logger.logLvl.INFO).toBeDefined();
    });

    test('should have WARN level', () => {
      expect(Logger.logLvl.WARN).toBeDefined();
    });

    test('should have ERROR level', () => {
      expect(Logger.logLvl.ERROR).toBeDefined();
    });
  });

  describe('constructor', () => {
    test('should create logger with log level', () => {
      const logger = new Logger(Logger.logLvl.INFO);
      expect(logger.level).toBe(Logger.logLvl.INFO);
    });

    test('should create logger with log level and context', () => {
      const logger = new Logger(Logger.logLvl.DEBUG, 'TestClass');
      expect(logger.level).toBe(Logger.logLvl.DEBUG);
      expect(logger.label).toBe('TestClass');
    });
  });

  describe('debug logging', () => {
    test('should log debug messages when level is DEBUG', () => {
      const logger = new Logger(Logger.logLvl.DEBUG, 'Test');
      logger.debug('test message', { data: 'value' });
      
      expect(console.log).toHaveBeenCalled();
    });

    test('should not log debug messages when level is INFO or higher', () => {
      const logger = new Logger(Logger.logLvl.INFO, 'Test');
      logger.debug('test message');
      
      expect(console.log).not.toHaveBeenCalled();
    });
  });

  describe('info logging', () => {
    test('should log info messages when level is INFO or lower', () => {
      const logger = new Logger(Logger.logLvl.INFO, 'Test');
      logger.info('test message', { data: 'value' });
      
      expect(console.log).toHaveBeenCalled();
    });

    test('should not log info messages when level is WARN or higher', () => {
      const logger = new Logger(Logger.logLvl.WARN, 'Test');
      logger.info('test message');
      
      expect(console.log).not.toHaveBeenCalled();
    });
  });

  describe('warn logging', () => {
    test('should log warn messages when level is WARN or lower', () => {
      const logger = new Logger(Logger.logLvl.WARN, 'Test');
      logger.warn('test message', { data: 'value' });
      
      expect(console.log).toHaveBeenCalled();
    });

    test('should not log warn messages when level is ERROR', () => {
      const logger = new Logger(Logger.logLvl.ERROR, 'Test');
      logger.warn('test message');
      
      expect(console.log).not.toHaveBeenCalled();
    });
  });

  describe('error logging', () => {
    test('should always log error messages', () => {
      const logger = new Logger(Logger.logLvl.ERROR, 'Test');
      logger.error('test error', { error: 'details' });
      
      expect(console.error).toHaveBeenCalled();
    });

    test('should log errors even at DEBUG level', () => {
      const logger = new Logger(Logger.logLvl.DEBUG, 'Test');
      logger.error('test error');
      
      expect(console.error).toHaveBeenCalled();
    });
  });
});
