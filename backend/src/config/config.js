// /video-hub-desktop/backend/src/config/config.js

const path = require('path');

// 1. **Değişiklik burada:** __dirname, config.js'nin dizinini temsil eder.
// `.env` dosyasını bu dizinde (config klasöründe) bulmasını sağlıyoruz.
require('dotenv').config({ 
    path: path.resolve(__dirname, '.env') 
}); 

// 2. process.env'den değişkenleri alıyoruz
const config = {
    PORT: process.env.PORT || 3000, 
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,

    // path.resolve, MEDIA_DIR'ın mutlak bir yol olarak okunmasını garanti eder.
    MEDIA_DIR: path.resolve(process.env.MEDIA_DIR)
};

module.exports = config;