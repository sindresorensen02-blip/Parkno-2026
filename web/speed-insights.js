/**
 * Vercel Speed Insights initialization
 * This script loads and initializes Speed Insights for the Parkno application.
 */

// Import and inject Speed Insights
import { injectSpeedInsights } from '@vercel/speed-insights';

// Initialize Speed Insights when DOM is ready
if (typeof window !== 'undefined') {
  injectSpeedInsights();
}
