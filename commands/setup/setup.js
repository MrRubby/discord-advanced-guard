const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const GuildSettings = require('../../database/models/GuildSettings');

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
        // Sunucu sahibi kontrolü
        if (interaction.user.id !== interaction.guild.ownerId) {
            return interaction.reply({ content: '❌ Bu komutu sadece **Sunucu Sahibi** kullanabilir!', ephemeral: true });
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

            let responseText = '✅ **Sunucu koruma ve moderasyon ayarları başarıyla güncellendi!**\n\n**Güncel Ayarlar:**\n';
            responseText += `- Ban Yetkili Rolü: ${settings.ban_auth_role ? `<@&${settings.ban_auth_role}>` : 'Ayarlandı değil'}\n`;
            responseText += `- Kick Yetkili Rolü: ${settings.kick_auth_role ? `<@&${settings.kick_auth_role}>` : 'Ayarlandı değil'}\n`;
            responseText += `- Jail Yetkili Rolü: ${settings.jail_auth_role ? `<@&${settings.jail_auth_role}>` : 'Ayarlandı değil'}\n`;
            responseText += `- Mute Yetkili Rolü: ${settings.muter_auth_role ? `<@&${settings.muter_auth_role}>` : 'Ayarlandı değil'}\n`;
            responseText += `- Jail (Mahkum) Rolü: ${settings.jail_role ? `<@&${settings.jail_role}>` : 'Ayarlandı değil'}\n`;
            responseText += `- Log Kanalı: ${settings.guard_log_channel ? `<#${settings.guard_log_channel}>` : 'Ayarlandı değil'}\n`;

            await interaction.editReply({ content: responseText });

        } catch (error) {
            console.error('Setup komutu hatası:', error);
            await interaction.editReply({ content: 'Ayarlar kaydedilirken bir veritabanı hatası oluştu.' });
        }
    },
};
