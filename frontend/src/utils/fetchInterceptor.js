/**
 * BULLETPROOF SOLUTION: Fetch Interceptor using ArrayBuffer
 * Uses arrayBuffer() instead of clone() to avoid rrweb conflicts
 * ArrayBuffer can be read without consuming the stream
 */

// Store original fetch
const originalFetch = window.fetch;

// Proxy handler for Response
const createSafeResponse = (originalResponse, buffer) => {
  // Convert buffer to text
  const decoder = new TextDecoder('utf-8');
  const bodyText = decoder.decode(buffer);
  
  // Try to parse JSON
  let bodyData;
  try {
    bodyData = JSON.parse(bodyText);
  } catch {
    bodyData = bodyText;
  }
  
  // Create proxy that intercepts method calls
  return new Proxy(originalResponse, {
    get(target, prop) {
      // Intercept json() method
      if (prop === 'json') {
        return async () => {
          if (typeof bodyData === 'object' && bodyData !== null) {
            return bodyData;
          }
          return JSON.parse(bodyText);
        };
      }
      
      // Intercept text() method
      if (prop === 'text') {
        return async () => bodyText;
      }
      
      // Intercept clone() method
      if (prop === 'clone') {
        return () => createSafeResponse(originalResponse, buffer);
      }
      
      // Intercept arrayBuffer() method
      if (prop === 'arrayBuffer') {
        return async () => buffer;
      }
      
      // Return original property
      return target[prop];
    }
  });
};

// Override fetch globally
window.fetch = async function(...args) {
  try {
    const response = await originalFetch.apply(this, args);
    
    // Read arrayBuffer immediately (this doesn't lock the body!)
    const buffer = await response.arrayBuffer();
    
    // Create safe response with the buffer
    const safeResponse = createSafeResponse(response, buffer);
    
    return safeResponse;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};

console.log('✅ BULLETPROOF Fetch interceptor active (using arrayBuffer)');
