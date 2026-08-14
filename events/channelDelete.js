const { Events, AuditLogEvent } = require('discord.js');
const { getSettings } = require('../../utils/cacheManager');
const { addToQueue } = require('../../utils/actionQueue');
const { punishAndLog, checkBypass } = require('../utils/guardHelper');
const messages = require('../../messages.json');

module.exports = {
    name: Events.ChannelDelete,
    async execute(channel, client) {
        // Sadece sunucu kanallarını dinle
        if (!channel.guild) return;

        try {
            const settings = getSettings(channel.guild.id);
            if (!settings || !settings.antiChannel) return;

            // Logun düşmesi için kısa bir süre bekle (Race condition önlemi)
            await new Promise(resolve => setTimeout(resolve, 1500));

            const auditLogs = await channel.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelDelete, limit: 5 }).catch(() => null);
            if (!auditLogs) return;

            // Son 5 log içinde sildiğimiz kanalı bul
            const logEntry = auditLogs.entries.find(entry => entry.target.id === channel.id);
            if (!logEntry) return;

            const executorId = logEntry.executorId;

            if (await checkBypass(executorId, channel.guild, settings, client)) return;

            addToQueue(async () => {
                await punishAndLog(
                    channel.guild,
                    executorId,
                    settings,
                    messages.events.antiChannel.logTitle,
                    messages.events.antiChannel.logDescription,
                    [{ name: messages.events.antiChannel.fieldDeletedChannel, value: `\`${channel.name}\` (\`${channel.id}\`)`, inline: false }]
                );

                // Kanalı geri oluştur
                await channel.guild.channels.create({
                    name: channel.name,
                    type: channel.type,
                    topic: channel.topic,
                    nsfw: channel.nsfw,
                    bitrate: channel.bitrate,
                    userLimit: channel.userLimit,
                    parent: channel.parentId,
                    permissionOverwrites: channel.permissionOverwrites.cache.map(overwrite => ({
                        id: overwrite.id,
                        allow: overwrite.allow.bitfield,
                        deny: overwrite.deny.bitfield,
                        type: overwrite.type
                    })),
                    position: channel.rawPosition,
                    reason: messages.events.antiChannel.restoreReason
                }).catch(err => console.error('Kanal geri açma hatası:', err));
            });

        } catch (error) {
            console.error('Anti-Channel Delete Hatası:', error);
        }
    },
};
