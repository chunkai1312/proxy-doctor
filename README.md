# 🔍 Proxy Doctor

A CLI tool to diagnose HTTP/HTTPS proxy connectivity.

## Features

- 🔎 **Auto-detect** proxy settings from environment variables (`HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`, `NO_PROXY`)
- 🧪 **Test connectivity** through proxy to target URLs
- 📊 **Detailed diagnostics** with actionable suggestions for common issues
- 🎨 **Beautiful output** with colors and spinners
- 📝 **JSON output** for scripting and CI/CD integration

## Installation

```bash
# Clone and install
git clone <repo-url>
cd proxy-doctor
npm install

# Build and link globally
npm run build
npm link
```

## Usage

### Basic Usage

```bash
# Auto-detect proxy from environment variables
proxy-doctor

# Or run in development mode
npm run dev
```

### Options

| Option | Description |
|--------|-------------|
| `-p, --proxy <url>` | Specify a proxy URL to test (overrides environment variables) |
| `-t, --target <url>` | Target URL to test connectivity against |
| `--timeout <ms>` | Request timeout in milliseconds (default: 10000) |
| `-v, --verbose` | Enable verbose output |
| `-j, --json` | Output results as JSON |
| `--http` | Test HTTP proxy only |
| `--https` | Test HTTPS proxy only |
| `-h, --help` | Display help |
| `-V, --version` | Display version |

### Examples

```bash
# Test with a specific proxy
proxy-doctor --proxy http://proxy.example.com:8080

# Test HTTPS proxy only
proxy-doctor --https

# Test against a custom target
proxy-doctor --target https://api.github.com

# Get JSON output for scripting
proxy-doctor --json

# Increase timeout for slow proxies
proxy-doctor --timeout 30000

# Verbose mode for debugging
proxy-doctor --verbose
```

## Environment Variables

Proxy Doctor reads the following environment variables:

| Variable | Description |
|----------|-------------|
| `HTTP_PROXY` / `http_proxy` | Proxy for HTTP requests |
| `HTTPS_PROXY` / `https_proxy` | Proxy for HTTPS requests |
| `ALL_PROXY` / `all_proxy` | Proxy for all requests (fallback) |
| `NO_PROXY` / `no_proxy` | Comma-separated list of hosts to bypass proxy |

## Output Examples

### Success

```
🔍 Proxy Doctor - Checking your proxy configuration...

📡 Detected Proxy Settings:
   HTTP_PROXY:    http://proxy.example.com:8080/
   HTTPS_PROXY:   http://proxy.example.com:8080/
   ALL_PROXY:     (not set)
   NO_PROXY:      localhost,127.0.0.1

✅ HTTP Proxy Test
   → Target: http://www.google.com
   ✓ Success (234ms) [200]

✅ HTTPS Proxy Test
   → Target: https://www.google.com
   ✓ Success (456ms) [200]

🎉 All proxy connections are working correctly!
```

### Failure with Diagnostics

```
🔍 Proxy Doctor - Checking your proxy configuration...

📡 Detected Proxy Settings:
   HTTP_PROXY:    http://127.0.0.1:7890/
   HTTPS_PROXY:   (not set)
   ALL_PROXY:     (not set)
   NO_PROXY:      (not set)

❌ HTTP Proxy Test
   → Target: http://www.google.com
   ✗ Failed (8ms)
   Error: connect ECONNREFUSED 127.0.0.1:7890
   💡 Check if the proxy server is running and the port is correct.

⚠️  1/1 proxy tests failed.
```

### JSON Output

```json
{
  "config": {
    "http": "http://127.0.0.1:7890",
    "https": "http://127.0.0.1:7890",
    "noProxy": []
  },
  "results": [
    {
      "success": true,
      "proxyType": "http",
      "proxyUrl": "http://127.0.0.1:7890",
      "targetUrl": "http://www.google.com",
      "responseTime": 234,
      "statusCode": 200
    }
  ],
  "allPassed": true,
  "timestamp": "2026-01-19T05:00:00.000Z"
}
```

## Diagnostics

Proxy Doctor provides helpful suggestions for common issues:

| Error | Suggestion |
|-------|------------|
| `ECONNREFUSED` | Check if the proxy server is running and the port is correct |
| `ETIMEDOUT` | The proxy server may be unreachable. Check network connectivity |
| `ENOTFOUND` | DNS resolution failed. Check the proxy URL for typos |
| `407 Status` | Proxy requires authentication. Add credentials to the URL |

## Development

```bash
# Run in development mode
npm run dev

# Build TypeScript
npm run build

# Run built version
npm start
```

## Project Structure

```
src/
├── index.ts              # CLI entry point
├── types/
│   └── index.ts          # TypeScript type definitions
├── core/
│   ├── detector.ts       # Proxy environment variable detection
│   └── tester.ts         # Connectivity testing & diagnostics
└── utils/
    └── logger.ts         # Colored terminal output
```

## License

MIT
