const { Events, EmbedBuilder } = require('discord.js');
const { getSettings } = require('../../utils/cacheManager');
const { addToQueue } = require('../../utils/actionQueue');
const { containsSwear, containsLink } = require('../../utils/filterHelpers');

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {
        // Botların kendi mesajlarını ve DM mesajlarını yoksay
        if (message.author.bot || !message.guild) return;

        const settings = getSettings(message.guild.id);
        if (!settings) return;

        // Filtrelerden herhangi biri açık değilse işlemi sonlandır
        if (!settings.filter_swear && !settings.filter_link) return;

        // Muafiyet Kontrolleri
        if (message.author.id === message.guild.ownerId) return; // Sunucu sahibi
        if (settings.whitelist && settings.whitelist.includes(message.author.id)) return; // Whitelist
        
        // Rol muafiyeti kontrolü
        if (settings.filter_bypass_roles && settings.filter_bypass_roles.length > 0) {
            // Eğer üye cache'lenmemişse (nadiren olur) patlamaması için kontrol edelim
            if (message.member) {
                const hasBypassRole = message.member.roles.cache.some(role => settings.filter_bypass_roles.includes(role.id));
                if (hasBypassRole) return;
            }
        }

        const content = message.content;
        if (!content) return;

        let isViolated = false;
        let violationType = '';

        // Küfür kontrolü
        if (settings.filter_swear && containsSwear(content, settings.custom_blocked_words)) {
            isViolated = true;
            violationType = 'Küfür / Kötü Söz';
        }

        // Link kontrolü (Eğer küfürden yakalanmadıysa)
        if (!isViolated && settings.filter_link && containsLink(content)) {
            isViolated = true;
            violationType = 'Reklam / Link Paylaşımı';
        }

        if (isViolated) {
            // Mesajı anında (Queue'ya sokmadan) sil, chat temiz kalsın
            await message.delete().catch(() => null);

            // Loglama ve uyarı mesajı gönderme işlemlerini Queue'ya (Kuyruk) al
            addToQueue(async () => {
                // Kullanıcıyı uyar
                const warningMsg = await message.channel.send({ 
                    content: `⚠️ ${message.author}, bu sunucuda **${violationType}** yasaktır! Lütfen kurallara uyun.`
                }).catch(() => null);

                // Uyarı mesajını 5 saniye sonra sil
                if (warningMsg) {
                    setTimeout(() => warningMsg.delete().catch(() => null), 5000);
                }

                // Log gönder
                if (settings.guard_log_channel) {
                    const logChannel = message.guild.channels.cache.get(settings.guard_log_channel);
                    if (logChannel && logChannel.isTextBased()) {
                        const embed = new EmbedBuilder()
                            .setTitle('🛑 Filtre İhlali Tespit Edildi!')
                            .setColor('Orange')
                            .setDescription(`Bir kullanıcının mesajı yerel filtreye takıldı ve silindi.`)
                            .addFields(
                                { name: '👤 Kullanıcı', value: `${message.author} (\`${message.author.id}\`)`, inline: true },
                                { name: '🏷️ İhlal Türü', value: violationType, inline: true },
                                { name: '💬 Silinen Mesaj', value: `\`\`\`${content.length > 1000 ? content.substring(0, 1000) + '...' : content}\`\`\``, inline: false }
                            )
                            .setTimestamp()
                            .setFooter({ text: 'Guard Bot Yerel Filtre Sistemi' });

                        await logChannel.send({ embeds: [embed] }).catch(() => null);
                    }
                }
            });
        }
    },
};
