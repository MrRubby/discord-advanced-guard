const { Events, EmbedBuilder } = require('discord.js');
const { getSettings } = require('../../utils/cacheManager');
const messages = require('../../messages.json');
const { addToQueue } = require('../../utils/actionQueue');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member, client) {
        try {
            const settings = getSettings(member.guild.id);
            if (!settings) return;

            // Panic Mode kontrolü: Aktifse sorgusuz sualsiz kick at
            if (settings.panicMode) {
                if (settings.panic_mode) {
                    await member.kick(messages.events.antiRaid.panicKickReason).catch(() => null);
                    return;
                }return;
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
                    let actionTaken = 'Bilinmiyor';
                    if (settings.anti_raid_action === 'jail' && settings.jail_role) {
                        const jailRole = member.guild.roles.cache.get(settings.jail_role);
                        if (jailRole) {
                            await member.roles.add(jailRole, messages.events.antiRaid.punishReason).catch(() => null);
                            actionTaken = messages.events.antiRaid.actionJail;
                        }
                    } else if (settings.anti_raid_action === 'kick') {
                        await member.kick(messages.events.antiRaid.punishReason).catch(() => null);
                        actionTaken = messages.events.antiRaid.actionKick;
                    }

                    const logChannel = member.guild.channels.cache.get(settings.guard_log_channel);
                    if (logChannel) {
                        const embed = new EmbedBuilder()
                            .setTitle(messages.events.antiRaid.embedTitle)
                            .setColor(messages.events.antiRaid.embedColor)
                            .setDescription(messages.events.antiRaid.embedDesc)
                            .addFields(
                                { name: messages.events.antiRaid.fieldUser, value: `<@${member.id}> (\`${member.id}\`)`, inline: true },
                                { name: messages.events.antiRaid.fieldCreatedAt, value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
                                { name: messages.events.antiRaid.fieldAction, value: actionTaken, inline: false }
                            )
                            .setTimestamp()
                            .setFooter({ text: messages.guardHelper.logFooter });
                        
                        await logChannel.send({ embeds: [embed] }).catch(() => null);
                    }
                });
            }

        } catch (error) {
            console.error('Anti-Raid Hatası:', error);
        }
    },
};
