/**
 * Manager Discovery
 *
 * Resolves the manager endpoint that assigns a worker. There is deliberately
 * no fallback: an explicitly configured manager is used verbatim, and if it is
 * unreachable the connection fails. Silently substituting the default manager
 * would let a client aimed at a broken or non-production endpoint appear to
 * work, hiding both misconfiguration and outages.
 */
const DEFAULT_MANAGER_URL = 'https://connect.oddsockets.tyga.network';

class ManagerDiscovery {
  /**
   * Resolve the manager URL to use.
   *
   * The default applies only when no manager was configured at all — it is
   * never used to recover from a configured-but-failing manager.
   *
   * @param {string} apiKey - The OddSockets API key (reserved for future routing)
   * @param {string} [configuredUrl] - Manager URL from the client config
   * @returns {Promise<string>} The manager URL
   */
  async discoverManagerUrl(apiKey, configuredUrl) {
    return this._validate(configuredUrl || DEFAULT_MANAGER_URL);
  }

  /**
   * Reject anything that is not an absolute http(s) URL up front, rather than
   * letting a malformed value surface later as a confusing request error.
   * @private
   */
  _validate(url) {
    let parsed;
    try {
      parsed = new URL(url);
    } catch (e) {
      throw new Error(`Invalid managerUrl: ${url}`);
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error(`Invalid managerUrl protocol '${parsed.protocol}' in ${url} (expected http or https)`);
    }
    return url.replace(/\/+$/, '');
  }
}

// Singleton instance
const managerDiscovery = new ManagerDiscovery();
managerDiscovery.DEFAULT_MANAGER_URL = DEFAULT_MANAGER_URL;

module.exports = managerDiscovery;
