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
        .replace(/v/g, 'u'); // duruma göre 'v' harfi 'u' veya 'ü' niyetine kullanılabilir.

    // 3. Noktalama işaretlerini, özel karakterleri ve boşlukları tamamen sil
    normalized = normalized.replace(/[^\w\sığüşöç]/gi, '').replace(/\s+/g, '');

    return normalized;
}

function containsSwear(text, customWords = []) {
    const normalizedText = normalizeText(text);
    const allSwearWords = [...defaultSwearWords, ...customWords];

    for (const word of allSwearWords) {
        // Kelimeyi de normalize et (eğer custom eklendiyse)
        const normalizedWord = normalizeText(word);
        if (normalizedText.includes(normalizedWord)) {
            return true;
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
