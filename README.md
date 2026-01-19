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
npm install -g proxy-doctor
```

## Usage

### Basic Usage

```bash
# Auto-detect proxy from environment variables
proxy-doctor
```

### Options

| Option | Description |
|--------|-------------|
| `-p, --proxy <url>` | Specify a proxy URL to test (overrides environment variables) |
| `-t, --target <url>` | Target URL to test connectivity against |
| `--timeout <ms>` | Request timeout in milliseconds (default: 10000) |
| `-v, --verbose` | Enable verbose output with debug information |
| `-j, --json` | Output results as JSON |
| `--http` | Test HTTP proxy only |
| `--https` | Test HTTPS proxy only |
| `-d, --direct` | Test direct connection without proxy (for debugging) |
| `-k, --insecure` | Skip SSL certificate verification (for corporate proxies) |
| `-h, --help` | Display help |
| `-V, --version` | Display version |

### Examples

#### Basic Testing

```bash
# Test with a specific proxy
proxy-doctor --proxy http://proxy.example.com:8080

# Test HTTPS proxy only
proxy-doctor --https

# Test against a custom target (auto-detects protocol)
proxy-doctor --target https://api.github.com

# Get JSON output for scripting
proxy-doctor --json

# Increase timeout for slow proxies
proxy-doctor --timeout 30000

# Verbose mode for debugging
proxy-doctor --verbose
```

#### Direct Connection Testing

```bash
# Test direct connection (bypass proxy)
proxy-doctor --direct

# Compare direct vs proxy performance
proxy-doctor --verbose          # Test with proxy
proxy-doctor --direct --verbose # Test without proxy

# Test direct connection to specific target
proxy-doctor --direct --target https://api.github.com
```

#### Corporate Proxy with SSL Inspection

```bash
# Skip SSL certificate verification (corporate proxy)
proxy-doctor --insecure

# Verbose output with SSL bypass
proxy-doctor --proxy http://corporate-proxy:8080 --insecure -v

# Test HTTPS only with SSL bypass
proxy-doctor --https --insecure
```

#### Advanced Usage

```bash
# Test specific target with custom proxy and SSL bypass
proxy-doctor --proxy http://proxy:8080 --target https://registry.npmjs.com --insecure

# Multiple protocol override (test both even with custom target)
proxy-doctor --target https://example.com --http

# Comprehensive test with all options
proxy-doctor --proxy http://proxy:8080 --timeout 15000 --insecure --verbose
```

## Environment Variables

Proxy Doctor reads the following environment variables:

| Variable | Description |
|----------|-------------|
| `HTTP_PROXY` / `http_proxy` | Proxy for HTTP requests |
| `HTTPS_PROXY` / `https_proxy` | Proxy for HTTPS requests |
| `ALL_PROXY` / `all_proxy` | Proxy for all requests (fallback) |
| `NO_PROXY` / `no_proxy` | Comma-separated list of hosts to bypass proxy |

### Setting Environment Variables

```bash
# Linux/macOS
export HTTP_PROXY=http://proxy.example.com:8080
export HTTPS_PROXY=http://proxy.example.com:8080
export NO_PROXY=localhost,127.0.0.1,.local

# Windows (Command Prompt)
set HTTP_PROXY=http://proxy.example.com:8080
set HTTPS_PROXY=http://proxy.example.com:8080

# Windows (PowerShell)
$env:HTTP_PROXY="http://proxy.example.com:8080"
$env:HTTPS_PROXY="http://proxy.example.com:8080"
```

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
| `ENETUNREACH` | Network unreachable. Check firewall settings and routing |
| `ENOTFOUND` | DNS resolution failed. Check the proxy URL for typos |
| `407 Status` | Proxy requires authentication. Add credentials to the URL |
| `UNABLE_TO_GET_ISSUER_CERT_LOCALLY` | SSL certificate issue. Use `--insecure` for corporate proxies |
| `SELF_SIGNED_CERT_IN_CHAIN` | Self-signed certificate detected. Use `--insecure` if trusted |
| `CERT_HAS_EXPIRED` | Certificate expired. Contact proxy administrator |
| `Request was cancelled` | Proxy may not support the request. This is usually harmless |

### SSL Certificate Issues

Corporate environments often use proxy servers that perform SSL inspection, which can cause certificate verification errors. If you see errors like:

- `unable to get local issuer certificate`
- `self signed certificate in certificate chain`
- `certificate has expired`

Use the `--insecure` flag to bypass SSL verification:

```bash
proxy-doctor --insecure
```

⚠️ **Warning**: Only use `--insecure` in trusted environments. It disables all SSL certificate verification.

### Protocol Auto-Detection

When using `--target`, the tool automatically detects which protocol to test:

```bash
# Only tests HTTPS
proxy-doctor --target https://api.example.com

# Only tests HTTP
proxy-doctor --target http://api.example.com

# Override: test both protocols
proxy-doctor --target https://api.example.com --http
```

## License

MIT
