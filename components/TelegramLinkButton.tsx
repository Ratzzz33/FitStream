import React, { useState, useEffect } from 'react';
import { Send, Check, X, Loader2, Bell, BellOff, Copy, ExternalLink } from 'lucide-react';
import { ApiService } from '../services/api';
import { isTelegramWebApp, getTelegramUser, getTelegramChatId, getInitData } from '../services/telegramService';
import { t } from '../services/i18n';

interface TelegramLinkButtonProps {
    userId: string;
    backendUrl?: string;
    onLinked?: () => void;
}

interface TelegramStatus {
    linked: boolean;
    username?: string;
    notificationsEnabled?: boolean;
}

const TelegramLinkButton: React.FC<TelegramLinkButtonProps> = ({ userId, backendUrl, onLinked }) => {
    const [status, setStatus] = useState<TelegramStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [linkCode, setLinkCode] = useState<string | null>(null);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [isLinking, setIsLinking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [autoLinkFailed, setAutoLinkFailed] = useState(false);

    const isTgApp = isTelegramWebApp();

    // Fetch current status
    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const url = getEffectiveUrl(backendUrl);
                const response = await fetch(`${url}/telegram/status?userId=${encodeURIComponent(userId)}`);
                if (response.ok) {
                    const data = await response.json();
                    setStatus(data);
                }
            } catch (e) {
                console.error('Failed to fetch Telegram status:', e);
            } finally {
                setLoading(false);
            }
        };

        if (userId) fetchStatus();
    }, [userId, backendUrl]);

    const getEffectiveUrl = (customUrl?: string) => {
        const DEFAULT_API_URL = 'https://api.fitstream.health/api';
        if (customUrl && customUrl.trim().length > 0) {
            let url = customUrl.trim();
            if (url.endsWith('/')) url = url.slice(0, -1);
            if (!url.endsWith('/api')) url += '/api';
            return url;
        }
        return DEFAULT_API_URL;
    };

    // Auto-link if running inside Telegram Mini App
    useEffect(() => {
        const autoLink = async () => {
            if (!isTgApp || !userId || status?.linked) return;

            const tgUser = getTelegramUser();
            const chatId = getTelegramChatId();
            if (!tgUser || !chatId) {
                setAutoLinkFailed(true);
                return;
            }

            setIsLinking(true);
            setAutoLinkFailed(false);
            try {
                const url = getEffectiveUrl(backendUrl);
                const response = await fetch(`${url}/telegram/link`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId,
                        chatId,
                        username: tgUser.username,
                        initData: getInitData()
                    })
                });

                if (response.ok) {
                    setStatus({ linked: true, username: tgUser.username, notificationsEnabled: true });
                    setAutoLinkFailed(false);
                    onLinked?.();
                } else {
                    setAutoLinkFailed(true);
                }
            } catch (e) {
                console.error('Auto-link failed:', e);
                setAutoLinkFailed(true);
            } finally {
                setIsLinking(false);
            }
        };

        if (status !== null && !status.linked) {
            autoLink();
        }
    }, [isTgApp, userId, status, backendUrl, onLinked]);

    const handleGenerateCode = async () => {
        setError(null);
        setIsLinking(true);

        try {
            const url = getEffectiveUrl(backendUrl);
            const response = await fetch(`${url}/telegram/link-code?userId=${encodeURIComponent(userId)}`);
            const data = await response.json();

            if (data.alreadyLinked) {
                setStatus({ linked: true });
                return;
            }

            if (data.code) {
                setLinkCode(data.code);
                setShowLinkModal(true);
            } else {
                setError('Failed to generate code');
            }
        } catch (e) {
            setError('Server unavailable');
        } finally {
            setIsLinking(false);
        }
    };

    const handleUnlink = async () => {
        if (!confirm('Unlink Telegram? You will stop receiving notifications.')) return;

        setIsLinking(true);
        try {
            const url = getEffectiveUrl(backendUrl);
            await fetch(`${url}/telegram/unlink`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            setStatus({ linked: false });
        } catch (e) {
            console.error('Unlink failed:', e);
        } finally {
            setIsLinking(false);
        }
    };

    const toggleNotifications = async () => {
        if (!status) return;

        const newValue = !status.notificationsEnabled;
        try {
            const url = getEffectiveUrl(backendUrl);
            await fetch(`${url}/telegram/notifications`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, enabled: newValue })
            });
            setStatus({ ...status, notificationsEnabled: newValue });
        } catch (e) {
            console.error('Toggle notifications failed:', e);
        }
    };

    const copyCode = () => {
        if (linkCode) {
            navigator.clipboard.writeText(linkCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const openBot = () => {
        window.open('https://t.me/fitstreambot', '_blank');
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center justify-center gap-2 text-gray-500">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-sm">Loading...</span>
                </div>
            </div>
        );
    }

    // Retry auto-link handler for TG Mini App
    const handleRetryAutoLink = async () => {
        const tgUser = getTelegramUser();
        const chatId = getTelegramChatId();
        if (!tgUser || !chatId) return;

        setIsLinking(true);
        setAutoLinkFailed(false);
        try {
            const url = getEffectiveUrl(backendUrl);
            const response = await fetch(`${url}/telegram/link`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    chatId,
                    username: tgUser.username,
                    initData: getInitData()
                })
            });

            if (response.ok) {
                setStatus({ linked: true, username: tgUser.username, notificationsEnabled: true });
                onLinked?.();
            } else {
                setAutoLinkFailed(true);
            }
        } catch (e) {
            console.error('Auto-link retry failed:', e);
            setAutoLinkFailed(true);
        } finally {
            setIsLinking(false);
        }
    };

    // Inside Telegram - show status only
    if (isTgApp) {
        const getStatusText = () => {
            if (status?.linked) return 'Connected & receiving notifications';
            if (isLinking) return 'Connecting...';
            if (autoLinkFailed) return 'Connection failed. Tap to retry';
            return 'Connecting...';
        };

        const getStatusColor = () => {
            if (status?.linked) return 'text-green-500';
            if (autoLinkFailed) return 'text-red-500';
            return 'text-gray-500 dark:text-gray-400';
        };

        return (
            <div
                className={`bg-gradient-to-r from-blue-500/10 to-cyan-500/10 dark:from-blue-900/30 dark:to-cyan-900/30 p-4 rounded-xl border border-blue-500/30 ${autoLinkFailed && !isLinking ? 'cursor-pointer hover:from-blue-500/20 hover:to-cyan-500/20' : ''}`}
                onClick={autoLinkFailed && !isLinking ? handleRetryAutoLink : undefined}
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg text-white ${autoLinkFailed ? 'bg-red-500' : 'bg-blue-500'}`}>
                        <Send size={20} />
                    </div>
                    <div className="flex-1">
                        <p className="font-bold text-gray-900 dark:text-white">Telegram Mini App</p>
                        <p className={`text-xs ${getStatusColor()}`}>
                            {getStatusText()}
                        </p>
                    </div>
                    {status?.linked && (
                        <Check size={20} className="text-green-500" />
                    )}
                    {isLinking && (
                        <Loader2 size={20} className="text-blue-500 animate-spin" />
                    )}
                    {autoLinkFailed && !isLinking && (
                        <X size={20} className="text-red-500" />
                    )}
                </div>
            </div>
        );
    }

    // Linked state
    if (status?.linked) {
        return (
            <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                    <h4 className="text-gray-900 dark:text-white font-bold flex items-center gap-2">
                        <Send size={16} className="text-blue-500" /> Telegram
                    </h4>
                    <span className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                        <Check size={12} /> Linked
                    </span>
                </div>

                <div className="space-y-3">
                    {status.username && (
                        <p className="text-sm text-gray-600 dark:text-gray-300">@{status.username}</p>
                    )}

                    <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-950 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                            {status.notificationsEnabled ? (
                                <Bell size={16} className="text-blue-500" />
                            ) : (
                                <BellOff size={16} className="text-gray-400" />
                            )}
                            <span className="text-sm text-gray-700 dark:text-gray-300">Notifications</span>
                        </div>
                        <button
                            onClick={toggleNotifications}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                                status.notificationsEnabled
                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                            }`}
                        >
                            {status.notificationsEnabled ? 'On' : 'Off'}
                        </button>
                    </div>

                    <button
                        onClick={handleUnlink}
                        disabled={isLinking}
                        className="w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 py-2 rounded-lg text-sm font-medium transition"
                    >
                        Unlink Account
                    </button>
                </div>
            </div>
        );
    }

    // Not linked state
    return (
        <>
            <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                    <h4 className="text-gray-900 dark:text-white font-bold flex items-center gap-2">
                        <Send size={16} className="text-blue-500" /> Telegram
                    </h4>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Link your Telegram to receive workout reminders, goal achievements, and streak notifications.
                </p>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs p-2 rounded mb-3">
                        {error}
                    </div>
                )}

                <button
                    onClick={handleGenerateCode}
                    disabled={isLinking}
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
                >
                    {isLinking ? (
                        <Loader2 size={18} className="animate-spin" />
                    ) : (
                        <>
                            <Send size={18} />
                            Link Telegram
                        </>
                    )}
                </button>
            </div>

            {/* Link Code Modal */}
            {showLinkModal && linkCode && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm border border-gray-200 dark:border-gray-800 shadow-2xl animate-in zoom-in duration-200">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Send size={18} className="text-blue-500" /> Link Telegram
                            </h3>
                            <button
                                onClick={() => setShowLinkModal(false)}
                                className="text-gray-500 hover:text-gray-900 dark:hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="text-center">
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                                    1. Open @fitstreambot in Telegram<br />
                                    2. Send this code:
                                </p>

                                <div className="bg-gray-100 dark:bg-gray-950 p-4 rounded-xl border border-gray-200 dark:border-gray-700 mb-4">
                                    <div className="flex items-center justify-center gap-3">
                                        <code className="text-2xl font-mono font-bold tracking-widest text-blue-600 dark:text-blue-400">
                                            {linkCode}
                                        </code>
                                        <button
                                            onClick={copyCode}
                                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition"
                                        >
                                            {copied ? (
                                                <Check size={18} className="text-green-500" />
                                            ) : (
                                                <Copy size={18} className="text-gray-500" />
                                            )}
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Send: /link {linkCode}
                                    </p>
                                </div>

                                <p className="text-xs text-gray-500 mb-4">
                                    Code expires in 10 minutes
                                </p>
                            </div>

                            <button
                                onClick={openBot}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
                            >
                                <ExternalLink size={18} />
                                Open @fitstreambot
                            </button>

                            <button
                                onClick={() => setShowLinkModal(false)}
                                className="w-full text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 py-2 text-sm"
                            >
                                I'll do it later
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default TelegramLinkButton;
