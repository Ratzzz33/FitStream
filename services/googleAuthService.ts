/**
 * Google Auth Service
 *
 * Handles Google Sign-In for both:
 * - Native Android app (via Capacitor plugin)
 * - Web/Telegram Mini App (via Google Identity Services)
 */

import { Capacitor } from '@capacitor/core';

// Dynamic import to avoid build errors when plugin isn't available
const getGoogleAuthPlugin = async () => {
  try {
    const module = await import('@codetrix-studio/capacitor-google-auth');
    return module.GoogleAuth;
  } catch {
    return null;
  }
};

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  givenName?: string;
  familyName?: string;
  imageUrl?: string;
  idToken?: string;
}

class GoogleAuthService {
  private initialized = false;
  private googleAuth: any = null;

  /**
   * Check if running on native platform
   */
  isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Initialize Google Auth
   * For native: initialize Capacitor plugin
   * For web: Google Identity Services is initialized elsewhere
   */
  async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    if (this.isNative()) {
      try {
        this.googleAuth = await getGoogleAuthPlugin();
        if (this.googleAuth) {
          await this.googleAuth.initialize({
            clientId: '904738538720-e3gc8a51asb27c06arloppue3h9e4vip.apps.googleusercontent.com',
            scopes: ['profile', 'email'],
            grantOfflineAccess: true
          });
          this.initialized = true;
          console.log('[GoogleAuth] Native plugin initialized');
          return true;
        }
      } catch (error) {
        console.error('[GoogleAuth] Native initialization failed:', error);
        return false;
      }
    }

    // Web initialization happens in App.tsx via Google Identity Services
    this.initialized = true;
    return true;
  }

  /**
   * Sign in with Google (native only)
   * For web, use the callback approach in App.tsx
   */
  async signIn(): Promise<GoogleUser | null> {
    if (!this.isNative()) {
      console.warn('[GoogleAuth] signIn() called on web - use web callback instead');
      return null;
    }

    try {
      console.log('[GoogleAuth] Starting native sign-in...');

      if (!this.googleAuth) {
        console.log('[GoogleAuth] Loading plugin...');
        this.googleAuth = await getGoogleAuthPlugin();
      }

      if (!this.googleAuth) {
        console.error('[GoogleAuth] Plugin not available!');
        throw new Error('Google Auth plugin not available');
      }

      console.log('[GoogleAuth] Initializing...');
      await this.initialize();

      console.log('[GoogleAuth] Calling signIn()...');
      const user = await this.googleAuth.signIn();
      console.log('[GoogleAuth] Sign-in returned:', user ? 'user object' : 'null');

      if (!user) {
        console.warn('[GoogleAuth] Sign-in returned null (cancelled or failed)');
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name || user.displayName || '',
        givenName: user.givenName,
        familyName: user.familyName,
        imageUrl: user.imageUrl,
        idToken: user.authentication?.idToken
      };
    } catch (error: any) {
      // Check for common error codes
      if (error?.message?.includes('12501') || error?.code === 12501) {
        console.log('[GoogleAuth] User cancelled sign-in');
        return null;
      }
      if (error?.message?.includes('10') || error?.code === 10) {
        console.error('[GoogleAuth] DEVELOPER_ERROR - Check SHA-1 fingerprint and client ID configuration');
      }
      console.error('[GoogleAuth] Sign in failed:', error);
      throw error; // Re-throw to show error to user
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    if (this.isNative() && this.googleAuth) {
      try {
        await this.googleAuth.signOut();
        console.log('[GoogleAuth] Signed out (native)');
      } catch (error) {
        console.error('[GoogleAuth] Sign out failed:', error);
      }
    } else if ((window as any).google) {
      try {
        (window as any).google.accounts.id.disableAutoSelect();
        console.log('[GoogleAuth] Signed out (web)');
      } catch (error) {
        console.error('[GoogleAuth] Web sign out failed:', error);
      }
    }
  }

  /**
   * Refresh tokens (native only)
   */
  async refresh(): Promise<GoogleUser | null> {
    if (!this.isNative() || !this.googleAuth) {
      return null;
    }

    try {
      const user = await this.googleAuth.refresh();
      return {
        id: user.id,
        email: user.email,
        name: user.name || user.displayName || '',
        givenName: user.givenName,
        familyName: user.familyName,
        imageUrl: user.imageUrl,
        idToken: user.authentication?.idToken
      };
    } catch (error) {
      console.error('[GoogleAuth] Refresh failed:', error);
      return null;
    }
  }
}

export const googleAuthService = new GoogleAuthService();
