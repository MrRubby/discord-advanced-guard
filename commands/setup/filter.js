const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const GuildSettings = require('../../database/models/GuildSettings');
const { updateSettingsCache } = require('../../utils/cacheManager');
const messages = require('../../messages.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('filter')
        .setDescription('Küfür/Reklam filtresi detaylı ayarları (Sadece Sunucu Sahibi).')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommandGroup(group => 
            group.setName('words')
                .setDescription('Özel yasaklı kelime yönetimi')
                .addSubcommand(subcmd => 
                    subcmd.setName('add')
                    .setDescription('Yasaklı kelime ekler')
                    .addStringOption(opt => opt.setName('word').setDescription('Eklenecek kelime').setRequired(true))
                )
                .addSubcommand(subcmd => 
                    subcmd.setName('remove')
                    .setDescription('Yasaklı kelime çıkarır')
                    .addStringOption(opt => opt.setName('word').setDescription('Çıkarılacak kelime').setRequired(true))
                )
        )
        .addSubcommandGroup(group => 
            group.setName('bypass')
                .setDescription('Filtreden muaf rol yönetimi')
                .addSubcommand(subcmd => 
                    subcmd.setName('add')
                    .setDescription('Muaf rol ekler')
                    .addRoleOption(opt => opt.setName('role').setDescription('Eklenecek rol').setRequired(true))
                )
                .addSubcommand(subcmd => 
                    subcmd.setName('remove')
                    .setDescription('Muaf rol çıkarır')
                    .addRoleOption(opt => opt.setName('role').setDescription('Çıkarılacak rol').setRequired(true))
                )
        ),
        
    async execute(interaction) {
        if (interaction.user.id !== interaction.guild.ownerId) {
            return interaction.reply({ content: messages.errors.onlyOwner, ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });
        
        const group = interaction.options.getSubcommandGroup();
        const subcommand = interaction.options.getSubcommand();

        try {
            let settings = await GuildSettings.findOne({ guildId: interaction.guildId });
            if (!settings) settings = new GuildSettings({ guildId: interaction.guildId });

            if (group === 'words') {
                const word = interaction.options.getString('word').toLowerCase();
                
                if (subcommand === 'add') {
                    if (settings.custom_blocked_words.includes(word)) {
                        return interaction.editReply({ content: messages.commands.filter.wordAlreadyBlocked.replace('{word}', word) });
                    }
                    settings.custom_blocked_words.push(word);
                    await settings.save();
                    updateSettingsCache(interaction.guildId, settings);
                    return interaction.editReply({ content: messages.commands.filter.wordAdded.replace('{word}', word) });
                }
                
                if (subcommand === 'remove') {
                    if (!settings.custom_blocked_words.includes(word)) {
                        return interaction.editReply({ content: messages.commands.filter.wordNotFound.replace('{word}', word) });
                    }
                    settings.custom_blocked_words = settings.custom_blocked_words.filter(w => w !== word);
                    await settings.save();
                    updateSettingsCache(interaction.guildId, settings);
                    return interaction.editReply({ content: messages.commands.filter.wordRemoved.replace('{word}', word) });
                }
            }

            if (group === 'bypass') {
                const role = interaction.options.getRole('role');
                
                if (subcommand === 'add') {
                    if (settings.filter_bypass_roles.includes(role.id)) {
                        return interaction.editReply({ content: messages.commands.filter.roleAlreadyBypass.replace('{role}', role) });
                    }
                    settings.filter_bypass_roles.push(role.id);
                    await settings.save();
                    updateSettingsCache(interaction.guildId, settings);
                    return interaction.editReply({ content: messages.commands.filter.roleBypassAdded.replace('{role}', role) });
                }
                
                if (subcommand === 'remove') {
                    if (!settings.filter_bypass_roles.includes(role.id)) {
                        return interaction.editReply({ content: messages.commands.filter.roleBypassNotFound.replace('{role}', role) });
                    }
                    settings.filter_bypass_roles = settings.filter_bypass_roles.filter(r => r !== role.id);
                    await settings.save();
                    updateSettingsCache(interaction.guildId, settings);
                    return interaction.editReply({ content: messages.commands.filter.roleBypassRemoved.replace('{role}', role) });
                }
            }

        } catch (error) {
            console.error('Filter komutu hatası:', error);
            await interaction.editReply({ content: messages.errors.databaseError });
        }
    }
};
