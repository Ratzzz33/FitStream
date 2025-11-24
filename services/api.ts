
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
  // Railway free tier takes time to wake up (Cold Start), increased to 20s
  const { timeout = 20000 } = options; 
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

// Automatic Retry Logic for Cold Starts
const fetchWithRetry = async (resource: string, options: any = {}, retries = 3, backoff = 1000): Promise<Response> => {
    try {
        const response = await fetchWithTimeout(resource, options);
        // If 5xx error (Server Error), retry
        if (response.status >= 500 && response.status < 600) {
             throw new Error(`Server Error: ${response.status}`);
        }
        return response;
    } catch (error) {
        if (retries > 0) {
            console.log(`Retrying request... Attempts left: ${retries}`);
            await new Promise(resolve => setTimeout(resolve, backoff));
            return fetchWithRetry(resource, options, retries - 1, backoff * 2);
        }
        throw error;
    }
};

export const ApiService = {
    // 1. Sync Settings (Legacy + Pro check)
    async syncUser(userId: string, settings: any, customBaseUrl?: string): Promise<{ isPro: boolean } | null> {
        const url = getEffectiveUrl(customBaseUrl);
        try {
            const response = await fetchWithRetry(`${url}/user/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, settings }),
                timeout: 10000
            });
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (e) {
            console.warn(`Backend unreachable at ${url}`);
            return null; 
        }
    },

    // 2. Fetch ALL Data (Settings + Logs)
    async fetchFullUserData(userId: string, customBaseUrl?: string): Promise<any | null> {
        const url = getEffectiveUrl(customBaseUrl);
        try {
            const response = await fetchWithRetry(`${url}/data/${userId}`, {
                method: 'GET',
                timeout: 25000 // longer timeout for big data + cold start
            });
            if (!response.ok) {
                if(response.status === 404) return null; // New user
                throw new Error('Failed to fetch data');
            }
            return await response.json();
        } catch (e) {
            console.warn(`Failed to fetch full data:`, e);
            return null;
        }
    },

    // 3. Push Single Log Item (Exercise, Weight, Nutrition)
    async pushLog(userId: string, category: 'EXERCISE' | 'WEIGHT' | 'NUTRITION', data: any, customBaseUrl?: string): Promise<boolean> {
        const url = getEffectiveUrl(customBaseUrl);
        try {
            const response = await fetchWithRetry(`${url}/data/log`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, category, data }),
                timeout: 8000
            }, 2); // Less retries for background logs
            return response.ok;
        } catch (e) {
            return false; // Queued locally if failed (logic handled in service)
        }
    },
    
    // 4. Bulk Push (for migration/offline sync)
    async pushBulk(userId: string, payload: any, customBaseUrl?: string): Promise<boolean> {
        const url = getEffectiveUrl(customBaseUrl);
        try {
            const response = await fetchWithRetry(`${url}/data/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, ...payload }),
                timeout: 30000
            });
            return response.ok;
        } catch (e) {
            return false;
        }
    },

    async createCheckoutSession(userId: string, customBaseUrl?: string): Promise<string | null> {
        const url = getEffectiveUrl(customBaseUrl);
        try {
            const response = await fetchWithRetry(`${url}/create-checkout-session`, {
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
    },

    // 5. Fetch Phone Database
    async getPhoneDatabase(customBaseUrl?: string): Promise<{ name: string, weight: number }[]> {
        const url = getEffectiveUrl(customBaseUrl);
        try {
            const response = await fetchWithTimeout(`${url}/phones`, {
                method: 'GET',
                timeout: 5000
            });
            if (!response.ok) return [];
            return await response.json();
        } catch (e) {
            console.warn("Failed to fetch phone database, using fallback detection.");
            return [];
        }
    },

    // 6. Check Health
    async checkHealth(customBaseUrl?: string): Promise<boolean> {
        const url = getEffectiveUrl(customBaseUrl).replace('/api', ''); // Health is usually at root
        try {
            const response = await fetchWithTimeout(`${url}/health`, { method: 'GET', timeout: 3000 });
            return response.ok;
        } catch (e) {
            return false;
        }
    }
};
