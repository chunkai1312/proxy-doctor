import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  detectProxyFromEnv,
  parseProxyUrl,
  isNoProxy,
  getEffectiveProxy,
  hasProxyConfigured,
} from '../detector.js';

describe('detector', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('detectProxyFromEnv', () => {
    it('should detect HTTP_PROXY', () => {
      process.env.HTTP_PROXY = 'http://proxy.example.com:8080';
      const config = detectProxyFromEnv();
      expect(config.http).toBe('http://proxy.example.com:8080');
      expect(config.https).toBeUndefined();
      expect(config.all).toBeUndefined();
    });

    it('should detect HTTPS_PROXY', () => {
      process.env.HTTPS_PROXY = 'http://proxy.example.com:8443';
      const config = detectProxyFromEnv();
      expect(config.https).toBe('http://proxy.example.com:8443');
      expect(config.http).toBeUndefined();
    });

    it('should detect ALL_PROXY', () => {
      process.env.ALL_PROXY = 'http://proxy.example.com:3128';
      const config = detectProxyFromEnv();
      expect(config.all).toBe('http://proxy.example.com:3128');
    });

    it('should prefer uppercase over lowercase', () => {
      process.env.http_proxy = 'http://lower.example.com:8080';
      process.env.HTTP_PROXY = 'http://upper.example.com:8080';
      const config = detectProxyFromEnv();
      expect(config.http).toBe('http://upper.example.com:8080');
    });

    it('should parse NO_PROXY', () => {
      process.env.NO_PROXY = 'localhost,.example.com,192.168.1.1';
      const config = detectProxyFromEnv();
      expect(config.noProxy).toEqual(['localhost', '.example.com', '192.168.1.1']);
    });

    it('should handle empty environment', () => {
      delete process.env.HTTP_PROXY;
      delete process.env.HTTPS_PROXY;
      delete process.env.ALL_PROXY;
      delete process.env.NO_PROXY;
      const config = detectProxyFromEnv();
      expect(config.http).toBeUndefined();
      expect(config.https).toBeUndefined();
      expect(config.all).toBeUndefined();
      expect(config.noProxy).toEqual([]);
    });
  });

  describe('parseProxyUrl', () => {
    it('should parse HTTP proxy URL', () => {
      const parsed = parseProxyUrl('http://proxy.example.com:8080');
      expect(parsed).toEqual({
        protocol: 'http',
        hostname: 'proxy.example.com',
        port: 8080,
        raw: 'http://proxy.example.com:8080',
      });
    });

    it('should parse HTTPS proxy URL', () => {
      const parsed = parseProxyUrl('https://proxy.example.com:8443');
      expect(parsed).toEqual({
        protocol: 'https',
        hostname: 'proxy.example.com',
        port: 8443,
        raw: 'https://proxy.example.com:8443',
      });
    });

    it('should parse proxy URL with credentials', () => {
      const parsed = parseProxyUrl('http://user:pass@proxy.example.com:8080');
      expect(parsed).toMatchObject({
        protocol: 'http',
        hostname: 'proxy.example.com',
        port: 8080,
        username: 'user',
        password: 'pass',
      });
    });

    it('should use default ports', () => {
      const httpParsed = parseProxyUrl('http://proxy.example.com');
      expect(httpParsed?.port).toBe(80);

      const httpsParsed = parseProxyUrl('https://proxy.example.com');
      expect(httpsParsed?.port).toBe(443);
    });

    it('should return null for invalid URL', () => {
      const parsed = parseProxyUrl('not-a-url');
      expect(parsed).toBeNull();
    });
  });

  describe('isNoProxy', () => {
    it('should match exact hostname', () => {
      expect(isNoProxy('localhost', ['localhost'])).toBe(true);
      expect(isNoProxy('example.com', ['example.com'])).toBe(true);
    });

    it('should match domain suffix with leading dot', () => {
      expect(isNoProxy('sub.example.com', ['.example.com'])).toBe(true);
      expect(isNoProxy('deep.sub.example.com', ['.example.com'])).toBe(true);
    });

    it('should match domain suffix without leading dot', () => {
      expect(isNoProxy('sub.example.com', ['example.com'])).toBe(true);
    });

    it('should not match unrelated domains', () => {
      expect(isNoProxy('other.com', ['example.com'])).toBe(false);
      expect(isNoProxy('notexample.com', ['example.com'])).toBe(false);
    });

    it('should handle empty patterns', () => {
      expect(isNoProxy('example.com', [])).toBe(false);
    });
  });

  describe('getEffectiveProxy', () => {
    it('should return HTTP proxy for HTTP URLs', () => {
      const config = {
        http: 'http://http-proxy:8080',
        https: 'http://https-proxy:8443',
        noProxy: [],
      };
      expect(getEffectiveProxy('http://example.com', config)).toBe(
        'http://http-proxy:8080'
      );
    });

    it('should return HTTPS proxy for HTTPS URLs', () => {
      const config = {
        http: 'http://http-proxy:8080',
        https: 'http://https-proxy:8443',
        noProxy: [],
      };
      expect(getEffectiveProxy('https://example.com', config)).toBe(
        'http://https-proxy:8443'
      );
    });

    it('should fall back to ALL_PROXY', () => {
      const config = {
        all: 'http://all-proxy:3128',
        noProxy: [],
      };
      expect(getEffectiveProxy('http://example.com', config)).toBe(
        'http://all-proxy:3128'
      );
      expect(getEffectiveProxy('https://example.com', config)).toBe(
        'http://all-proxy:3128'
      );
    });

    it('should return null for NO_PROXY matches', () => {
      const config = {
        http: 'http://proxy:8080',
        noProxy: ['localhost', '.example.com'],
      };
      expect(getEffectiveProxy('http://localhost', config)).toBeNull();
      expect(getEffectiveProxy('http://sub.example.com', config)).toBeNull();
    });

    it('should return null for invalid URLs', () => {
      const config = {
        http: 'http://proxy:8080',
        noProxy: [],
      };
      expect(getEffectiveProxy('not-a-url', config)).toBeNull();
    });
  });

  describe('hasProxyConfigured', () => {
    it('should return true if HTTP proxy is configured', () => {
      expect(hasProxyConfigured({ http: 'http://proxy:8080', noProxy: [] })).toBe(true);
    });

    it('should return true if HTTPS proxy is configured', () => {
      expect(hasProxyConfigured({ https: 'http://proxy:8443', noProxy: [] })).toBe(true);
    });

    it('should return true if ALL_PROXY is configured', () => {
      expect(hasProxyConfigured({ all: 'http://proxy:3128', noProxy: [] })).toBe(true);
    });

    it('should return false if no proxy is configured', () => {
      expect(hasProxyConfigured({ noProxy: [] })).toBe(false);
    });
  });
});
