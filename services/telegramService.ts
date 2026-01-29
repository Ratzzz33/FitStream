/**
 * Telegram Web App Service for FitStream
 * Provides integration with Telegram Mini App platform
 */

// Telegram Web App types
interface TelegramWebApp {
    initData: string;
    initDataUnsafe: {
        query_id?: string;
        user?: TelegramUser;
        auth_date?: number;
        hash?: string;
        start_param?: string;
    };
    version: string;
    platform: string;
    colorScheme: 'light' | 'dark';
    themeParams: {
        bg_color?: string;
        text_color?: string;
        hint_color?: string;
        link_color?: string;
        button_color?: string;
        button_text_color?: string;
        secondary_bg_color?: string;
    };
    isExpanded: boolean;
    viewportHeight: number;
    viewportStableHeight: number;
    headerColor: string;
    backgroundColor: string;
    isClosingConfirmationEnabled: boolean;
    BackButton: TelegramBackButton;
    MainButton: TelegramMainButton;
    HapticFeedback: TelegramHapticFeedback;
    ready: () => void;
    expand: () => void;
    close: () => void;
    sendData: (data: string) => void;
    openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
    openTelegramLink: (url: string) => void;
    showPopup: (params: PopupParams, callback?: (buttonId: string) => void) => void;
    showAlert: (message: string, callback?: () => void) => void;
    showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
    enableClosingConfirmation: () => void;
    disableClosingConfirmation: () => void;
    onEvent: (eventType: string, callback: () => void) => void;
    offEvent: (eventType: string, callback: () => void) => void;
    setHeaderColor: (color: string) => void;
    setBackgroundColor: (color: string) => void;
}

interface TelegramUser {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    is_premium?: boolean;
    photo_url?: string;
}

interface TelegramBackButton {
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
}

interface TelegramMainButton {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    setText: (text: string) => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: (leaveActive?: boolean) => void;
    hideProgress: () => void;
    setParams: (params: {
        text?: string;
        color?: string;
        text_color?: string;
        is_active?: boolean;
        is_visible?: boolean;
    }) => void;
}

interface TelegramHapticFeedback {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
}

interface PopupParams {
    title?: string;
    message: string;
    buttons?: Array<{
        id?: string;
        type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
        text?: string;
    }>;
}

// Extend Window interface
declare global {
    interface Window {
        Telegram?: {
            WebApp: TelegramWebApp;
        };
    }
}

/**
 * Check if running inside Telegram Mini App
 */
export function isTelegramWebApp(): boolean {
    return !!(window.Telegram?.WebApp?.initData);
}

/**
 * Get the Telegram WebApp instance
 */
export function getTelegramWebApp(): TelegramWebApp | null {
    return window.Telegram?.WebApp || null;
}

/**
 * Get the current Telegram user
 */
export function getTelegramUser(): TelegramUser | null {
    const webapp = getTelegramWebApp();
    return webapp?.initDataUnsafe?.user || null;
}

/**
 * Generate a unique user ID from Telegram user data
 */
export function getTelegramUserId(): string | null {
    const user = getTelegramUser();
    if (!user) return null;
    return `tg_${user.id}`;
}

/**
 * Initialize the Telegram Mini App
 */
