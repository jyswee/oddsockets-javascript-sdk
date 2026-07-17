/**
 * Simple Manager Discovery Service
 * 
 * Always connects to the main manager endpoint which handles
 * all routing and load balancing transparently.
 */
class ManagerDiscovery {
  constructor() {
    this.managerUrl = 'https://connect.oddsockets.tyga.network';
  }

  /**
   * Get the manager URL (always returns the main endpoint)
   * @param {string} apiKey - The OddSockets API key (not used, kept for compatibility)
   * @returns {Promise<string>} The manager URL
   */
  async discoverManagerUrl(apiKey) {
    return this.managerUrl;
  }

  /**
   * Clear cache (no-op, kept for compatibility)
   */
  clearCache() {
    // No cache to clear in simplified version
  }
}

// Singleton instance
const managerDiscovery = new ManagerDiscovery();

module.exports = managerDiscovery;
