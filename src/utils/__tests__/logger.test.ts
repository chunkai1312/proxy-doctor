import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { Logger } from '../logger.js';
import type { ProxyConfig, TestResult } from '../../types/index.js';

describe('Logger', () => {
  let consoleSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('verbose mode', () => {
    it('should print debug messages when verbose is enabled', () => {
      const logger = new Logger({ verbose: true });
      logger.debug('test message');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should not print debug messages when verbose is disabled', () => {
      const logger = new Logger({ verbose: false });
      logger.debug('test message');
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('json mode', () => {
    it('should not print non-JSON output in JSON mode', () => {
      const logger = new Logger({ json: true });
      logger.header();
      logger.printConfig({ noProxy: [] });
      logger.warn('warning');
      logger.error('error');
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should print JSON in JSON mode', () => {
      const logger = new Logger({ json: true });
      const summary = {
        config: { noProxy: [] },
        results: [],
        allPassed: true,
        timestamp: new Date().toISOString(),
      };
      logger.printJson(summary);
      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls[0][0];
      expect(() => JSON.parse(output)).not.toThrow();
    });
  });

  describe('printConfig', () => {
    it('should print proxy configuration', () => {
      const logger = new Logger();
      const config: ProxyConfig = {
        http: 'http://proxy:8080',
        https: 'http://proxy:8443',
        noProxy: ['localhost'],
      };
      logger.printConfig(config);
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should mask credentials in proxy URL', () => {
      const logger = new Logger();
      const config: ProxyConfig = {
        http: 'http://user:secret@proxy:8080',
        noProxy: [],
      };
      logger.printConfig(config);
      const output = consoleSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('****');
      expect(output).not.toContain('secret');
    });
  });

  describe('printResult', () => {
    it('should print successful result', () => {
      const logger = new Logger();
      const result: TestResult = {
        success: true,
        proxyType: 'http',
        proxyUrl: 'http://proxy:8080',
        targetUrl: 'http://example.com',
        responseTime: 100,
        statusCode: 200,
      };
      logger.printResult(result);
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should print failed result with error', () => {
      const logger = new Logger();
      const result: TestResult = {
        success: false,
        proxyType: 'http',
        proxyUrl: 'http://proxy:8080',
        targetUrl: 'http://example.com',
        responseTime: 10,
        error: 'Connection refused',
        errorCode: 'ECONNREFUSED',
      };
      logger.printResult(result);
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('printSummary', () => {
    it('should print success summary for all passing tests', () => {
      const logger = new Logger();
      const results: TestResult[] = [
        {
          success: true,
          proxyType: 'http',
          proxyUrl: 'http://proxy:8080',
          targetUrl: 'http://example.com',
          responseTime: 100,
          statusCode: 200,
        },
      ];
      logger.printSummary(results);
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should print failure summary for failing tests', () => {
      const logger = new Logger();
      const results: TestResult[] = [
        {
          success: false,
          proxyType: 'http',
          proxyUrl: 'http://proxy:8080',
          targetUrl: 'http://example.com',
          responseTime: 10,
          error: 'Failed',
        },
      ];
      logger.printSummary(results);
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should handle empty results', () => {
      const logger = new Logger();
      logger.printSummary([]);
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('spinner', () => {
    it('should create a spinner in normal mode', () => {
      const logger = new Logger();
      const spinner = logger.spinner('Testing...');
      expect(spinner).toBeDefined();
      expect(spinner.start).toBeDefined();
      expect(spinner.stop).toBeDefined();
    });

    it('should create a dummy spinner in JSON mode', () => {
      const logger = new Logger({ json: true });
      const spinner = logger.spinner('Testing...');
      expect(spinner).toBeDefined();
      spinner.start();
      spinner.stop();
      // Should not throw
    });
  });
});
