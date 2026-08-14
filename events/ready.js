const { Events, REST, Routes, ActivityType } = require('discord.js');
const { loadAllSettings } = require('../utils/cacheManager');
const messages = require('../../messages.json');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`Bot ${client.user.tag} olarak başarıyla giriş yaptı!`);

        // Botun oynuyor kısmını (Presence) messages.json'dan çekerek ayarla
        let activityType = ActivityType.Playing;
        if (messages.botActivity.type === 'Watching') activityType = ActivityType.Watching;
        else if (messages.botActivity.type === 'Listening') activityType = ActivityType.Listening;
        else if (messages.botActivity.type === 'Competing') activityType = ActivityType.Competing;

        client.user.setPresence({
            activities: [{ name: messages.botActivity.text, type: activityType }],
            status: 'online',
        });

        // Önbelleği (Cache) yükle
        await loadAllSettings();

        // Register slash commands globally
        if (process.env.TOKEN && process.env.TOKEN) {
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
