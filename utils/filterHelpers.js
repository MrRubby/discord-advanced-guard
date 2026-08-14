// Temel, çok yaygın küfürler (Yerel koruma için)
const defaultSwearWords = [
    'amk', 'amq', 'aq', 'mk', 'orospu', 'oç', 'pic', 'piç', 
    'siktir', 'sikerim', 'sikik', 'yarrak', 'yarak', 'göt', 
    'pezevenk', 'kahpe', 'fahişe', 'amına', 'amcık'
];

function normalizeText(text) {
    // 1. Tüm harfleri küçük yap
    let normalized = text.toLowerCase();
    
    // 2. Harf benzerliklerini düzelt (de-leeting)
    normalized = normalized
        .replace(/1/g, 'i')
        .replace(/@/g, 'a')
        .replace(/0/g, 'o')
        .replace(/3/g, 'e')
        .replace(/4/g, 'a')
        .replace(/5/g, 's')
        .replace(/7/g, 't')
        .replace(/!/g, 'i')
        .replace(/v/g, 'u');

    // 3. Noktalama işaretlerini, özel karakterleri boşluğa çevir (kelimeleri ayırmak için)
    normalized = normalized.replace(/[^\w\sığüşöç]/gi, ' ');
    
    // 4. Yan yana 3 veya daha fazla aynı harf varsa onları teke veya çifte indirgemek false-positive'i azaltır
    // Ancak basitlik ve performans açısından temel fazladan boşlukları temizleyelim.
    normalized = normalized.replace(/\s+/g, ' ').trim();

    return normalized;
}

function containsSwear(text, customWords = []) {
    const normalizedText = normalizeText(text);
    // Cümleyi kelimelere bölelim
    const words = normalizedText.split(' ');
    
    const allSwearWords = [...defaultSwearWords, ...customWords];

    for (const word of allSwearWords) {
        const normalizedSwear = normalizeText(word);
        
        // Eğer yasaklı kelime boşluk içeriyorsa (Örn: "ana avrat")
        if (normalizedSwear.includes(' ')) {
            const paddedText = ` ${normalizedText} `;
            if (paddedText.includes(` ${normalizedSwear} `)) {
                return true;
            }
        } else {
            // Yasaklı kelime tek bir kelimeyse, kelimeler dizisinde "Tam Eşleşme" (Exact Match) arayalım.
            // Bu sayede "kalem kutusu" içindeki "mk" yakalanmaz.
            // Sadece birisi boşluk bırakıp direkt "mk" yazarsa yakalanır.
            if (words.includes(normalizedSwear)) {
                return true;
            }
            
            // Eğer isterseniz, ek (suffix) almış küfürleri de yakalamak için startsWith kullanabilirsiniz:
            // if (words.some(w => w.startsWith(normalizedSwear))) return true; 
            // Ancak bu "göt" kelimesi için "götür" kelimesini de yakalayacağı için tehlikeli olabilir.
            // O yüzden tam eşleşme en güvenlisidir.
        }
    }
    return false;
}

function containsLink(text) {
    // Gelişmiş Reklam/Link Regex'i
    // Discord invite linkleri, http/https linkleri, yaygın uzantılar
    const linkRegex = /(https?:\/\/)?(www\.)?(discord\.(gg|io|me|li)|discordapp\.com\/invite|invite\.gg)\/[a-zA-Z0-9]+/i;
    const generalLinkRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.(com|net|org|xyz|io|co|me|gl)(\/[^\s]*)?)/i;

    return linkRegex.test(text) || generalLinkRegex.test(text);
}

module.exports = {
    normalizeText,
    containsSwear,
    containsLink
};
