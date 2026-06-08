<div align="center">
  <h1>🛡️ Advanced Discord Guard & Management Bot</h1>
  <p>A highly-optimized, dynamic, and fully Discord-manageable public guard bot built with Discord.js v14.</p>
  
  ![Discord.js](https://img.shields.io/badge/Discord.js-v14-5865F2?style=for-the-badge&logo=discord&logoColor=white)
  ![Node.js](https://img.shields.io/badge/Node.js-v18+-43853D?style=for-the-badge&logo=node.js&logoColor=white)
  ![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
  ![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)
</div>

## 📌 About The Project
This bot is designed to be a complete, all-in-one security and moderation solution for Discord servers. Unlike traditional bots that require hardcoded configurations, **every single feature** of this bot can be dynamically configured via Discord Slash Commands. It is built to be a public bot, meaning you can invite it to any server and set up independent databases, bypass roles, and limits.

Powered by a blazing-fast RAM Cache system and Action Queue, it avoids Discord API rate limits and operates with **0ms latency** during crisis moments.

## 🌟 Key Features

| Feature | Description |
| --- | --- |
| 🛡️ **Anti-Role & Anti-Channel** | Instantly strips permissions from rogue admins and restores deleted/created channels & roles with exact permissions. |
| 🪝 **Anti-Webhook** | Detects unauthorized webhook creation/modification via Audit Logs in 0ms, deletes them, and strips the executor's roles. |
| 🚨 **Anti-Raid (Account Age)** | Automatically kicks or quarantines (Jail) brand new accounts joining your server to prevent bot raids. |
| 📊 **Ban & Kick Thresholds** | Limits how many users an admin can ban per day. Exceeding the limit automatically revokes their permissions. |
| 🤬 **High-Performance Filter** | A local, regex-powered filter that blocks swears and malicious links. Detects bypassing attempts like `h.e.l.l.o` (De-leeting). |
| ⚡ **Cache & Rate-Limit Queue** | Reads settings from RAM instead of the database. Executes mass-punishments through a 500ms delay queue to prevent 429 API Bans. |
| 🆘 **Panic Mode** | A single command (`/panic on`) instantly locks down all text channels for `@everyone` and kicks any new members joining during an attack. |

## 🚀 Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v16.9.0 or higher required for Discord.js v14)
- [MongoDB](https://www.mongodb.com/) (Local or Atlas Cluster)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/advanced-discord-guard.git
cd advanced-discord-guard
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory and add your credentials:
```env
# Your Discord Bot Token
TOKEN=your_bot_token_here

# Your MongoDB Connection String
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/guardbot
```

### 4. Run the Bot
To start the bot normally:
```bash
node index.js
```

**For Production (Using PM2):**
```bash
npm install -g pm2
pm2 start index.js --name "GuardBot"
```

## 💻 Usage / Commands

All management is done seamlessly via Slash Commands. **Only the Server Owner** can configure the core settings to ensure absolute security.

- `/setup` - Configure your main roles (Ban Authority, Kick Authority, Jail Role, Log Channel).
- `/toggle [module] [status]` - Turn any protection module on or off (e.g., Anti-Role, Anti-Webhook, Swear Filter).
- `/whitelist add/remove [@user]` - Add trusted admins to the whitelist so they bypass all limits.
- `/filter bypass add/remove [@role]` - Add VIP or specific roles that bypass the swear and link filter.
- `/filter words add/remove [word]` - Expand your server's local blocklist with custom swear words.
- `/panic [on/off]` - Engage or disengage server lockdown mode.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! 
Feel free to check [issues page](https://github.com/yourusername/advanced-discord-guard/issues). 

## 📜 License
Distributed under the MIT License. See `LICENSE` for more information.
