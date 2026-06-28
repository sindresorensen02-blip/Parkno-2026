// Vercel Speed Insights integration
// This script initializes Speed Insights for tracking web vitals

(function() {
  // Initialize the queue for Speed Insights
  if (!window.si) {
    window.si = function(...params) {
      (window.siq = window.siq || []).push(params);
    };
  }

  // Load the Speed Insights script
  const script = document.createElement('script');
  script.src = '/_vercel/speed-insights/script.js';
  script.defer = true;
  script.dataset.sdkn = '@vercel/speed-insights';
  script.dataset.sdkv = '1.3.1';
  
  script.onerror = function() {
    console.log('[Vercel Speed Insights] Failed to load script. Please check if any content blockers are enabled and try again.');
  };
  
  document.head.appendChild(script);
})();
