const { Events, EmbedBuilder } = require('discord.js');
const { getSettings } = require('../../utils/cacheManager');
const messages = require('../../messages.json');
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
            // Loglama ve uyarı mesajı gönderme işlemlerini Queue'ya (Kuyruk) al
            addToQueue(async () => {
                if (!message.deleted) {
                    await message.delete().catch(() => null);
                    
                    const warnMsg = messages.events.chatFilter.warningMessage
                        .replace('{user}', `<@${message.author.id}>`)
                        .replace('{violationType}', violationType);
                        
                    await message.channel.send({ content: warnMsg })
                        .then(msg => setTimeout(() => msg.delete().catch(() => null), 5000));
                    
                    // Log
                    const logChannel = message.guild.channels.cache.get(settings.guard_log_channel);
                    if (logChannel) {
                        const embed = new EmbedBuilder()
                            .setTitle(messages.events.chatFilter.embedTitle)
                            .setColor(messages.events.chatFilter.embedColor)
                            .setDescription(messages.events.chatFilter.embedDesc)
                            .addFields(
                                { name: messages.events.chatFilter.fieldUser, value: `<@${message.author.id}> (\`${message.author.id}\`)`, inline: true },
                                { name: messages.events.chatFilter.fieldViolation, value: violationType, inline: true },
                                { name: messages.events.chatFilter.fieldMessage, value: `||${message.content.substring(0, 1000)}||`, inline: false }
                            )
                            .setTimestamp()
                            .setFooter({ text: messages.guardHelper.logFooter });
                        
                        await logChannel.send({ embeds: [embed] }).catch(() => null);
                    }
                }
            });
        }
    },
};
