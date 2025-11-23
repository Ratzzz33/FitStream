// Replace this URL with your Railway Backend URL after deployment
// For local dev, usually http://localhost:8080
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const fetchWithTimeout = async (resource: string, options: any = {}) => {
  const { timeout = 5000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal  
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export const ApiService = {
    async syncUser(userId: string, settings: any): Promise<{ isPro: boolean } | null> {
        try {
            const response = await fetchWithTimeout(`${API_URL}/user/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, settings }),
                timeout: 3000 // Short timeout for sync to not block UI
            });
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (e) {
            // Silently fail to offline mode
            console.log("Backend unreachable (Offline Mode active)");
            return null; 
        }
    },

    async createCheckoutSession(userId: string): Promise<string | null> {
        try {
            const response = await fetchWithTimeout(`${API_URL}/create-checkout-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
                timeout: 5000
            });
            
            if (!response.ok) throw new Error('Payment server error');
            
            const data = await response.json();
            return data.url;
        } catch (e) {
            console.warn("Payment service unavailable, falling back to demo mode.");
            return null;
        }
    }
};