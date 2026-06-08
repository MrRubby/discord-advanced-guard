const { Events, EmbedBuilder } = require('discord.js');
const { getSettings } = require('../../utils/cacheManager');
const { addToQueue } = require('../../utils/actionQueue');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member, client) {
        try {
            const settings = getSettings(member.guild.id);
            if (!settings) return;

            // Panic Mode kontrolü: Aktifse sorgusuz sualsiz kick at
            if (settings.panicMode) {
                addToQueue(async () => {
                    await member.kick('Guard Bot: Panic Mode aktif! Sunucu kilitlendi.').catch(() => null);
                });
                return;
            }

            if (!settings.antiRaid) return;

            // Hesap yaşını hesapla
            const accountCreatedAt = member.user.createdAt;
            const now = new Date();
            const ageInMilliseconds = now - accountCreatedAt;
            const ageInDays = ageInMilliseconds / (1000 * 60 * 60 * 24);

            const requiredDays = settings.antiRaid_account_age_days || 3;

            // Eğer hesap belirlenen günden daha yeniyse
            if (ageInDays < requiredDays) {
                addToQueue(async () => {
                    let actionTaken = '';

                    // Jail rolü varsa jail at, yoksa kick at
                    if (settings.jail_role) {
                        const jailRole = member.guild.roles.cache.get(settings.jail_role);
                        if (jailRole && jailRole.position < member.guild.members.me.roles.highest.position) {
                            await member.roles.add(jailRole, 'Guard Bot: Anti-Raid koruması (Hesap çok yeni)').catch(() => null);
                            actionTaken = 'Karantinaya (Jail) Alındı';
                        } else {
                            await member.kick('Guard Bot: Anti-Raid koruması (Hesap çok yeni)').catch(() => null);
                            actionTaken = 'Sunucudan Atıldı (Kick)';
                        }
                    } else {
                        await member.kick('Guard Bot: Anti-Raid koruması (Hesap çok yeni)').catch(() => null);
                        actionTaken = 'Sunucudan Atıldı (Kick)';
                    }

                    // Log gönder
                    if (settings.guard_log_channel) {
                        const logChannel = member.guild.channels.cache.get(settings.guard_log_channel);
                        if (logChannel && logChannel.isTextBased()) {
                            const embed = new EmbedBuilder()
                                .setTitle('🛡️ Güvenlik İhlali: Anti-Raid')
                                .setColor('Red')
                                .setDescription('Yeni açılan bir hesap sunucuya girmeye çalıştı ve güvenlik amacıyla engellendi!')
                                .addFields(
                                    { name: 'Kullanıcı', value: `<@${member.user.id}> (\`${member.user.id}\`)`, inline: true },
                                    { name: 'Hesap Kuruluş', value: `<t:${Math.floor(accountCreatedAt.getTime() / 1000)}:R>`, inline: true },
                                    { name: 'Uygulanan İşlem', value: actionTaken, inline: true }
                                )
                                .setTimestamp()
                                .setFooter({ text: 'Guard Bot Sistem Koruması' });

                            await logChannel.send({ embeds: [embed] }).catch(() => null);
                        }
                    }
                });
            }

        } catch (error) {
            console.error('Anti-Raid Hatası:', error);
        }
    },
};
