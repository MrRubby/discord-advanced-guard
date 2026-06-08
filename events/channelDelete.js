const { Events, AuditLogEvent } = require('discord.js');
const { getSettings } = require('../../utils/cacheManager');
const { addToQueue } = require('../../utils/actionQueue');
const { punishAndLog, checkBypass } = require('../utils/guardHelper');

module.exports = {
    name: Events.ChannelDelete,
    async execute(channel, client) {
        // Sadece sunucu kanallarını dinle
        if (!channel.guild) return;

        try {
            const settings = getSettings(channel.guild.id);
            if (!settings || !settings.antiChannel) return;

            const auditLogs = await channel.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelDelete, limit: 1 }).catch(() => null);
            if (!auditLogs) return;

            const logEntry = auditLogs.entries.first();
            if (!logEntry || logEntry.target.id !== channel.id) return;

            const executorId = logEntry.executorId;

            if (await checkBypass(executorId, channel.guild, settings, client)) return;

            addToQueue(async () => {
                await punishAndLog(
                    channel.guild,
                    executorId,
                    settings,
                    'Güvenlik İhlali: Kanal Silinmesi (Anti-Channel)',
                    'Bir yetkili izinsiz şekilde kanal sildiği için rolleri alındı ve kanal aynı özelliklerle geri açıldı!',
                    [{ name: '❌ Silinen Kanal', value: `\`${channel.name}\` (\`${channel.id}\`)`, inline: false }]
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
                    reason: 'Guard Bot: Silinen kanal geri yüklendi.'
                }).catch(err => console.error('Kanal geri açma hatası:', err));
            });

        } catch (error) {
            console.error('Anti-Channel Delete Hatası:', error);
        }
    },
};
