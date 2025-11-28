/**
 * Helper function to handle fetch responses safely
 * Prevents "body stream already read" errors
 * 
 * @param {Promise<Response>} fetchPromise - The fetch promise
 * @returns {Promise<{ok: boolean, status: number, data: any}>}
 */
export const safeFetch = async (fetchPromise) => {
  try {
    const response = await fetchPromise;
    
    // Clone the response before reading to avoid "already read" errors
    const clonedResponse = response.clone();
    
    let data = null;
    try {
      data = await clonedResponse.json();
    } catch (jsonError) {
      // If JSON parsing fails, try to get text
      data = await response.text();
    }
    
    return {
      ok: response.ok,
      status: response.status,
      data: data
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Alternative: Read response.json() once and return both status and data
 * This is more efficient than cloning
 * 
 * @param {Response} response - The fetch response object
 * @returns {Promise<{ok: boolean, status: number, data: any}>}
 */
export const parseResponse = async (response) => {
  const data = await response.json();
  
  return {
    ok: response.ok,
    status: response.status,
    data: data
  };
};
