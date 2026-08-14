const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const GuildSettings = require('../../database/models/GuildSettings');
const messages = require('../../messages.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('toggle')
        .setDescription('Koruma modüllerini açıp kapatır (Sadece Sunucu Sahibi).')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option => 
            option.setName('module')
                .setDescription('Açıp kapatmak istediğiniz modül')
                .setRequired(true)
                .addChoices(
                    { name: 'Anti-Role (Rol Koruması)', value: 'antiRole' },
                    { name: 'Anti-Channel (Kanal Koruması)', value: 'antiChannel' },
                    { name: 'Anti-Raid (Hesap Yaş Sınırı)', value: 'antiRaid' },
                    { name: 'Küfür Filtresi', value: 'filter_swear' },
                    { name: 'Reklam / Link Filtresi', value: 'filter_link' },
                    { name: 'Anti-Webhook (Webhook Koruması)', value: 'guard_webhook' }
                )
        )
        .addBooleanOption(option => 
            option.setName('status')
                .setDescription('Modülün durumu (Açık: True / Kapalı: False)')
                .setRequired(true)
        ),
        
    async execute(interaction) {
        if (interaction.user.id !== interaction.guild.ownerId) {
            return interaction.reply({ content: messages.errors.onlyOwner, ephemeral: true });
        }

        const moduleName = interaction.options.getString('module');
        const status = interaction.options.getBoolean('status');

        const { updateSettingsCache } = require('../../utils/cacheManager');

        try {
            let settings = await GuildSettings.findOne({ guildId: interaction.guildId });
            if (!settings) {
                settings = new GuildSettings({ guildId: interaction.guildId });
            }

            settings[moduleName] = status;
            await settings.save();
            updateSettingsCache(interaction.guildId, settings); // Cache Güncelle

            const statusText = status ? messages.commands.toggle.statusTrue : messages.commands.toggle.statusFalse;
            await interaction.reply({ 
                content: messages.commands.toggle.success.replace('{module}', moduleName).replace('{status}', statusText), 
                ephemeral: true 
            });

        } catch (error) {
            console.error('Toggle komutu hatası:', error);
            await interaction.reply({ content: messages.errors.databaseError, ephemeral: true });
        }
    },
};
