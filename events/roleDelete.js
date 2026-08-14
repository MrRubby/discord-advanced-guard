const { Events, AuditLogEvent } = require('discord.js');
const { getSettings } = require('../../utils/cacheManager');
const { addToQueue } = require('../../utils/actionQueue');
const { punishAndLog, checkBypass } = require('../utils/guardHelper');
const messages = require('../../messages.json');

module.exports = {
    name: Events.GuildRoleDelete,
    async execute(role, client) {
        try {
            const settings = getSettings(role.guild.id);
            if (!settings || !settings.antiRole) return;

            // Logun düşmesi için kısa bir süre bekle (Race condition önlemi)
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Fetch the audit logs to find the executor
            const auditLogs = await role.guild.fetchAuditLogs({ type: AuditLogEvent.RoleDelete, limit: 5 }).catch(() => null);
            if (!auditLogs) return;

            // Son 5 log içinde sildiğimiz rolü bul
            const logEntry = auditLogs.entries.find(entry => entry.target.id === role.id);
            if (!logEntry) return; // if it's not the exact role

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
                    messages.events.antiRole.logTitle,
                    messages.events.antiRole.logDescription,
                    [{ name: messages.events.antiRole.fieldDeletedRole, value: `\`${role.name}\` (\`${role.id}\`)`, inline: false }]
                );

                // Recreate the role
                await role.guild.roles.create({
                    name: role.name,
                    color: role.color,
                    hoist: role.hoist,
                    permissions: role.permissions,
                    position: role.position,
                    mentionable: role.mentionable,
                    reason: messages.events.antiRole.restoreReason
                }).catch(err => console.error('Rol geri açma hatası:', err));
            });

        } catch (error) {
            console.error('Anti-Role Delete Hatası:', error);
        }
    },
};