export function initTelegramApp(): void {
    const webapp = getTelegramWebApp();
    if (!webapp) return;

    // Tell Telegram the app is ready
    webapp.ready();

    // Expand to full height
    webapp.expand();

    // Match app theme to Telegram theme
    const theme = webapp.colorScheme;
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

/**
 * Show the main button with custom text and callback
 */
export function showMainButton(text: string, onClick: () => void): void {
    const webapp = getTelegramWebApp();
    if (!webapp) return;

    webapp.MainButton.setText(text);
    webapp.MainButton.onClick(onClick);
    webapp.MainButton.show();
}

/**
 * Hide the main button
 */
export function hideMainButton(): void {
    const webapp = getTelegramWebApp();
    if (!webapp) return;

    webapp.MainButton.hide();
}

/**
 * Update main button state
 */
export function updateMainButton(params: {
    text?: string;
    color?: string;
    textColor?: string;
    isActive?: boolean;
    showProgress?: boolean;
}): void {
    const webapp = getTelegramWebApp();
    if (!webapp) return;

    if (params.text) webapp.MainButton.setText(params.text);
    if (params.color) webapp.MainButton.color = params.color;
    if (params.textColor) webapp.MainButton.textColor = params.textColor;
    if (params.isActive !== undefined) {
        params.isActive ? webapp.MainButton.enable() : webapp.MainButton.disable();
    }
    if (params.showProgress !== undefined) {
        params.showProgress ? webapp.MainButton.showProgress() : webapp.MainButton.hideProgress();
    }
}

/**
 * Show the back button
 */
export function showBackButton(onClick: () => void): void {
    const webapp = getTelegramWebApp();
    if (!webapp) return;

    webapp.BackButton.onClick(onClick);
    webapp.BackButton.show();
}

/**
 * Hide the back button
 */
export function hideBackButton(): void {
    const webapp = getTelegramWebApp();
    if (!webapp) return;

    webapp.BackButton.hide();
}

/**
 * Trigger haptic feedback
 */
export function hapticFeedback(type: 'impact' | 'notification' | 'selection', style?: string): void {
    const webapp = getTelegramWebApp();
    if (!webapp) return;

    switch (type) {
        case 'impact':
            webapp.HapticFeedback.impactOccurred(style as 'light' | 'medium' | 'heavy' || 'medium');
            break;
        case 'notification':
            webapp.HapticFeedback.notificationOccurred(style as 'error' | 'success' | 'warning' || 'success');
            break;
        case 'selection':
            webapp.HapticFeedback.selectionChanged();
            break;
    }
}

/**
 * Show a popup/alert
 */
export function showPopup(message: string, title?: string): Promise<string> {
    return new Promise((resolve) => {
        const webapp = getTelegramWebApp();
        if (!webapp) {
            alert(message);
            resolve('ok');
            return;
        }

        webapp.showPopup({
            title,
            message,
            buttons: [{ type: 'ok' }]
        }, (buttonId) => {
            resolve(buttonId || 'ok');
        });
    });
}

/**
 * Show a confirmation dialog
 */
export function showConfirm(message: string): Promise<boolean> {
    return new Promise((resolve) => {
        const webapp = getTelegramWebApp();
        if (!webapp) {
            resolve(confirm(message));
            return;
        }

        webapp.showConfirm(message, (confirmed) => {
            resolve(confirmed);
        });
    });
}

/**
 * Close the Mini App
 */
export function closeApp(): void {
    const webapp = getTelegramWebApp();
    if (!webapp) return;

    webapp.close();
}

/**
 * Open an external link
 */
export function openLink(url: string, instantView = false): void {
    const webapp = getTelegramWebApp();
    if (!webapp) {
        window.open(url, '_blank');
        return;
    }

    webapp.openLink(url, { try_instant_view: instantView });
}

/**
 * Open a Telegram link (channels, users, etc.)
 */
export function openTelegramLink(url: string): void {
    const webapp = getTelegramWebApp();
    if (!webapp) {
        window.open(url, '_blank');
        return;
    }

    webapp.openTelegramLink(url);
}

/**
 * Get the current color scheme
 */
export function getColorScheme(): 'light' | 'dark' {
    const webapp = getTelegramWebApp();
    return webapp?.colorScheme || 'light';
}

/**
 * Get theme parameters
 */
export function getThemeParams(): TelegramWebApp['themeParams'] | null {
    const webapp = getTelegramWebApp();
    return webapp?.themeParams || null;
}

/**
 * Set header color
 */
export function setHeaderColor(color: string): void {
    const webapp = getTelegramWebApp();
    if (!webapp) return;

    webapp.setHeaderColor(color);
}

/**
 * Set background color
 */
export function setBackgroundColor(color: string): void {
    const webapp = getTelegramWebApp();
    if (!webapp) return;

    webapp.setBackgroundColor(color);
}

/**
 * Enable closing confirmation
 */
export function enableClosingConfirmation(): void {
    const webapp = getTelegramWebApp();
    if (!webapp) return;

    webapp.enableClosingConfirmation();
}

/**
 * Disable closing confirmation
 */
export function disableClosingConfirmation(): void {
    const webapp = getTelegramWebApp();
    if (!webapp) return;

    webapp.disableClosingConfirmation();
}

/**
 * Get init data for backend verification
 */
export function getInitData(): string {
    const webapp = getTelegramWebApp();
    return webapp?.initData || '';
}

/**
 * Get the Telegram chat ID (for linking)
 */
export function getTelegramChatId(): number | null {
    const user = getTelegramUser();
    return user?.id || null;
}

/**
 * Check if user has Telegram Premium
 */
export function isTelegramPremium(): boolean {
    const user = getTelegramUser();
    return user?.is_premium || false;
}

/**
 * Get viewport info
 */
export function getViewport(): { height: number; stableHeight: number } {
    const webapp = getTelegramWebApp();
    return {
        height: webapp?.viewportHeight || window.innerHeight,
        stableHeight: webapp?.viewportStableHeight || window.innerHeight
    };
}

/**
 * Subscribe to viewport changes
 */
export function onViewportChanged(callback: () => void): void {
    const webapp = getTelegramWebApp();
    if (!webapp) return;

    webapp.onEvent('viewportChanged', callback);
}

/**
 * Subscribe to theme changes
 */
export function onThemeChanged(callback: () => void): void {
    const webapp = getTelegramWebApp();
    if (!webapp) return;

    webapp.onEvent('themeChanged', callback);
}

// Export all functions as a service object for convenience
export const TelegramService = {
    isTelegramWebApp,
    getTelegramWebApp,
    getTelegramUser,
    getTelegramUserId,
    getTelegramChatId,
    initTelegramApp,
    showMainButton,
    hideMainButton,
    updateMainButton,
    showBackButton,
    hideBackButton,
    hapticFeedback,
    showPopup,
    showConfirm,
    closeApp,
    openLink,
    openTelegramLink,
    getColorScheme,
    getThemeParams,
    setHeaderColor,
    setBackgroundColor,
    enableClosingConfirmation,
    disableClosingConfirmation,
    getInitData,
    isTelegramPremium,
    getViewport,
    onViewportChanged,
    onThemeChanged
};
