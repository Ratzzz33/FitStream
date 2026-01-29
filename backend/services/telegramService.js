/**
 * Telegram Bot Service for FitStream
 * Handles bot commands, notifications, and account linking
 */

const TelegramBot = require('node-telegram-bot-api');
const crypto = require('crypto');

// In-memory store for link codes (in production, use Redis or DB)
const linkCodes = new Map(); // code -> { userId, expiresAt }

let bot = null;
let pool = null;

/**
 * Initialize the Telegram bot
 * @param {Object} dbPool - PostgreSQL connection pool
 * @returns {TelegramBot|null} - Bot instance or null if not configured
 */
function initBot(dbPool) {
    const token = process.env.TELEGRAM_BOT_TOKEN;

    if (!token) {
        console.warn('TELEGRAM_BOT_TOKEN not set. Telegram features disabled.');
        return null;
    }

    pool = dbPool;

    // Create bot in polling mode for development, webhook for production
    const isProduction = process.env.NODE_ENV === 'production';

    bot = new TelegramBot(token, {
        polling: !isProduction
    });

    // Register command handlers
    bot.onText(/\/start/, handleStart);
    bot.onText(/\/link(?:\s+(.+))?/, handleLink);
    bot.onText(/\/unlink/, handleUnlink);
    bot.onText(/\/stats/, handleStats);
    bot.onText(/\/goals/, handleGoals);
    bot.onText(/\/help/, handleHelp);

    console.log('Telegram bot initialized successfully');

    return bot;
}

/**
 * Get the bot instance
 */
function getBot() {
    return bot;
}

/**
 * Handle /start command
 */
async function handleStart(msg) {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name || 'there';

    // Check if user is already linked
    const linkedUser = await getUserByTelegramChatId(chatId);

    if (linkedUser) {
        const name = linkedUser.settings?.name || 'Athlete';
        bot.sendMessage(chatId,
            `Welcome back, ${name}!\n\n` +
            `Your account is linked.\n\n` +
            `Commands:\n` +
            `/stats - View today's statistics\n` +
            `/goals - Check goal progress\n` +
            `/unlink - Unlink your account\n` +
            `/help - Show all commands`,
            { parse_mode: 'HTML' }
        );
    } else {
        bot.sendMessage(chatId,
            `Hello ${firstName}! Welcome to FitStream Bot.\n\n` +
            `To get started, link your FitStream account:\n\n` +
            `1. Open FitStream app\n` +
            `2. Go to Settings\n` +
            `3. Tap "Link Telegram"\n` +
            `4. Send the code here with /link CODE\n\n` +
            `Or open the Mini App to use FitStream directly in Telegram!`,
            {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[
                        {
                            text: 'Open FitStream Mini App',
                            web_app: { url: process.env.TELEGRAM_WEBAPP_URL || 'https://fitstream.health' }
                        }
                    ]]
                }
            }
        );
    }
}

/**
 * Handle /link command
 */
async function handleLink(msg, match) {
    const chatId = msg.chat.id;
    const code = match[1]?.trim();

    if (!code) {
        bot.sendMessage(chatId,
            `To link your account:\n\n` +
            `1. Open FitStream app\n` +
            `2. Go to Settings > Link Telegram\n` +
            `3. Copy the 6-digit code\n` +
            `4. Send: /link YOUR_CODE`
        );
        return;
    }

    // Check if already linked
    const existingUser = await getUserByTelegramChatId(chatId);
    if (existingUser) {
        bot.sendMessage(chatId, 'Your Telegram is already linked to a FitStream account. Use /unlink first if you want to link a different account.');
        return;
    }

    // Verify code
    const linkData = linkCodes.get(code.toUpperCase());

    if (!linkData) {
        bot.sendMessage(chatId, 'Invalid or expired code. Please generate a new one in the FitStream app.');
        return;
    }

    if (Date.now() > linkData.expiresAt) {
        linkCodes.delete(code.toUpperCase());
        bot.sendMessage(chatId, 'This code has expired. Please generate a new one in the FitStream app.');
        return;
    }

    // Link the account
    try {
        await pool.query(
            `UPDATE users SET telegram_chat_id = $1, telegram_username = $2 WHERE id = $3`,
            [chatId, msg.from.username || null, linkData.userId]
        );

        linkCodes.delete(code.toUpperCase());

        bot.sendMessage(chatId,
            `Successfully linked!\n\n` +
            `You'll now receive notifications for:\n` +
            `- Goal achievements\n` +
            `- Streak milestones\n` +
            `- Workout reminders\n\n` +
            `Use /stats to see your progress!`,
            { parse_mode: 'HTML' }
        );
    } catch (e) {
        console.error('Error linking Telegram account:', e);
        bot.sendMessage(chatId, 'An error occurred while linking. Please try again.');
    }
}

/**
 * Handle /unlink command
 */
