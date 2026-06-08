const { Events, AuditLogEvent } = require('discord.js');
const { getSettings } = require('../../utils/cacheManager');
const { addToQueue } = require('../../utils/actionQueue');
const { punishAndLog, checkBypass } = require('../utils/guardHelper');

module.exports = {
    name: Events.ChannelCreate,
    async execute(channel, client) {
        if (!channel.guild) return;

        try {
            const settings = getSettings(channel.guild.id);
            if (!settings || !settings.antiChannel) return;

            const auditLogs = await channel.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelCreate, limit: 1 }).catch(() => null);
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
                    'Güvenlik İhlali: Kanal Oluşturulması (Anti-Channel)',
                    'Bir yetkili izinsiz şekilde kanal oluşturduğu için rolleri alındı ve yeni kanal silindi!',
                    [{ name: '➕ Oluşturulan Kanal', value: `\`${channel.name}\` (\`${channel.id}\`)`, inline: false }]
                );

                await channel.delete('Guard Bot: İzinsiz kanal oluşturulması engellendi.').catch(() => null);
            });

        } catch (error) {
            console.error('Anti-Channel Create Hatası:', error);
        }
    },
};
