const mongoose = require('mongoose');

async function connectDatabase() {
    try {
        if (!process.env.MONGO_URI || process.env.MONGO_URI === 'your_mongodb_uri_here') {
            console.warn("MongoDB URI bulunamadı veya değiştirilmemiş, veritabanı bağlantısı atlanıyor. (Lütfen .env dosyanızı ayarlayın)");
            return;
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB veritabanına başarıyla bağlanıldı.');
    } catch (error) {
        console.error('MongoDB bağlantı hatası:', error);
    }
}

module.exports = connectDatabase;
