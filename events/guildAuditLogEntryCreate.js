const { Events, AuditLogEvent, EmbedBuilder } = require('discord.js');
const { getSettings } = require('../../utils/cacheManager');
const { addToQueue } = require('../../utils/actionQueue');
const ModeratorStat = require('../../database/models/ModeratorStat');

module.exports = {
    name: Events.GuildAuditLogEntryCreate,
    async execute(auditLog, guild, client) {
        // Sadece Member Ban Add olaylarını dinle
        if (auditLog.action !== AuditLogEvent.MemberBanAdd) return;

        const executorId = auditLog.executorId;
        const targetId = auditLog.targetId;

        // Botun kendi yaptığı işlemleri yoksay
        if (executorId === client.user.id) return;

        try {
            const settings = getSettings(guild.id);
            if (!settings) return;

            // Sunucu sahibi limitlere takılmaz
            if (executorId === guild.ownerId) return;

            // Whitelist'te olan yetkililer limitlere takılmaz
            if (settings.whitelist && settings.whitelist.includes(executorId)) return;

            // Yetkilinin günlük ban istatistiğini takip et (DB'ye yazıldığı için bunu cache'e almadık)
            const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
            let stat = await ModeratorStat.findOne({ guildId: guild.id, userId: executorId, date: today });
            
            if (!stat) {
                stat = new ModeratorStat({ guildId: guild.id, userId: executorId, date: today, banCount: 0 });
            }

            stat.banCount += 1;
            await stat.save();

            const limit = settings.daily_ban_limit || 3;

            // Eğer limit aşıldıysa
            if (stat.banCount > limit) {
                addToQueue(async () => {
                    const executorMember = await guild.members.fetch(executorId).catch(() => null);
                    
                    if (executorMember) {
                        // Yetkilinin yönetilebilir tüm rollerini al
                        const rolesToRemove = executorMember.roles.cache.filter(role => 
                            role.id !== guild.id && // @everyone rolünü alma
                            role.position < guild.members.me.roles.highest.position // Botun rolünden düşük olanlar
                        );

                        if (rolesToRemove.size > 0) {
                            await executorMember.roles.remove(rolesToRemove, 'Guard Bot: Günlük ban limitini aştı.')
                                .catch(err => console.error('Rol alma hatası:', err));
                        }
                    }

                    // Log kanalına şık bir bildirim gönder
                    if (settings.guard_log_channel) {
                        const logChannel = guild.channels.cache.get(settings.guard_log_channel);
                        if (logChannel && logChannel.isTextBased()) {
                            const embed = new EmbedBuilder()
                                .setTitle('🚨 Güvenlik Uyarısı: Limit Aşımı!')
                                .setColor('Red')
                                .setDescription(`Bir yetkili belirlenen günlük ban limitini aştığı için güvenlik amacıyla rolleri alındı!`)
                                .addFields(
                                    { name: '👤 Yetkili', value: `<@${executorId}> (\`${executorId}\`)`, inline: true },
                                    { name: '📊 Ban Limiti Durumu', value: `${stat.banCount} / ${limit}`, inline: true },
                                    { name: '⛔ Son Banlanan Kullanıcı', value: `<@${targetId}> (\`${targetId}\`)`, inline: true }
                                )
                                .setTimestamp()
                                .setFooter({ text: 'Guard Bot Sistem Koruması' });

                            await logChannel.send({ embeds: [embed] }).catch(err => console.error('Log gönderme hatası:', err));
                        }
                    }
                });
            }

        } catch (error) {
            console.error('Ban limit kontrolü sırasında hata:', error);
        }
    },
};
