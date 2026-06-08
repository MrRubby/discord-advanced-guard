const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const GuildSettings = require('../../database/models/GuildSettings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('whitelist')
        .setDescription('Kullanıcıyı güvenli listeye ekler veya çıkarır (Sadece Sunucu Sahibi).')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Bir kullanıcıyı whitelist\'e ekler.')
                .addUserOption(option => option.setName('user').setDescription('Eklenecek kullanıcı').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Bir kullanıcıyı whitelist\'ten çıkarır.')
                .addUserOption(option => option.setName('user').setDescription('Çıkarılacak kullanıcı').setRequired(true))
        ),
        
    async execute(interaction) {
        // Sunucu sahibi kontrolü
        if (interaction.user.id !== interaction.guild.ownerId) {
            return interaction.reply({ content: '❌ Bu komutu sadece **Sunucu Sahibi** kullanabilir!', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        const subcommand = interaction.options.getSubcommand();
        const targetUser = interaction.options.getUser('user');

        const { updateSettingsCache } = require('../../utils/cacheManager');

        try {
            let settings = await GuildSettings.findOne({ guildId: interaction.guildId });

            if (!settings) {
                settings = new GuildSettings({ guildId: interaction.guildId });
            }

            if (subcommand === 'add') {
                if (settings.whitelist.includes(targetUser.id)) {
                    return interaction.editReply({ content: `⚠️ ${targetUser} zaten whitelist'te bulunuyor.` });
                }
                settings.whitelist.push(targetUser.id);
                await settings.save();
                updateSettingsCache(interaction.guildId, settings);
                return interaction.editReply({ content: `✅ ${targetUser} başarıyla whitelist'e **eklendi**.` });
            } 
            
            if (subcommand === 'remove') {
                if (!settings.whitelist.includes(targetUser.id)) {
                    return interaction.editReply({ content: `⚠️ ${targetUser} whitelist'te bulunmuyor.` });
                }
                settings.whitelist = settings.whitelist.filter(id => id !== targetUser.id);
                await settings.save();
                updateSettingsCache(interaction.guildId, settings);
                return interaction.editReply({ content: `✅ ${targetUser} başarıyla whitelist'ten **çıkarıldı**.` });
            }

        } catch (error) {
            console.error('Whitelist komutu hatası:', error);
            await interaction.editReply({ content: 'İşlem sırasında bir veritabanı hatası oluştu.' });
        }
    },
};
