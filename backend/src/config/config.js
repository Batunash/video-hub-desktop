const path = require('path');
const dotenv = require('dotenv');
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

const config = {
    PORT: process.env.PORT || 3000, 
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
    MEDIA_DIR: process.env.MEDIA_DIR ? path.resolve(process.env.MEDIA_DIR) : path.join(require('os').homedir(), 'Desktop', 'Archive')
};

module.exports = config;