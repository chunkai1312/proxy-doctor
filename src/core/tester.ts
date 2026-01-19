import { ProxyAgent, fetch } from 'undici';
import type { ProxyConfig, TestResult, DiagnosticInfo } from '../types/index.js';

/**
 * Default test targets for connectivity testing
 */
export const DEFAULT_TARGETS = {
  http: 'http://www.google.com',
  https: 'https://www.google.com',
} as const;

/**
 * Default timeout in milliseconds
 */
export const DEFAULT_TIMEOUT = 10000;

/**
 * Test proxy connectivity to a target URL
 */
export async function testProxy(
  proxyUrl: string,
  targetUrl: string,
  proxyType: 'http' | 'https' | 'all',
  timeout: number = DEFAULT_TIMEOUT
): Promise<TestResult> {
  const startTime = Date.now();

  try {
    const proxyAgent = new ProxyAgent(proxyUrl);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(targetUrl, {
      dispatcher: proxyAgent,
      signal: controller.signal,
      method: 'HEAD', // Use HEAD to minimize data transfer
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    return {
      success: response.ok,
      proxyType,
      proxyUrl,
      targetUrl,
      responseTime,
      statusCode: response.status,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorInfo = parseError(error);

    return {
      success: false,
      proxyType,
      proxyUrl,
      targetUrl,
      responseTime,
      error: errorInfo.message,
      errorCode: errorInfo.code,
    };
  }
}

/**
 * Parse error into a readable format
 */
function parseError(error: unknown): { message: string; code?: string } {
  if (error instanceof Error) {
    const code = (error as NodeJS.ErrnoException).code;
    return {
      message: error.message,
      code,
    };
  }
  return { message: String(error) };
}

/**
 * Run all proxy tests based on configuration
 */
export async function runAllTests(
  config: ProxyConfig,
  options: {
    httpTarget?: string;
    httpsTarget?: string;
    timeout?: number;
    testHttp?: boolean;
    testHttps?: boolean;
  } = {}
): Promise<TestResult[]> {
  const {
    httpTarget = DEFAULT_TARGETS.http,
    httpsTarget = DEFAULT_TARGETS.https,
    timeout = DEFAULT_TIMEOUT,
    testHttp = true,
    testHttps = true,
  } = options;

  const results: TestResult[] = [];

  // Test HTTP proxy
  if (testHttp && (config.http || config.all)) {
    const proxyUrl = config.http ?? config.all!;
    const result = await testProxy(proxyUrl, httpTarget, 'http', timeout);
    results.push(result);
  }

  // Test HTTPS proxy
  if (testHttps && (config.https || config.all)) {
    const proxyUrl = config.https ?? config.all!;
    const result = await testProxy(proxyUrl, httpsTarget, 'https', timeout);
    results.push(result);
  }

  return results;
}

/**
 * Diagnose common proxy issues and provide suggestions
 */
export function diagnoseError(result: TestResult): DiagnosticInfo | null {
  if (result.success) {
    return null;
  }

  const { error, errorCode } = result;

  // Connection refused
  if (errorCode === 'ECONNREFUSED') {
    return {
      issue: 'Proxy server connection refused',
      suggestion: 'Check if the proxy server is running and the port is correct.',
      details: error,
    };
  }

  // Connection timeout
  if (errorCode === 'ETIMEDOUT' || errorCode === 'ENETUNREACH') {
    return {
      issue: 'Connection timed out',
      suggestion: 'The proxy server may be unreachable. Check network connectivity and firewall settings.',
      details: error,
    };
  }

  // DNS resolution failed
  if (errorCode === 'ENOTFOUND') {
    return {
      issue: 'DNS resolution failed',
      suggestion: 'The proxy hostname could not be resolved. Check the proxy URL for typos.',
      details: error,
    };
  }

  // Abort (timeout via AbortController)
  if (errorCode === 'ABORT_ERR' || error?.includes('aborted')) {
    return {
      issue: 'Request timed out',
      suggestion: 'The request took too long. Try increasing the timeout or check proxy performance.',
      details: error,
    };
  }

  // Authentication required
  if (result.statusCode === 407) {
    return {
      issue: 'Proxy authentication required',
      suggestion: 'The proxy requires authentication. Add credentials to the proxy URL (http://user:pass@proxy:port).',
      details: error,
    };
  }

  // Generic error
  return {
    issue: 'Proxy connection failed',
    suggestion: 'Check the proxy URL and ensure the proxy server is accessible.',
    details: error,
  };
}
