
// Set the default API URL to the production backend provided
const DEFAULT_API_URL = 'https://fitstream-production.up.railway.app/api';

const getEffectiveUrl = (customUrl?: string) => {
    if (customUrl && customUrl.trim().length > 0) {
        let url = customUrl.trim();
        // Remove trailing slash
        if (url.endsWith('/')) url = url.slice(0, -1);
        // Append /api if not present
        if (!url.endsWith('/api')) url += '/api';
        return url;
    }
    return DEFAULT_API_URL;
};

const fetchWithTimeout = async (resource: string, options: any = {}) => {
  // Railway free tier takes time to wake up (Cold Start), increased to 15s
  const { timeout = 15000 } = options; 
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
    async syncUser(userId: string, settings: any, customBaseUrl?: string): Promise<{ isPro: boolean } | null> {
        const url = getEffectiveUrl(customBaseUrl);
        try {
            const response = await fetchWithTimeout(`${url}/user/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, settings }),
                timeout: 15000 // 15s timeout for cold starts
            });
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (e) {
            // Silently fail to offline mode
            console.warn(`Backend unreachable at ${url} (Offline Mode active)`);
            return null; 
        }
    },

    async createCheckoutSession(userId: string, customBaseUrl?: string): Promise<string | null> {
        const url = getEffectiveUrl(customBaseUrl);
        try {
            const response = await fetchWithTimeout(`${url}/create-checkout-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
                timeout: 15000
            });
            
            if (!response.ok) throw new Error('Payment server error');
            
            const data = await response.json();
            return data.url;
        } catch (e) {
            console.warn(`Payment service unavailable at ${url}, falling back to demo mode.`);
            return null;
        }
    }
};
