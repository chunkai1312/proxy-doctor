import chalk from 'chalk';
import ora, { type Ora } from 'ora';
import type { ProxyConfig, TestResult, TestSummary, DiagnosticInfo } from '../types/index.js';
import { diagnoseError } from '../core/tester.js';

/**
 * Logger utility for CLI output
 */
export class Logger {
  private verbose: boolean;
  private jsonMode: boolean;

  constructor(options: { verbose?: boolean; json?: boolean } = {}) {
    this.verbose = options.verbose ?? false;
    this.jsonMode = options.json ?? false;
  }

  /**
   * Create a spinner for async operations
   */
  spinner(text: string): Ora {
    if (this.jsonMode) {
      // Return a dummy spinner in JSON mode
      return {
        start: () => this,
        stop: () => this,
        succeed: () => this,
        fail: () => this,
        warn: () => this,
      } as unknown as Ora;
    }
    return ora(text);
  }

  /**
   * Print the header banner
   */
  header(): void {
    if (this.jsonMode) return;

    console.log();
    console.log(chalk.cyan.bold('🔍 Proxy Doctor') + chalk.gray(' - Checking your proxy configuration...'));
    console.log();
  }

  /**
   * Print detected proxy configuration
   */
  printConfig(config: ProxyConfig): void {
    if (this.jsonMode) return;

    console.log(chalk.yellow.bold('📡 Detected Proxy Settings:'));

    const printVar = (name: string, value: string | undefined) => {
      const displayValue = value
        ? chalk.green(this.maskCredentials(value))
        : chalk.gray('(not set)');
      console.log(`   ${chalk.white(name.padEnd(14))} ${displayValue}`);
    };

    printVar('HTTP_PROXY:', config.http);
    printVar('HTTPS_PROXY:', config.https);
    printVar('ALL_PROXY:', config.all);

    const noProxyValue = config.noProxy.length > 0
      ? config.noProxy.join(', ')
      : undefined;
    printVar('NO_PROXY:', noProxyValue);

    console.log();
  }

  /**
   * Print a test result
   */
  printResult(result: TestResult): void {
    if (this.jsonMode) return;

    const typeLabel = result.proxyType.toUpperCase();

    if (result.success) {
      console.log(chalk.green(`✅ ${typeLabel} Proxy Test`));
      console.log(chalk.gray(`   → Target: ${result.targetUrl}`));
      console.log(chalk.green(`   ✓ Success`) +
        chalk.gray(` (${result.responseTime}ms)`) +
        chalk.cyan(` [${result.statusCode}]`));
    } else {
      console.log(chalk.red(`❌ ${typeLabel} Proxy Test`));
      console.log(chalk.gray(`   → Target: ${result.targetUrl}`));
      console.log(chalk.red(`   ✗ Failed`) +
        chalk.gray(` (${result.responseTime}ms)`));

      if (result.error) {
        console.log(chalk.red(`   Error: ${result.error}`));
      }

      // Print diagnostic suggestion
      const diagnostic = diagnoseError(result);
      if (diagnostic) {
        console.log(chalk.yellow(`   💡 ${diagnostic.suggestion}`));
      }
    }
    console.log();
  }

  /**
   * Print summary
   */
  printSummary(results: TestResult[]): void {
    if (this.jsonMode) return;

    const passed = results.filter(r => r.success).length;
    const total = results.length;

    if (total === 0) {
      console.log(chalk.yellow('⚠️  No proxy tests were run. Check if proxy environment variables are set.'));
      return;
    }

    if (passed === total) {
      console.log(chalk.green.bold('🎉 All proxy connections are working correctly!'));
    } else {
      console.log(chalk.red.bold(`⚠️  ${total - passed}/${total} proxy tests failed.`));
    }
    console.log();
  }

  /**
   * Print JSON output
   */
  printJson(summary: TestSummary): void {
    if (!this.jsonMode) return;
    console.log(JSON.stringify(summary, null, 2));
  }

  /**
   * Print warning message
   */
  warn(message: string): void {
    if (this.jsonMode) return;
    console.log(chalk.yellow(`⚠️  ${message}`));
  }

  /**
   * Print error message
   */
  error(message: string): void {
    if (this.jsonMode) return;
    console.log(chalk.red(`❌ ${message}`));
  }

  /**
   * Print info message (verbose only)
   */
  debug(message: string): void {
    if (this.jsonMode || !this.verbose) return;
    console.log(chalk.gray(`   [debug] ${message}`));
  }

  /**
   * Mask credentials in proxy URL for display
   */
  private maskCredentials(url: string): string {
    try {
      const parsed = new URL(url);
      if (parsed.password) {
        parsed.password = '****';
      }
      return parsed.toString();
    } catch {
      return url;
    }
  }
}
