import { describe, it, expect, jest } from '@jest/globals';
import { diagnoseError } from '../tester.js';
import type { TestResult } from '../../types/index.js';

describe('tester', () => {
  describe('diagnoseError', () => {
    it('should return null for successful tests', () => {
      const result: TestResult = {
        success: true,
        proxyType: 'http',
        proxyUrl: 'http://proxy:8080',
        targetUrl: 'http://example.com',
        responseTime: 100,
        statusCode: 200,
      };
      expect(diagnoseError(result)).toBeNull();
    });

    it('should diagnose ECONNREFUSED', () => {
      const result: TestResult = {
        success: false,
        proxyType: 'http',
        proxyUrl: 'http://proxy:8080',
        targetUrl: 'http://example.com',
        responseTime: 10,
        error: 'connect ECONNREFUSED 127.0.0.1:8080',
        errorCode: 'ECONNREFUSED',
      };
      const diagnostic = diagnoseError(result);
      expect(diagnostic).toBeDefined();
      expect(diagnostic?.issue).toBe('Proxy server connection refused');
      expect(diagnostic?.suggestion).toContain('proxy server is running');
    });

    it('should diagnose ETIMEDOUT', () => {
      const result: TestResult = {
        success: false,
        proxyType: 'http',
        proxyUrl: 'http://proxy:8080',
        targetUrl: 'http://example.com',
        responseTime: 10000,
        error: 'connect ETIMEDOUT',
        errorCode: 'ETIMEDOUT',
      };
      const diagnostic = diagnoseError(result);
      expect(diagnostic?.issue).toBe('Connection timed out');
      expect(diagnostic?.suggestion).toContain('unreachable');
    });

    it('should diagnose ENETUNREACH', () => {
      const result: TestResult = {
        success: false,
        proxyType: 'http',
        proxyUrl: 'http://proxy:8080',
        targetUrl: 'http://example.com',
        responseTime: 1000,
        error: 'connect ENETUNREACH',
        errorCode: 'ENETUNREACH',
      };
      const diagnostic = diagnoseError(result);
      expect(diagnostic?.issue).toBe('Connection timed out');
      expect(diagnostic?.suggestion).toContain('unreachable');
    });

    it('should diagnose ENOTFOUND', () => {
      const result: TestResult = {
        success: false,
        proxyType: 'http',
        proxyUrl: 'http://invalid-proxy:8080',
        targetUrl: 'http://example.com',
        responseTime: 50,
        error: 'getaddrinfo ENOTFOUND invalid-proxy',
        errorCode: 'ENOTFOUND',
      };
      const diagnostic = diagnoseError(result);
      expect(diagnostic?.issue).toBe('DNS resolution failed');
      expect(diagnostic?.suggestion).toContain('could not be resolved');
    });

    it('should diagnose abort errors', () => {
      const result: TestResult = {
        success: false,
        proxyType: 'http',
        proxyUrl: 'http://proxy:8080',
        targetUrl: 'http://example.com',
        responseTime: 10000,
        error: 'The operation was aborted',
        errorCode: 'ABORT_ERR',
      };
      const diagnostic = diagnoseError(result);
      expect(diagnostic?.issue).toBe('Request timed out');
      expect(diagnostic?.suggestion).toContain('increasing the timeout');
    });

    it('should diagnose proxy authentication required (407)', () => {
      const result: TestResult = {
        success: false,
        proxyType: 'http',
        proxyUrl: 'http://proxy:8080',
        targetUrl: 'http://example.com',
        responseTime: 100,
        statusCode: 407,
        error: 'Proxy Authentication Required',
      };
      const diagnostic = diagnoseError(result);
      expect(diagnostic?.issue).toBe('Proxy authentication required');
      expect(diagnostic?.suggestion).toContain('credentials');
    });

    it('should diagnose SSL certificate errors', () => {
      const result: TestResult = {
        success: false,
        proxyType: 'https',
        proxyUrl: 'http://proxy:8080',
        targetUrl: 'https://example.com',
        responseTime: 100,
        error: 'unable to get local issuer certificate',
        errorCode: 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
      };
      const diagnostic = diagnoseError(result);
      expect(diagnostic?.issue).toBe('SSL certificate verification failed');
      expect(diagnostic?.suggestion).toContain('self-signed certificate');
    });

    it('should diagnose cancelled requests', () => {
      const result: TestResult = {
        success: false,
        proxyType: 'http',
        proxyUrl: 'http://proxy:8080',
        targetUrl: 'http://example.com',
        responseTime: 50,
        error: 'Request was cancelled',
      };
      const diagnostic = diagnoseError(result);
      expect(diagnostic?.issue).toBe('Request was cancelled');
      expect(diagnostic?.suggestion).toContain('proxy may not support');
    });

    it('should provide generic diagnosis for unknown errors', () => {
      const result: TestResult = {
        success: false,
        proxyType: 'http',
        proxyUrl: 'http://proxy:8080',
        targetUrl: 'http://example.com',
        responseTime: 100,
        error: 'Unknown error',
      };
      const diagnostic = diagnoseError(result);
      expect(diagnostic?.issue).toBe('Proxy connection failed');
      expect(diagnostic?.suggestion).toContain('Check the proxy URL');
    });
  });
});
