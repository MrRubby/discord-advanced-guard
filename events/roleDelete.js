const { Events, AuditLogEvent } = require('discord.js');
const { getSettings } = require('../../utils/cacheManager');
const { addToQueue } = require('../../utils/actionQueue');
const { punishAndLog, checkBypass } = require('../utils/guardHelper');

module.exports = {
    name: Events.GuildRoleDelete,
    async execute(role, client) {
        try {
            const settings = getSettings(role.guild.id);
            if (!settings || !settings.antiRole) return;

            // Fetch the audit logs to find the executor
            const auditLogs = await role.guild.fetchAuditLogs({ type: AuditLogEvent.RoleDelete, limit: 1 }).catch(() => null);
            if (!auditLogs) return;

            const logEntry = auditLogs.entries.first();
            if (!logEntry || logEntry.target.id !== role.id) return; // if it's not the exact role

            const executorId = logEntry.executorId;

            // Check if the executor is allowed to bypass
            if (await checkBypass(executorId, role.guild, settings, client)) return;

            // İşlemleri sıraya al (Rate limit koruması)
            addToQueue(async () => {
                // Punish and Log
                await punishAndLog(
                    role.guild,
                    executorId,
                    settings,
                    'Güvenlik İhlali: Rol Silinmesi (Anti-Role)',
                    'Bir yetkili izinsiz şekilde rol sildiği için rolleri alındı ve silinen rol aynı özelliklerle tekrar oluşturuldu!',
                    [{ name: '❌ Silinen Rol', value: `\`${role.name}\` (\`${role.id}\`)`, inline: false }]
                );

                // Recreate the role
                await role.guild.roles.create({
                    name: role.name,
                    color: role.color,
                    hoist: role.hoist,
                    permissions: role.permissions,
                    position: role.position,
                    mentionable: role.mentionable,
                    reason: 'Guard Bot: Silinen rol geri yüklendi.'
                }).catch(err => console.error('Rol geri açma hatası:', err));
            });

        } catch (error) {
            console.error('Anti-Role Delete Hatası:', error);
        }
    },
};
