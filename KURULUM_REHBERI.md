# 🛡️ Guard Bot - Kurulum ve Kullanım Rehberi

Bu rehber, Guard Bot'un sunucunuza nasıl kurulacağını, nasıl kişiselleştirileceğini ve nasıl kullanılacağını adım adım açıklamaktadır.

---

## 📌 1. Gereksinimler
Botun sorunsuz çalışabilmesi için bilgisayarınızda veya sunucunuzda (VDS) şunların kurulu olması gerekir:
- **Node.js** (v16.9.0 veya daha yeni bir sürüm)
- **MongoDB** veritabanı bağlantı adresi (URL)

---

## ⚙️ 2. İlk Kurulum ve Ayarlar

### Adım 1: Gerekli Modüllerin Yüklenmesi
Bot dosyalarını bir klasöre çıkardıktan sonra, klasörün içinde bir terminal/komut istemi (CMD) açın ve aşağıdaki komutu yazarak gerekli kütüphaneleri indirin:
```bash
npm install
```

### Adım 2: Bot Tokeni ve Veritabanı
Klasörün içindeki `.env` dosyasını bir metin editörü (Not Defteri, VS Code vb.) ile açın ve kendi bilgilerinizi girin:
```env
TOKEN=buraya_botunuzun_tokenini_yazın
MONGO_URI=buraya_mongodb_baglanti_adresinizi_yazın
```

### Adım 3: Discord Intent Ayarları (Çok Önemli!)
1. [Discord Developer Portal](https://discord.com/developers/applications)'a girin ve botunuzu seçin.
2. Sol menüden **"Bot"** sekmesine tıklayın.
3. Sayfayı aşağı kaydırıp **"Privileged Gateway Intents"** bölümünü bulun.
4. Buradaki **Presence Intent**, **Server Members Intent** ve **Message Content Intent** seçeneklerinin üçünü de aktif (mavi) hale getirin ve kaydedin.
*(Eğer bunları açmazsanız botunuz çalışmaz veya komutlara tepki vermez.)*

---

## 🎨 3. Kişiselleştirme (messages.json)

Botunuzun verdiği yanıtları, log mesajlarını, embed renklerini ve "Oynuyor" kısmını tamamen kendi zevkinize göre ayarlayabilirsiniz. Bunun için **`messages.json`** dosyasını açmanız yeterlidir.

### Oynuyor (Activity) Kısmını Değiştirme
`messages.json` dosyasının en üstünde yer alan bölümü düzenleyin:
```json
  "botActivity": {
    "text": "🛡️ Sunucuyu Koruyor",
    "type": "Playing" 
  }
```
**Desteklenen `type` seçenekleri:** 
- `"Playing"` (Oynuyor)
- `"Watching"` (İzliyor)
- `"Listening"` (Dinliyor)
- `"Competing"` (Yarışıyor)

### Hata Mesajları ve Logları Özelleştirme
Örneğin, botun küfür yakaladığında attığı mesajı değiştirmek için `chatFilter` bölümünü bulun:
```json
"warningMessage": "⚠️ {user}, bu sunucuda **{violationType}** yasaktır!"
```
Buradaki `{user}` (Kullanıcı etiketlenmesi) gibi yer tutucuları **silmeden** etrafındaki yazıları dilediğiniz gibi Türkçeleştirebilir veya İngilizce yapabilirsiniz.

### Embed Renklerini Değiştirme
Log kanalına giden renkleri `embedColor` ayarı ile değiştirebilirsiniz (Örn: `"Red"`, `"Orange"`, `"Blue"`, `"Green"`, veya `"#ff0000"` gibi HEX kodları).

---

## 🚀 4. Botu Başlatma

Tüm ayarları yaptıktan sonra konsola şu komutu yazarak botunuzu başlatabilirsiniz:
```bash
node index.js
```
Konsolda `Bot Başarıyla giriş yaptı!` yazısını gördüğünüzde her şey hazır demektir.

---

## 🛡️ 5. Sunucu İçi Ayarlar (Discord Üzerinden)

Botunuz sunucuya katıldıktan sonra tam koruma sağlayabilmesi için şu adımları izleyin:

1. **Rol Hiyerarşisi:** Sunucu ayarlarından "Roller" kısmına girin. Guard Bot'un rolünü, korumasını istediğiniz diğer tüm rollerin **en üstüne** taşıyın. Bot, kendisinden üstte olan rollere işlem (Ban/Kick/Rol alma) **yapamaz**.
2. **Kurulum Komutu:** Sunucu sahibi olarak herhangi bir kanalda `/setup` komutunu kullanın ve log kanalınızı, ban/kick atabilecek yetkili rollerini tanımlayın.
3. **Modüller:** `/toggle` komutu ile istediğiniz koruma sistemlerini (Örn: Küfür koruması, Anti-Raid vs.) açıp kapatabilirsiniz.
4. **Panic Mode:** Eğer sunucunuza ani bir saldırı (Raid) gelirse `/panic` komutunu kullanarak saniyeler içinde tüm kanalları kilitleyebilir ve girişleri durdurabilirsiniz.

İyi günlerde kullanın!
