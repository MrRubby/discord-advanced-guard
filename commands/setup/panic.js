const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const GuildSettings = require('../../database/models/GuildSettings');
const { updateSettingsCache } = require('../../utils/cacheManager');
const messages = require('../../messages.json');
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
            return interaction.reply({ content: messages.errors.onlyOwner, ephemeral: true });
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
            const channelArray = Array.from(channels.values());
            
            if (isPanic) {
                await interaction.editReply({ content: messages.commands.panic.activated });
                
                // Discord API Rate-Limit (Spam) engellemek için 10'arlı gruplar halinde (Batch) işlem yapıyoruz.
                // Ana `actionQueue`yu meşgul etmemek için işlemi kendi içinde asenkron hallediyoruz.
                for (let i = 0; i < channelArray.length; i += 10) {
                    const batch = channelArray.slice(i, i + 10);
                    await Promise.all(batch.map(channel => 
                        channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                            SendMessages: false
                        }).catch(() => null)
                    ));
                    // Diğer gruba geçmeden önce 1 saniye (1000ms) bekle
                    if (i + 10 < channelArray.length) await new Promise(r => setTimeout(r, 1000));
                }
            } else {
                await interaction.editReply({ content: messages.commands.panic.deactivated });
                
                for (let i = 0; i < channelArray.length; i += 10) {
                    const batch = channelArray.slice(i, i + 10);
                    await Promise.all(batch.map(channel => 
                        channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                            SendMessages: null // Varsayılan haline (nötr) döndür
                        }).catch(() => null)
                    ));
                    if (i + 10 < channelArray.length) await new Promise(r => setTimeout(r, 1000));
                }
            }

        } catch (error) {
            console.error('Panic komutu hatası:', error);
            await interaction.editReply({ content: messages.errors.databaseError });
        }
    },
};
