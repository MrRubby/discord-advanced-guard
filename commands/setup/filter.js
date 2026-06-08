const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const GuildSettings = require('../../database/models/GuildSettings');
const { updateSettingsCache } = require('../../utils/cacheManager');

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
            return interaction.reply({ content: '❌ Bu komutu sadece **Sunucu Sahibi** kullanabilir!', ephemeral: true });
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
                        return interaction.editReply({ content: `⚠️ **${word}** zaten yasaklı kelimeler listesinde bulunuyor.` });
                    }
                    settings.custom_blocked_words.push(word);
                    await settings.save();
                    updateSettingsCache(interaction.guildId, settings);
                    return interaction.editReply({ content: `✅ **${word}** başarıyla yasaklı kelimeler listesine eklendi.` });
                }
                
                if (subcommand === 'remove') {
                    if (!settings.custom_blocked_words.includes(word)) {
                        return interaction.editReply({ content: `⚠️ **${word}** yasaklı kelimeler listesinde bulunamadı.` });
                    }
                    settings.custom_blocked_words = settings.custom_blocked_words.filter(w => w !== word);
                    await settings.save();
                    updateSettingsCache(interaction.guildId, settings);
                    return interaction.editReply({ content: `✅ **${word}** başarıyla yasaklı kelimeler listesinden çıkarıldı.` });
                }
            }

            if (group === 'bypass') {
                const role = interaction.options.getRole('role');
                
                if (subcommand === 'add') {
                    if (settings.filter_bypass_roles.includes(role.id)) {
                        return interaction.editReply({ content: `⚠️ ${role} zaten muaf roller listesinde.` });
                    }
                    settings.filter_bypass_roles.push(role.id);
                    await settings.save();
                    updateSettingsCache(interaction.guildId, settings);
                    return interaction.editReply({ content: `✅ ${role} rolü filtreden **muaf** tutuldu.` });
                }
                
                if (subcommand === 'remove') {
                    if (!settings.filter_bypass_roles.includes(role.id)) {
                        return interaction.editReply({ content: `⚠️ ${role} muaf roller listesinde bulunamadı.` });
                    }
                    settings.filter_bypass_roles = settings.filter_bypass_roles.filter(r => r !== role.id);
                    await settings.save();
                    updateSettingsCache(interaction.guildId, settings);
                    return interaction.editReply({ content: `✅ ${role} rolü muafiyet listesinden çıkarıldı.` });
                }
            }

        } catch (error) {
            console.error('Filter komutu hatası:', error);
            await interaction.editReply({ content: 'Veritabanı işlemi sırasında hata oluştu.' });
        }
    }
};
