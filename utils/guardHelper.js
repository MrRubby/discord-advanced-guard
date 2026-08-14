const { EmbedBuilder } = require('discord.js');
const messages = require('../messages.json');

async function punishAndLog(guild, executorId, settings, title, description, logFields = []) {
    // Punish the executor
    const executorMember = await guild.members.fetch(executorId).catch(() => null);
    if (executorMember) {
        // Alınabilir tüm rolleri al (Managed, yani botlara/entegrasyonlara ait olan rolleri alma!)
        const rolesToRemove = executorMember.roles.cache.filter(role => 
            role.id !== guild.id && 
            !role.managed &&
            role.position < guild.members.me.roles.highest.position
        );

        if (rolesToRemove.size > 0) {
            try {
                await executorMember.roles.remove(rolesToRemove, messages.guardHelper.roleRemoveReason.replace('{title}', title));
            } catch (err) {
                console.error('Toplu rol alma hatası, tek tek deneniyor:', err);
                for (const role of rolesToRemove.values()) {
                    await executorMember.roles.remove(role, messages.guardHelper.roleRemoveFailSafe.replace('{title}', title)).catch(() => null);
                }
            }
        }

        // Eğer veritabanında jail (karantina) rolü tanımlıysa ve onu eklenebilecek hiyerarşideysek ekle
        if (settings.jail_role) {
            const jailRole = guild.roles.cache.get(settings.jail_role);
            if (jailRole && jailRole.position < guild.members.me.roles.highest.position) {
                await executorMember.roles.add(jailRole, messages.guardHelper.jailReason.replace('{title}', title)).catch(() => null);
            }
        }
    }

    // Log gönder
    if (settings.guard_log_channel) {
        const logChannel = guild.channels.cache.get(settings.guard_log_channel);
        if (logChannel && logChannel.isTextBased()) {
            const embed = new EmbedBuilder()
                .setTitle(`${messages.guardHelper.logTitlePrefix}${title}`)
                .setColor(messages.guardHelper.logColor)
                .setDescription(description)
                .addFields(
                    { name: messages.guardHelper.fieldExecutor, value: `<@${executorId}> (\`${executorId}\`)`, inline: false },
                    ...logFields
                )
                .setTimestamp()
                .setFooter({ text: messages.guardHelper.logFooter });

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
