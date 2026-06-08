const { Events, REST, Routes } = require('discord.js');
const { loadAllSettings } = require('../utils/cacheManager');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`Bot ${client.user.tag} olarak başarıyla giriş yaptı!`);

        // Önbelleği (Cache) yükle
        await loadAllSettings();

        // Register slash commands globally
        if (process.env.TOKEN && process.env.TOKEN !== 'your_bot_token_here') {
            const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
            const commandsArray = client.commands.map(cmd => cmd.data.toJSON());

            try {
                console.log('Slash komutları Discord API\'ye gönderiliyor...');
                await rest.put(
                    Routes.applicationCommands(client.user.id),
                    { body: commandsArray },
                );
                console.log('Slash komutları başarıyla kaydedildi.');
            } catch (error) {
                console.error('Komut kayıt hatası:', error);
            }
        }
    },
};
