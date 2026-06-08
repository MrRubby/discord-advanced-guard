const { Collection } = require('discord.js');
const GuildSettings = require('../database/models/GuildSettings');

const settingsCache = new Collection();

async function loadAllSettings() {
    try {
        const allSettings = await GuildSettings.find();
        for (const setting of allSettings) {
            settingsCache.set(setting.guildId, setting.toObject());
        }
        console.log(`${settingsCache.size} sunucu ayarı belleğe (Cache) başarıyla yüklendi.`);
    } catch (error) {
        console.error('Cache yüklenirken hata oluştu:', error);
    }
}

function getSettings(guildId) {
    return settingsCache.get(guildId) || null;
}

function updateSettingsCache(guildId, newSettings) {
    const obj = newSettings.toObject ? newSettings.toObject() : newSettings;
    settingsCache.set(guildId, obj);
}

module.exports = {
    settingsCache,
    loadAllSettings,
    getSettings,
    updateSettingsCache
};
