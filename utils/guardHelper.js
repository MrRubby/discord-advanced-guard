const { EmbedBuilder } = require('discord.js');

async function punishAndLog(guild, executorId, settings, title, description, logFields = []) {
    // Punish the executor
    const executorMember = await guild.members.fetch(executorId).catch(() => null);
    if (executorMember) {
        // Alınabilir tüm rolleri al
        const rolesToRemove = executorMember.roles.cache.filter(role => 
            role.id !== guild.id && 
            role.position < guild.members.me.roles.highest.position
        );

        if (rolesToRemove.size > 0) {
            await executorMember.roles.remove(rolesToRemove, `Guard Bot: ${title}`)
                .catch(err => console.error('Rol alma hatası:', err));
        }

        // Eğer veritabanında jail (karantina) rolü tanımlıysa ve onu eklenebilecek hiyerarşideysek ekle
        if (settings.jail_role) {
            const jailRole = guild.roles.cache.get(settings.jail_role);
            if (jailRole && jailRole.position < guild.members.me.roles.highest.position) {
                await executorMember.roles.add(jailRole, `Guard Bot: ${title}`).catch(() => null);
            }
        }
    }

    // Log gönder
    if (settings.guard_log_channel) {
        const logChannel = guild.channels.cache.get(settings.guard_log_channel);
        if (logChannel && logChannel.isTextBased()) {
            const embed = new EmbedBuilder()
                .setTitle(`🛡️ ${title}`)
                .setColor('Red')
                .setDescription(description)
                .addFields(
                    { name: '👤 Yetkili', value: `<@${executorId}> (\`${executorId}\`)`, inline: false },
                    ...logFields
                )
                .setTimestamp()
                .setFooter({ text: 'Guard Bot Sistem Koruması' });

            await logChannel.send({ embeds: [embed] }).catch(err => console.error('Log gönderme hatası:', err));
        }
    }
}

async function checkBypass(executorId, guild, settings, client) {
    if (executorId === client.user.id) return true;
    if (executorId === guild.ownerId) return true;
    if (settings.whitelist && settings.whitelist.includes(executorId)) return true;
    return false;
}

module.exports = { punishAndLog, checkBypass };
