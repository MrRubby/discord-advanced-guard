const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const GuildSettings = require('../../database/models/GuildSettings');
const messages = require('../../messages.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Sunucu koruma ve moderasyon rollerini ayarlar (Sadece Sunucu Sahibi).')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addRoleOption(option => option.setName('ban_role').setDescription('Ban atma yetkisi verilecek rol'))
        .addRoleOption(option => option.setName('kick_role').setDescription('Kick atma yetkisi verilecek rol'))
        .addRoleOption(option => option.setName('jail_auth_role').setDescription('Jail atma yetkisi verilecek rol'))
        .addRoleOption(option => option.setName('muter_role').setDescription('Timeout atma yetkisi verilecek rol'))
        .addRoleOption(option => option.setName('jail_role').setDescription('Karantinaya (Jail) atılanlara verilecek rol'))
        .addChannelOption(option => option.setName('log_channel').setDescription('Koruma loglarının düşeceği kanal').addChannelTypes(ChannelType.GuildText)),
        
    async execute(interaction) {
        if (interaction.user.id !== interaction.guild.ownerId) {
            return interaction.reply({ content: messages.errors.onlyOwner, ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        const banRole = interaction.options.getRole('ban_role');
        const kickRole = interaction.options.getRole('kick_role');
        const jailAuthRole = interaction.options.getRole('jail_auth_role');
        const muterRole = interaction.options.getRole('muter_role');
        const jailRole = interaction.options.getRole('jail_role');
        const logChannel = interaction.options.getChannel('log_channel');

        const { updateSettingsCache } = require('../../utils/cacheManager');

        try {
            // Veritabanından sunucu ayarlarını bul veya oluştur
            let settings = await GuildSettings.findOne({ guildId: interaction.guildId });

            if (!settings) {
                settings = new GuildSettings({ guildId: interaction.guildId });
            }

            // Gelen verileri güncelle
            if (banRole) settings.ban_auth_role = banRole.id;
            if (kickRole) settings.kick_auth_role = kickRole.id;
            if (jailAuthRole) settings.jail_auth_role = jailAuthRole.id;
            if (muterRole) settings.muter_auth_role = muterRole.id;
            if (jailRole) settings.jail_role = jailRole.id;
            if (logChannel) settings.guard_log_channel = logChannel.id;

            await settings.save();
            updateSettingsCache(interaction.guildId, settings); // Cache Güncelle

            let responseText = messages.commands.setup.successTitle;
            responseText += `${messages.commands.setup.banRole}${settings.ban_auth_role ? `<@&${settings.ban_auth_role}>` : messages.commands.setup.notSet}\n`;
            responseText += `${messages.commands.setup.kickRole}${settings.kick_auth_role ? `<@&${settings.kick_auth_role}>` : messages.commands.setup.notSet}\n`;
            responseText += `${messages.commands.setup.jailAuthRole}${settings.jail_auth_role ? `<@&${settings.jail_auth_role}>` : messages.commands.setup.notSet}\n`;
            responseText += `${messages.commands.setup.muteRole}${settings.muter_auth_role ? `<@&${settings.muter_auth_role}>` : messages.commands.setup.notSet}\n`;
            responseText += `${messages.commands.setup.jailRole}${settings.jail_role ? `<@&${settings.jail_role}>` : messages.commands.setup.notSet}\n`;
            responseText += `${messages.commands.setup.logChannel}${settings.guard_log_channel ? `<#${settings.guard_log_channel}>` : messages.commands.setup.notSet}\n`;

            await interaction.editReply({ content: responseText });

        } catch (error) {
            console.error('Setup komutu hatası:', error);
            await interaction.editReply({ content: messages.errors.databaseError });
        }
    },
};
