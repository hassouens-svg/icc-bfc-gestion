/**
 * ULTIMATE SOLUTION: Fetch Interceptor with Immediate Body Capture
 * Reads the response body IMMEDIATELY before ANY external script can touch it
 */

// Store original fetch
const originalFetch = window.fetch;

// Create wrapper that captures body immediately
window.fetch = async function(...args) {
  try {
    const response = await originalFetch.apply(this, args);
    
    // CRITICAL: Read the body IMMEDIATELY before rrweb or any other script
    let bodyText = null;
    let bodyData = null;
    
    try {
      // Clone and read body right away
      const clonedResponse = response.clone();
      bodyText = await clonedResponse.text();
      
      // Try to parse as JSON
      try {
        bodyData = JSON.parse(bodyText);
      } catch {
        bodyData = bodyText;
      }
    } catch (cloneError) {
      console.warn('Could not clone response:', cloneError);
    }
    
    // Create a new Response object with the captured data
    const safeResponse = new Response(bodyText || '', {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
    
    // Add helper properties
    safeResponse.ok = response.ok;
    safeResponse.url = response.url;
    safeResponse.type = response.type;
    safeResponse.redirected = response.redirected;
    
    // Override json() to return our pre-parsed data
    safeResponse.json = async function() {
      if (bodyData !== null && typeof bodyData === 'object') {
        return bodyData;
      }
      return JSON.parse(bodyText);
    };
    
    // Override text() to return our pre-read text
    safeResponse.text = async function() {
      return bodyText;
    };
    
    // Clone returns a safe copy
    safeResponse.clone = function() {
      const clonedSafe = new Response(bodyText || '', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
      clonedSafe.ok = response.ok;
      clonedSafe.json = async () => bodyData;
      clonedSafe.text = async () => bodyText;
      return clonedSafe;
    };
    
    return safeResponse;
  } catch (error) {
    console.error('Fetch interceptor error:', error);
    throw error;
  }
};

console.log('✅ ULTIMATE Fetch interceptor installed - body captured immediately!');
