const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const GuildSettings = require('../../database/models/GuildSettings');
const messages = require('../../messages.json');

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
        if (interaction.user.id !== interaction.guild.ownerId) {
            return interaction.reply({ content: messages.errors.onlyOwner, ephemeral: true });
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
                    return interaction.editReply({ content: messages.commands.whitelist.alreadyIn.replace('{user}', targetUser) });
                }
                settings.whitelist.push(targetUser.id);
                await settings.save();
                updateSettingsCache(interaction.guildId, settings);
                return interaction.editReply({ content: messages.commands.whitelist.added.replace('{user}', targetUser) });
            } 
            
            if (subcommand === 'remove') {
                if (!settings.whitelist.includes(targetUser.id)) {
                    return interaction.editReply({ content: messages.commands.whitelist.notFound.replace('{user}', targetUser) });
                }
                settings.whitelist = settings.whitelist.filter(id => id !== targetUser.id);
                await settings.save();
                updateSettingsCache(interaction.guildId, settings);
                return interaction.editReply({ content: messages.commands.whitelist.removed.replace('{user}', targetUser) });
            }

        } catch (error) {
            console.error('Whitelist komutu hatası:', error);
            await interaction.editReply({ content: messages.errors.databaseError });
        }
    },
};
