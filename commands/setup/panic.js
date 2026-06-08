const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const GuildSettings = require('../../database/models/GuildSettings');
const { updateSettingsCache } = require('../../utils/cacheManager');
const { addToQueue } = require('../../utils/actionQueue');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('panic')
        .setDescription('Kriz modunu açıp kapatır (Sadece Sunucu Sahibi).')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option => 
            option.setName('status')
                .setDescription('Panic mode durumu')
                .setRequired(true)
                .addChoices(
                    { name: 'AÇ (ON) - Sunucuyu kilitle', value: 'on' },
                    { name: 'KAPAT (OFF) - Sunucuyu normale döndür', value: 'off' }
                )
        ),
        
    async execute(interaction) {
        if (interaction.user.id !== interaction.guild.ownerId) {
            return interaction.reply({ content: '❌ Bu komutu sadece **Sunucu Sahibi** kullanabilir!', ephemeral: true });
        }

        const status = interaction.options.getString('status');
        const isPanic = status === 'on';

        await interaction.deferReply({ ephemeral: true });

        try {
            let settings = await GuildSettings.findOne({ guildId: interaction.guildId });
            if (!settings) settings = new GuildSettings({ guildId: interaction.guildId });

            settings.panicMode = isPanic;
            await settings.save();
            updateSettingsCache(interaction.guildId, settings);

            const channels = interaction.guild.channels.cache.filter(c => c.type === ChannelType.GuildText);
            
            if (isPanic) {
                await interaction.editReply({ content: '🚨 **PANIC MODE AKTİF EDİLDİ!** Sunucudaki tüm metin kanalları @everyone için kilitleniyor ve sunucu girişleri kapatılıyor...' });
                
                channels.forEach(channel => {
                    addToQueue(async () => {
                        await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                            SendMessages: false
                        }).catch(() => null);
                    });
                });
            } else {
                await interaction.editReply({ content: '✅ **PANIC MODE KAPATILDI!** Sunucudaki metin kanallarının kilidi @everyone için açılıyor ve girişler normale döndürülüyor...' });
                
                channels.forEach(channel => {
                    addToQueue(async () => {
                        await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                            SendMessages: null // Varsayılan haline (nötr) döndür
                        }).catch(() => null);
                    });
                });
            }

        } catch (error) {
            console.error('Panic komutu hatası:', error);
            await interaction.editReply({ content: 'İşlem sırasında hata oluştu.' });
        }
    },
};
