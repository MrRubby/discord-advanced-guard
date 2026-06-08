const mongoose = require('mongoose');

const moderatorStatSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    userId: { type: String, required: true },
    date: { type: String, required: true }, // Format: 'YYYY-MM-DD'
    banCount: { type: Number, default: 0 }
});

// A moderator should only have one record per day per guild
moderatorStatSchema.index({ guildId: 1, userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('ModeratorStat', moderatorStatSchema);
