require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const connectDatabase = require('./database/connect');
const loadCommands = require('./handlers/commandHandler');
const loadEvents = require('./handlers/eventHandler');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildWebhooks
    ]
});

client.commands = new Collection();

async function startBot() {
    await connectDatabase();
    await loadEvents(client);
    await loadCommands(client);
    
    if (process.env.TOKEN && process.env.TOKEN !== 'your_bot_token_here') {
        client.login(process.env.TOKEN).catch(err => {
            console.error("Bot giriş yaparken hata oluştu:", err);
        });
    } else {
        console.warn(".env dosyasında TOKEN bulunamadı veya değiştirilmemiş. Lütfen .env dosyasını güncelleyin.");
    }
}

startBot();
