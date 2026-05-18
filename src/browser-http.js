/**
 * Browser-compatible HTTP client
 * Replaces axios for browser environments using fetch API
 */

class BrowserHttpClient {
  constructor() {
    this.defaults = {
      timeout: 10000,
      headers: {}
    };
  }

  async get(url, config = {}) {
    const { params, headers, timeout } = config;
    
    // Build URL with query parameters
    const urlObj = new URL(url);
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          urlObj.searchParams.append(key, params[key]);
        }
      });
    }

    // Setup fetch options
    const fetchOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.defaults.headers,
        ...headers
      }
    };

    // Handle timeout
    const timeoutMs = timeout || this.defaults.timeout;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(urlObj.toString(), {
        ...fetchOptions,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        error.response = {
          status: response.status,
          statusText: response.statusText,
          data: await response.text()
        };
        throw error;
      }

      const data = await response.json();
      
      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      };

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        const timeoutError = new Error('Request timeout');
        timeoutError.code = 'ECONNABORTED';
        throw timeoutError;
      }
      
      // Network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        const networkError = new Error('Network error');
        networkError.code = 'ECONNREFUSED';
        throw networkError;
      }
      
      throw error;
    }
  }

  async post(url, data, config = {}) {
    const { headers, timeout } = config;

    const fetchOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.defaults.headers,
        ...headers
      },
      body: JSON.stringify(data)
    };

    // Handle timeout
    const timeoutMs = timeout || this.defaults.timeout;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        error.response = {
          status: response.status,
          statusText: response.statusText,
          data: await response.text()
        };
        throw error;
      }

      const responseData = await response.json();
      
      return {
        data: responseData,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      };

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        const timeoutError = new Error('Request timeout');
        timeoutError.code = 'ECONNABORTED';
        throw timeoutError;
      }
      
      // Network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        const networkError = new Error('Network error');
        networkError.code = 'ECONNREFUSED';
        throw networkError;
      }
      
      throw error;
    }
  }
}

// Create and export instance with axios-like interface
const browserHttp = new BrowserHttpClient();

module.exports = browserHttp;
module.exports.default = browserHttp;

// For ES6 imports
module.exports.get = browserHttp.get.bind(browserHttp);
module.exports.post = browserHttp.post.bind(browserHttp);
