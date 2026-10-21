/**
 * API Service for PrivacyLens Frontend
 * Uses relative URLs so that requests are routed through the Vite dev proxy to the Express backend.
 */

/**
 * Checks backend API health status.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function checkBackendHealth() {
  try {
    const response = await fetch('/api/health', {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `HTTP ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Failed to communicate with backend server',
    };
  }
}
