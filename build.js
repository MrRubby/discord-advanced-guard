const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const sourceDir = __dirname;
const distDir = path.join(__dirname, 'dist');

// Hedef klasörü temizle
if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir);

// Kopyalanmayacak dosyalar/klasörler
// .env müşteriye boş olarak teslim edilmeli, bu yüzden orijinal içi dolu .env'yi kopyalamıyoruz.
// .env.example varsa kopyalanabilir ama biz boş bir tane oluşturacağız.
const excludeList = ['node_modules', '.git', 'dist', 'build.js', 'package-lock.json', '.env'];

function copyFolderSync(from, to) {
    fs.readdirSync(from).forEach(element => {
        if (excludeList.includes(element)) return;
        const fromPath = path.join(from, element);
        const toPath = path.join(to, element);
        const stat = fs.lstatSync(fromPath);
        
        if (stat.isFile()) {
            fs.copyFileSync(fromPath, toPath);
        } else if (stat.isDirectory()) {
            if (!fs.existsSync(toPath)) fs.mkdirSync(toPath);
            copyFolderSync(fromPath, toPath);
        }
    });
}

console.log('📦 1/3: Proje dosyaları dist/ klasörüne kopyalanıyor...');
copyFolderSync(sourceDir, distDir);

// Müşteri için içi boş bir .env dosyası oluştur
fs.writeFileSync(path.join(distDir, '.env'), 'TOKEN=your_bot_token_here\nMONGO_URI=your_mongodb_uri_here\n');

console.log('🔒 2/3: JavaScript dosyaları şifreleniyor (Obfuscation)...');
try {
    // javascript-obfuscator kütüphanesini kullanarak dist/ içindeki tüm JS dosyalarını yerinde (in-place) şifrele
    execSync('npx javascript-obfuscator ./dist --output ./dist --target node --compact true --control-flow-flattening true --dead-code-injection true --string-array true --string-array-encoding rc4', { stdio: 'inherit' });
    
    console.log('\n✅ 3/3: Şifreleme tamamlandı!');
    console.log('----------------------------------------------------');
    console.log('Müşteriye Teslim Edeceğiniz Klasör: "dist" klasörüdür.');
    console.log('Müşteri sadece "npm install" yazıp ".env" dolduracak.');
    console.log('----------------------------------------------------');
} catch (err) {
    console.error('Şifreleme sırasında hata oluştu. Lütfen "npm install" yaptığınızdan emin olun.', err.message);
}