async function handleUnlink(msg) {
    const chatId = msg.chat.id;

    try {
        const result = await pool.query(
            `UPDATE users SET telegram_chat_id = NULL, telegram_username = NULL WHERE telegram_chat_id = $1 RETURNING id`,
            [chatId]
        );

        if (result.rowCount > 0) {
            bot.sendMessage(chatId, 'Your account has been unlinked. You will no longer receive notifications.');
        } else {
            bot.sendMessage(chatId, 'Your Telegram is not linked to any FitStream account.');
        }
    } catch (e) {
        console.error('Error unlinking account:', e);
        bot.sendMessage(chatId, 'An error occurred. Please try again.');
    }
}

/**
 * Handle /stats command
 */
async function handleStats(msg) {
    const chatId = msg.chat.id;

    const user = await getUserByTelegramChatId(chatId);

    if (!user) {
        bot.sendMessage(chatId, 'Please link your account first with /link');
        return;
    }

    try {
        const today = new Date().toISOString().split('T')[0];

        // Get today's exercises
        const exercisesRes = await pool.query(
            `SELECT data FROM user_logs WHERE user_id = $1 AND category = 'EXERCISE' AND date = $2`,
            [user.id, today]
        );

        // Get today's nutrition
        const nutritionRes = await pool.query(
            `SELECT data FROM user_logs WHERE user_id = $1 AND category = 'NUTRITION' AND date = $2`,
            [user.id, today]
        );

        // Calculate totals
        const exercises = exercisesRes.rows.map(r => r.data);
        const totalReps = exercises.reduce((sum, e) => sum + (e.reps || 0), 0);
        const exerciseTypes = [...new Set(exercises.map(e => e.exerciseName))];

        const nutrition = nutritionRes.rows.map(r => r.data);
        const totalCalories = nutrition.reduce((sum, n) => sum + (n.calories || 0), 0);
        const waterIntake = nutrition.filter(n => n.type === 'WATER').reduce((sum, n) => sum + (n.amount || 0), 0);

        const name = user.settings?.name || 'Athlete';
        const streak = user.settings?.streak || 0;

        bot.sendMessage(chatId,
            `<b>${name}'s Stats for Today</b>\n\n` +
            `<b>Exercises:</b>\n` +
            `Total reps: ${totalReps}\n` +
            `Types: ${exerciseTypes.length > 0 ? exerciseTypes.join(', ') : 'None yet'}\n\n` +
            `<b>Nutrition:</b>\n` +
            `Calories: ${totalCalories} kcal\n` +
            `Water: ${waterIntake} ml\n\n` +
            `<b>Current streak: ${streak} days</b>`,
            { parse_mode: 'HTML' }
        );
    } catch (e) {
        console.error('Error fetching stats:', e);
        bot.sendMessage(chatId, 'Error fetching your stats. Please try again.');
    }
}

/**
 * Handle /goals command
 */
async function handleGoals(msg) {
    const chatId = msg.chat.id;

    const user = await getUserByTelegramChatId(chatId);

    if (!user) {
        bot.sendMessage(chatId, 'Please link your account first with /link');
        return;
    }

    const goals = user.settings?.goals || [];
    const enabledGoals = goals.filter(g => g.isEnabled);

    if (enabledGoals.length === 0) {
        bot.sendMessage(chatId, 'You have no active goals. Set them up in the FitStream app!');
        return;
    }

    let message = '<b>Daily Goals Progress</b>\n\n';

    for (const goal of enabledGoals) {
        const percent = Math.min(100, Math.round((goal.current / goal.target) * 100));
        const progressBar = getProgressBar(percent);
        const emoji = percent >= 100 ? '' : '';

        message += `${emoji} <b>${goal.type}</b>\n`;
        message += `${progressBar} ${goal.current}/${goal.target} ${goal.unit}\n\n`;
    }

    bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
}

/**
 * Handle /help command
 */
async function handleHelp(msg) {
    const chatId = msg.chat.id;

    bot.sendMessage(chatId,
        `<b>FitStream Bot Commands</b>\n\n` +
        `/start - Welcome message\n` +
        `/link CODE - Link your FitStream account\n` +
        `/unlink - Unlink your account\n` +
        `/stats - View today's statistics\n` +
        `/goals - Check goal progress\n` +
        `/help - Show this message\n\n` +
        `<b>Notifications</b>\n` +
        `When linked, you'll receive:\n` +
        `- Goal completion alerts\n` +
        `- Streak milestone celebrations\n` +
        `- Daily workout reminders`,
        { parse_mode: 'HTML' }
    );
}

/**
 * Generate a link code for a user
 * @param {string} userId - FitStream user ID
 * @returns {string} - 6-character code
 */
function generateLinkCode(userId) {
    // Clean up expired codes
    for (const [code, data] of linkCodes.entries()) {
        if (Date.now() > data.expiresAt) {
            linkCodes.delete(code);
        }
    }

    // Generate 6-char alphanumeric code
    const code = crypto.randomBytes(3).toString('hex').toUpperCase();

    // Store with 10-minute expiry
    linkCodes.set(code, {
        userId,
        expiresAt: Date.now() + 10 * 60 * 1000
    });

    return code;
}

/**
 * Verify and consume a link code
 * @param {string} code - The link code
 * @returns {{ userId: string } | null} - User data or null if invalid
 */
