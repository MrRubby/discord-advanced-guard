const { Events, AuditLogEvent } = require('discord.js');
const { getSettings } = require('../../utils/cacheManager');
const { addToQueue } = require('../../utils/actionQueue');
const { punishAndLog, checkBypass } = require('../utils/guardHelper');

module.exports = {
    name: Events.GuildRoleCreate,
    async execute(role, client) {
        try {
            const settings = getSettings(role.guild.id);
            if (!settings || !settings.antiRole) return;

            // Fetch the audit logs to find the executor
            const auditLogs = await role.guild.fetchAuditLogs({ type: AuditLogEvent.RoleCreate, limit: 1 }).catch(() => null);
            if (!auditLogs) return;

            const logEntry = auditLogs.entries.first();
            if (!logEntry || logEntry.target.id !== role.id) return; // if it's not the exact role

            const executorId = logEntry.executorId;

            // Check bypass
            if (await checkBypass(executorId, role.guild, settings, client)) return;

            addToQueue(async () => {
                // Punish and Log
                await punishAndLog(
                    role.guild,
                    executorId,
                    settings,
                    'Güvenlik İhlali: Rol Oluşturulması (Anti-Role)',
                    'Bir yetkili izinsiz şekilde rol oluşturduğu için rolleri alındı ve oluşturulan rol silindi!',
                    [{ name: '➕ Oluşturulan Rol', value: `\`${role.name}\` (\`${role.id}\`)`, inline: false }]
                );

                // Delete the created role
                await role.delete('Guard Bot: İzinsiz rol oluşturulması engellendi.').catch(() => null);
            });

        } catch (error) {
            console.error('Anti-Role Create Hatası:', error);
        }
    },
};
