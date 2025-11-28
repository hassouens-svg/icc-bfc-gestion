/**
 * Global Fetch Interceptor
 * Intercepts all fetch requests and responses to prevent "body already used" errors
 * caused by external scripts like rrweb
 */

// Store original fetch
const originalFetch = window.fetch;

// Create a safer fetch wrapper
window.fetch = async function(...args) {
  try {
    const response = await originalFetch.apply(this, args);
    
    // Clone the response IMMEDIATELY before anything else can touch it
    // This prevents external scripts from consuming the body first
    const clonedResponse = response.clone();
    
    // Override the json() method to use the clone
    const originalJson = clonedResponse.json.bind(clonedResponse);
    const originalText = clonedResponse.text.bind(clonedResponse);
    
    clonedResponse.json = async function() {
      try {
        return await originalJson();
      } catch (error) {
        console.warn('Error reading JSON, trying text fallback:', error);
        return await originalText();
      }
    };
    
    return clonedResponse;
  } catch (error) {
    // If fetch itself fails, throw the error
    throw error;
  }
};

console.log('✅ Fetch interceptor installed - preventing "body already used" errors');