function verifyLinkCode(code) {
    const data = linkCodes.get(code.toUpperCase());

    if (!data || Date.now() > data.expiresAt) {
        return null;
    }

    return { userId: data.userId };
}

/**
 * Send a notification to a user
 * @param {string} userId - FitStream user ID
 * @param {string} type - Notification type
 * @param {Object} data - Notification data
 */
async function sendNotification(userId, type, data = {}) {
    if (!bot || !pool) return false;

    try {
        const result = await pool.query(
            `SELECT telegram_chat_id, telegram_notifications, settings FROM users WHERE id = $1`,
            [userId]
        );

        const user = result.rows[0];

        if (!user || !user.telegram_chat_id || user.telegram_notifications === false) {
            return false;
        }

        const chatId = user.telegram_chat_id;
        const name = user.settings?.name || 'Athlete';
        let message = '';

        switch (type) {
            case 'GOAL_COMPLETED':
                message = `Congratulations, ${name}!\n\nYou've completed your ${data.goalType} goal: ${data.current}/${data.target} ${data.unit}!\n\nKeep up the great work!`;
                break;

            case 'STREAK_MILESTONE':
                const streakEmojis = {
                    7: '',
                    14: '',
                    30: '',
                    60: '',
                    90: '',
                    100: '',
                    365: ''
                };
                const emoji = streakEmojis[data.streak] || '';
                message = `${emoji} ${data.streak} days streak!\n\n${name}, you're on fire! Keep the momentum going!`;
                break;

            case 'WORKOUT_REMINDER':
                message = `Hey ${name}!\n\nTime to get moving! Your streak is at ${data.streak} days - don't break it now!\n\nOpen FitStream and start your workout!`;
                break;

            case 'WEIGHT_LOGGED':
                message = `Weight logged: ${data.weight} kg\n\n`;
                if (data.targetWeight) {
                    const diff = data.weight - data.targetWeight;
                    if (Math.abs(diff) < 0.5) {
                        message += `You've reached your target weight! Amazing!`;
                    } else if (diff > 0) {
                        message += `${diff.toFixed(1)} kg to go. You've got this!`;
                    } else {
                        message += `${Math.abs(diff).toFixed(1)} kg below target. Great progress!`;
                    }
                }
                break;

            case 'PRO_ACTIVATED':
                message = `Welcome to FitStream PRO, ${name}!\n\nYou now have:\n- Unlimited workouts\n- All exercise types\n- Advanced analytics\n- Priority support\n\nEnjoy your premium experience!`;
                break;

            default:
                message = data.message || 'Notification from FitStream';
        }

        await bot.sendMessage(chatId, message, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [[
                    {
                        text: 'Open FitStream',
                        web_app: { url: process.env.TELEGRAM_WEBAPP_URL || 'https://fitstream.health' }
                    }
                ]]
            }
        });

        return true;
    } catch (e) {
        console.error('Error sending Telegram notification:', e);
        return false;
    }
}

/**
 * Get user by Telegram chat ID
 */
async function getUserByTelegramChatId(chatId) {
    if (!pool) return null;

    try {
        const result = await pool.query(
            `SELECT id, settings, is_pro FROM users WHERE telegram_chat_id = $1`,
            [chatId]
        );
        return result.rows[0] || null;
    } catch (e) {
        console.error('Error fetching user by chat ID:', e);
        return null;
    }
}

/**
 * Get user's Telegram chat ID by FitStream user ID
 */
async function getTelegramChatIdByUserId(userId) {
    if (!pool) return null;

    try {
        const result = await pool.query(
            `SELECT telegram_chat_id FROM users WHERE id = $1`,
            [userId]
        );
        return result.rows[0]?.telegram_chat_id || null;
    } catch (e) {
        console.error('Error fetching chat ID:', e);
        return null;
    }
}

/**
 * Link Telegram account to FitStream user
 */
async function linkTelegramAccount(userId, chatId, username) {
    if (!pool) return false;

    try {
        await pool.query(
            `UPDATE users SET telegram_chat_id = $1, telegram_username = $2 WHERE id = $3`,
            [chatId, username || null, userId]
        );
        return true;
    } catch (e) {
        console.error('Error linking Telegram account:', e);
        return false;
    }
}

/**
 * Generate progress bar for goals
 */
function getProgressBar(percent) {
    const filled = Math.round(percent / 10);
    const empty = 10 - filled;
    return ''.repeat(filled) + ''.repeat(empty);
}

/**
 * Set up webhook for production
 */
async function setWebhook(webhookUrl) {
    if (!bot) return false;

    try {
        await bot.setWebHook(webhookUrl);
        console.log('Telegram webhook set to:', webhookUrl);
        return true;
    } catch (e) {
        console.error('Error setting webhook:', e);
        return false;
    }
}

/**
 * Process webhook update
 */
function processUpdate(update) {
    if (!bot) return;
    bot.processUpdate(update);
}

module.exports = {
    initBot,
    getBot,
    generateLinkCode,
    verifyLinkCode,
    sendNotification,
    getUserByTelegramChatId,
    getTelegramChatIdByUserId,
    linkTelegramAccount,
    setWebhook,
    processUpdate
};
