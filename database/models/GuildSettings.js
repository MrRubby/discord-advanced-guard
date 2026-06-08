const mongoose = require('mongoose');

const guildSettingsSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    ban_auth_role: { type: String, default: null },
    kick_auth_role: { type: String, default: null },
    jail_auth_role: { type: String, default: null },
    muter_auth_role: { type: String, default: null },
    guard_log_channel: { type: String, default: null },
    jail_role: { type: String, default: null },
    antiRaid: { type: Boolean, default: false },
    antiRole: { type: Boolean, default: false },
    antiChannel: { type: Boolean, default: false },
    whitelist: { type: [String], default: [] },
    daily_ban_limit: { type: Number, default: 3 },
    antiRaid_account_age_days: { type: Number, default: 3 },
    panicMode: { type: Boolean, default: false },
    filter_swear: { type: Boolean, default: false },
    filter_link: { type: Boolean, default: false },
    filter_bypass_roles: { type: [String], default: [] },
    custom_blocked_words: { type: [String], default: [] },
    guard_webhook: { type: Boolean, default: true }
});

module.exports = mongoose.model('GuildSettings', guildSettingsSchema);
