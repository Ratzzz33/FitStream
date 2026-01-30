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
            clientId: '1025917117754-lm4epakgpqvotb36cm3ppcgpvrktnesj.apps.googleusercontent.com',
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
      if (!this.googleAuth) {
        this.googleAuth = await getGoogleAuthPlugin();
      }

      if (!this.googleAuth) {
        throw new Error('Google Auth plugin not available');
      }

      await this.initialize();
      const user = await this.googleAuth.signIn();

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
      console.error('[GoogleAuth] Sign in failed:', error);
      return null;
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
