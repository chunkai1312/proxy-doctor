#!/usr/bin/env node

import { Command } from 'commander';
import { detectProxyFromEnv, hasProxyConfigured } from './core/detector.js';
import { runAllTests, testProxy, DEFAULT_TARGETS, DEFAULT_TIMEOUT } from './core/tester.js';
import { Logger } from './utils/logger.js';
import type { CliOptions, ProxyConfig, TestSummary } from './types/index.js';

const program = new Command();

program
  .name('proxy-doctor')
  .description('CLI tool to diagnose HTTP/HTTPS proxy connectivity')
  .version('1.0.0')
  .option('-p, --proxy <url>', 'Specify a proxy URL to test (overrides environment variables)')
  .option('-t, --target <url>', 'Target URL to test connectivity against')
  .option('--timeout <ms>', 'Request timeout in milliseconds', String(DEFAULT_TIMEOUT))
  .option('-v, --verbose', 'Enable verbose output')
  .option('-j, --json', 'Output results as JSON')
  .option('--http', 'Test HTTP proxy only')
  .option('--https', 'Test HTTPS proxy only')
  .option('-d, --direct', 'Test direct connection without proxy (for debugging)')
  .action(async (options: CliOptions) => {
    const logger = new Logger({
      verbose: options.verbose,
      json: options.json,
    });

    try {
      await runDiagnostics(options, logger);
    } catch (error) {
      logger.error(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

async function runDiagnostics(options: CliOptions, logger: Logger): Promise<void> {
  logger.header();

  // Detect or use provided proxy configuration
  let config: ProxyConfig;

  if (options.proxy) {
    // Use manually specified proxy for both HTTP and HTTPS
    config = {
      http: options.proxy,
      https: options.proxy,
      noProxy: [],
    };
    logger.debug(`Using provided proxy: ${options.proxy}`);
  } else {
    // Detect from environment variables
    logger.debug('Detecting proxy from environment variables...');
    config = detectProxyFromEnv();
    logger.debug(`Detected config: HTTP=${config.http}, HTTPS=${config.https}, ALL=${config.all}`);
  }

  logger.printConfig(config);

  // Check if any proxy is configured (skip check in direct mode)
  if (!options.direct && !hasProxyConfigured(config)) {
    logger.warn('No proxy configuration found.');
    logger.warn('Set HTTP_PROXY, HTTPS_PROXY, or ALL_PROXY environment variables,');
    logger.warn('or use --proxy <url> to specify a proxy to test.');
    logger.warn('Or use --direct to test direct connection without proxy.');

    if (options.json) {
      const summary: TestSummary = {
        config,
        results: [],
        allPassed: false,
        timestamp: new Date().toISOString(),
      };
      logger.printJson(summary);
    }
    process.exit(1);
  }

  // Determine what to test
  const testHttp = options.http || (!options.http && !options.https);
  const testHttps = options.https || (!options.http && !options.https);
  const timeout = options.timeout ? parseInt(String(options.timeout), 10) : DEFAULT_TIMEOUT;

  logger.debug(`Test configuration: HTTP=${testHttp}, HTTPS=${testHttps}, timeout=${timeout}ms`);


  // Determine target URLs
  let httpTarget: string = DEFAULT_TARGETS.http;
  let httpsTarget: string = DEFAULT_TARGETS.https;

  if (options.target) {
    const targetUrl = new URL(options.target);
    if (targetUrl.protocol === 'https:') {
      httpsTarget = options.target;
      logger.debug(`Using custom HTTPS target: ${httpsTarget}`);
    } else {
      httpTarget = options.target;
      logger.debug(`Using custom HTTP target: ${httpTarget}`);
    }
  } else {
    logger.debug(`Using default targets: HTTP=${httpTarget}, HTTPS=${httpsTarget}`);
  }

  // Run tests
  const spinner = logger.spinner(
    options.direct ? 'Testing direct connectivity...' : 'Testing proxy connectivity...'
  );
  spinner.start();

  const results = await runAllTests(config, {
    httpTarget,
    httpsTarget,
    timeout,
    testHttp,
    testHttps,
    verbose: options.verbose,
    direct: options.direct,
  });

  spinner.stop();

  // Print results
  for (const result of results) {
    logger.printResult(result);
  }

  // Print summary
  logger.printSummary(results);

  // JSON output
  const allPassed = results.every(r => r.success);
  const summary: TestSummary = {
    config,
    results,
    allPassed,
    timestamp: new Date().toISOString(),
  };
  logger.printJson(summary);

  // Exit with appropriate code
  process.exit(allPassed ? 0 : 1);
}

program.parse();
