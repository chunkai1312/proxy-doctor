/**
 * Proxy configuration detected from environment variables
 */
export interface ProxyConfig {
  http?: string;
  https?: string;
  all?: string;
  noProxy: string[];
}

/**
 * Parsed proxy URL components
 */
export interface ParsedProxy {
  protocol: string;
  hostname: string;
  port: number;
  username?: string;
  password?: string;
  raw: string;
}

/**
 * Result of a proxy connectivity test
 */
export interface TestResult {
  success: boolean;
  proxyType: 'http' | 'https' | 'all';
  proxyUrl: string;
  targetUrl: string;
  responseTime: number;
  statusCode?: number;
  error?: string;
  errorCode?: string;
}

/**
 * Diagnostic information for troubleshooting
 */
export interface DiagnosticInfo {
  issue: string;
  suggestion: string;
  details?: string;
}

/**
 * CLI options from commander
 */
export interface CliOptions {
  proxy?: string;
  target?: string;
  timeout?: number;
  verbose?: boolean;
  json?: boolean;
  http?: boolean;
  https?: boolean;
  direct?: boolean;
}

/**
 * Overall test summary
 */
export interface TestSummary {
  config: ProxyConfig;
  results: TestResult[];
  allPassed: boolean;
  timestamp: string;
}
