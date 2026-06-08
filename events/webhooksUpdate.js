const { Events, AuditLogEvent } = require('discord.js');
const { getSettings } = require('../../utils/cacheManager');
const { addToQueue } = require('../../utils/actionQueue');
const { punishAndLog, checkBypass } = require('../utils/guardHelper');

module.exports = {
    name: Events.WebhooksUpdate,
    async execute(channel) {
        if (!channel.guild) return;

        try {
            const settings = getSettings(channel.guild.id);
            // Eğer webhook koruması kapalıysa çık (Varsayılan olarak açık olduğu için guard_webhook alanına bakarız)
            if (!settings || settings.guard_webhook === false) return;

            const guild = channel.guild;

            // Denetim kayıtlarından (Audit Logs) WebhookCreate ve WebhookUpdate işlemlerini al
            const createLogs = await guild.fetchAuditLogs({ type: AuditLogEvent.WebhookCreate, limit: 1 }).catch(() => null);
            const updateLogs = await guild.fetchAuditLogs({ type: AuditLogEvent.WebhookUpdate, limit: 1 }).catch(() => null);

            let logEntry = null;
            let actionType = '';

            const createEntry = createLogs ? createLogs.entries.first() : null;
            const updateEntry = updateLogs ? updateLogs.entries.first() : null;

            // Hangi işlem (Oluşturma / Güncelleme) daha yeniyse onu baz al
            if (createEntry && (!updateEntry || createEntry.createdTimestamp > updateEntry.createdTimestamp)) {
                logEntry = createEntry;
                actionType = 'Oluşturulması';
            } else if (updateEntry) {
                logEntry = updateEntry;
                actionType = 'Güncellenmesi';
            }

            if (!logEntry) return;

            // Log eski bir kayıt mı? Sadece son 5 saniye içindekilere reaksiyon verelim
            if (Date.now() - logEntry.createdTimestamp > 5000) return;

            const executorId = logEntry.executorId;
            const webhookId = logEntry.target.id;

            // Bypass kontrolü
            if (await checkBypass(executorId, guild, settings, channel.client)) return;

            // Rate limit koruması için kuyruğa at
            addToQueue(async () => {
                // Şüpheli webhook'u anında bulup sil
                try {
                    const webhooks = await channel.fetchWebhooks();
                    const maliciousWebhook = webhooks.get(webhookId);
                    if (maliciousWebhook) {
                        await maliciousWebhook.delete('Guard Bot: İzinsiz Webhook oluşturulması / düzenlenmesi engellendi.').catch(() => null);
                    }
                } catch (err) {
                    console.error('Webhook silinirken hata:', err);
                }

                // guardHelper üzerinden yetkilerini al ve log düş
                await punishAndLog(
                    guild,
                    executorId,
                    settings,
                    `Güvenlik İhlali: Webhook ${actionType} (Anti-Webhook)`,
                    `Bir yetkili izinsiz şekilde webhook ${actionType.toLowerCase()} işlemi yaptığı için tüm rolleri alındı ve müdahale edilen webhook silindi!`,
                    [
                        { name: '❌ Etkilenen Kanal', value: `${channel} (\`${channel.id}\`)`, inline: false }
                    ]
                );
            });

        } catch (error) {
            console.error('Anti-Webhook Hatası:', error);
        }
    },
};
