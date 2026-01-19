import type { ProxyConfig, ParsedProxy } from '../types/index.js';

/**
 * Environment variable names for proxy settings (case-insensitive)
 */
const PROXY_ENV_VARS = {
  http: ['HTTP_PROXY', 'http_proxy'],
  https: ['HTTPS_PROXY', 'https_proxy'],
  all: ['ALL_PROXY', 'all_proxy'],
  noProxy: ['NO_PROXY', 'no_proxy'],
} as const;

/**
 * Get the first defined environment variable from a list
 */
function getEnvVar(names: readonly string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name];
    if (value) {
      return value;
    }
  }
  return undefined;
}

/**
 * Parse NO_PROXY value into an array of patterns
 */
function parseNoProxy(noProxy: string | undefined): string[] {
  if (!noProxy) {
    return [];
  }
  return noProxy
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Detect proxy configuration from environment variables
 */
export function detectProxyFromEnv(): ProxyConfig {
  return {
    http: getEnvVar(PROXY_ENV_VARS.http),
    https: getEnvVar(PROXY_ENV_VARS.https),
    all: getEnvVar(PROXY_ENV_VARS.all),
    noProxy: parseNoProxy(getEnvVar(PROXY_ENV_VARS.noProxy)),
  };
}

/**
 * Parse a proxy URL into its components
 */
export function parseProxyUrl(proxyUrl: string): ParsedProxy | null {
  try {
    const url = new URL(proxyUrl);
    return {
      protocol: url.protocol.replace(':', ''),
      hostname: url.hostname,
      port: url.port ? parseInt(url.port, 10) : (url.protocol === 'https:' ? 443 : 80),
      username: url.username || undefined,
      password: url.password || undefined,
      raw: proxyUrl,
    };
  } catch {
    return null;
  }
}

/**
 * Check if a hostname matches any NO_PROXY patterns
 */
export function isNoProxy(hostname: string, noProxyList: string[]): boolean {
  for (const pattern of noProxyList) {
    // Exact match
    if (hostname === pattern) {
      return true;
    }
    // Wildcard match (e.g., .example.com matches sub.example.com)
    if (pattern.startsWith('.') && hostname.endsWith(pattern)) {
      return true;
    }
    // Also match without leading dot
    if (hostname.endsWith('.' + pattern)) {
      return true;
    }
  }
  return false;
}

/**
 * Get the effective proxy URL for a given target URL
 */
export function getEffectiveProxy(
  targetUrl: string,
  config: ProxyConfig
): string | null {
  try {
    const url = new URL(targetUrl);

    // Check NO_PROXY first
    if (isNoProxy(url.hostname, config.noProxy)) {
      return null;
    }

    // Return protocol-specific proxy or ALL_PROXY
    if (url.protocol === 'https:') {
      return config.https ?? config.all ?? null;
    }
    return config.http ?? config.all ?? null;
  } catch {
    return null;
  }
}

/**
 * Check if any proxy is configured
 */
export function hasProxyConfigured(config: ProxyConfig): boolean {
  return !!(config.http || config.https || config.all);
}
