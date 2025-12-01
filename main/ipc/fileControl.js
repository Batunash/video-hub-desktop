const { ipcMain } = require("electron");
const path = require('path');
const fs = require("fs");1
const { getSettings } = require("../utils/handlesettings"); 
const episodeQueue = require("../utils/episodeQueue");
const { downloadImage } = require("../utils/imageDownloader");
const db = require("../../backend/src/config/database");
const axios = require('axios');
const { VIDEO_EXTS } = require("../../backend/src/constants");

module.exports = function registerFileControl() {
        const getMediaDir = () => {
        const settings = getSettings();
        return settings.MEDIA_DIR;
    };

    ipcMain.handle("file:createSerie", async (event, { serieName, metadata }) => {
        const MEDIA_DIR = getMediaDir(); 
        if (!MEDIA_DIR || !fs.existsSync(MEDIA_DIR)) {
            return { success: false, message: "Arşiv klasörü bulunamadı. Lütfen Ayarlar'dan seçiniz." };
        }
        
        const safeName = serieName.replace(/[<>:"/\\|?*]+/g, '');
        const fullPath = path.join(MEDIA_DIR, safeName);

        if (fs.existsSync(fullPath)) return { success: false, message: "Bu dizi zaten var!", path: fullPath };

        try {
            fs.mkdirSync(fullPath, { recursive: true });
            let localImagePath = null;            
            if (metadata.image) {
                const imageExt = path.extname(metadata.image) || '.jpg';
                const imageFileName = `poster${imageExt}`;
                const imageDest = path.join(fullPath, imageFileName);

                try {
                    if (metadata.image.startsWith('http')) {
                        await downloadImage(metadata.image, imageDest);
                    } else if (fs.existsSync(metadata.image)) {
                        fs.copyFileSync(metadata.image, imageDest);
                    }
                    
                    if (fs.existsSync(imageDest)) localImagePath = imageFileName;
                } catch (imgErr) {
                    console.error("Resim işleme hatası:", imgErr);
                }
            }

            const jsonContent = {
                ...metadata,
                folderName: safeName,
                localPoster: localImagePath,
                createdAt: new Date().toISOString()
            };
            
            fs.writeFileSync(path.join(fullPath, 'metadata.json'), JSON.stringify(jsonContent, null, 2));
            
            if (metadata.numberOfSeasons > 0) {
                for (let i = 1; i <= metadata.numberOfSeasons; i++) {
                    const seasonPath = path.join(fullPath, `Season ${i}`);
                    if (!fs.existsSync(seasonPath)) fs.mkdirSync(seasonPath);
                }
            }            
            try {
                db.syncFilesystemToDatabase(MEDIA_DIR, VIDEO_EXTS);
            } catch (dbErr) {
                console.error("DB Sync Hatası:", dbErr);
            }

            return { success: true, message: "Oluşturuldu", path: fullPath };

        } catch (err) {
            console.error("Kritik Hata:", err);
            return { success: false, message: "Hata", error: err.message };
        }
    });

    ipcMain.handle("file:createSeason", (event, data) => {
        const MEDIA_DIR = getMediaDir();
        if (!MEDIA_DIR || !fs.existsSync(MEDIA_DIR)) return { isExist: false, message: "Arşiv klasörü ayarlanmamış." };
        
        const fullPath = path.join(MEDIA_DIR, data.serieName, data.seasonId);
        
        try {
            fs.mkdirSync(fullPath, { recursive: true });
            db.syncFilesystemToDatabase(MEDIA_DIR, VIDEO_EXTS);
            return { isExist: true, message: "Oluşturuldu", path: fullPath };
        } catch (err) {
            return { isExist: false, message: "Hata", error: err.message };
        }
    });

    ipcMain.handle("file:addEpisode", (event, data) => {
        const MEDIA_DIR = getMediaDir();
        if (!MEDIA_DIR) return { ok: false, message: "Medya klasörü ayarlı değil" };

        const fullPath = path.join(MEDIA_DIR, data.serieName, data.seasonId);
        if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
        const eq = new episodeQueue(MEDIA_DIR); 
        
        eq.addVideos(
            data.videos.map(f => ({ ...f, filePath: f.path, destFolder: fullPath, event }))
        );
        
        setTimeout(() => {
             db.syncFilesystemToDatabase(MEDIA_DIR, VIDEO_EXTS);
        }, 3000);

        return { ok: true, message: "Kuyruğa eklendi" };
    });

    ipcMain.handle("file:getSeries", async () => {
        const MEDIA_DIR = getMediaDir();
        if (!MEDIA_DIR || !fs.existsSync(MEDIA_DIR)) return [];
        try {
            const items = fs.readdirSync(MEDIA_DIR);
            const seriesList = [];
            for (const item of items) {
                const itemPath = path.join(MEDIA_DIR, item);
                if (fs.statSync(itemPath).isDirectory()) {
                    const metaPath = path.join(itemPath, 'metadata.json');
                    if (fs.existsSync(metaPath)) {
                        const rawData = fs.readFileSync(metaPath);
                        const jsonData = JSON.parse(rawData);
                        if (jsonData.localPoster) {
                            jsonData.fullPosterPath = path.join(itemPath, jsonData.localPoster);
                        }
                        seriesList.push(jsonData);
                    }
                }
            }
            return seriesList;
        } catch (err) {
            console.error("Okuma hatası:", err);
            return [];
        }
    });

    ipcMain.handle("file:getSeriesDetail", async (event, folderName) => {
        const MEDIA_DIR = getMediaDir();
        if (!MEDIA_DIR) return { error: "Medya klasörü yok" };

        const seriePath = path.join(MEDIA_DIR, folderName);
        if (!fs.existsSync(seriePath)) return { error: "Dizi bulunamadı" };

        try {
            const metaPath = path.join(seriePath, 'metadata.json');
            let metadata = {};
            if (fs.existsSync(metaPath)) {
                metadata = JSON.parse(fs.readFileSync(metaPath));
                if (metadata.localPoster) {
                    metadata.fullPosterPath = path.join(seriePath, metadata.localPoster);
                }
            }

            const items = fs.readdirSync(seriePath);
            const seasons = items
                .filter(item => item.startsWith('Season') && fs.statSync(path.join(seriePath, item)).isDirectory())
                .sort((a, b) => {
                    const numA = parseInt(a.replace(/\D/g, '')) || 0;
                    const numB = parseInt(b.replace(/\D/g, '')) || 0;
                    return numA - numB;
                });

            return { ...metadata, seasons };
        } catch (err) {
            return { error: err.message };
        }
    });

    ipcMain.handle("file:getEpisodes", async (event, { folderName, season }) => {
        const MEDIA_DIR = getMediaDir();
        if (!MEDIA_DIR) return [];

        const seasonPath = path.join(MEDIA_DIR, folderName, season);
        if (!fs.existsSync(seasonPath)) return [];
        try {
            const files = fs.readdirSync(seasonPath);
            return files
                .filter(file => VIDEO_EXTS.includes(path.extname(file).toLowerCase()))
                .map(file => ({
                    name: file,
                    path: path.join(seasonPath, file),
                    size: fs.statSync(path.join(seasonPath, file)).size
                }));
        } catch (err) {
            return [];
        }
    });

    ipcMain.handle("file:deleteSerie", async (event, folderName) => {
        const MEDIA_DIR = getMediaDir();
        const targetPath = path.join(MEDIA_DIR, folderName);
        if (!fs.existsSync(targetPath)) return { success: false, message: "Klasör yok" };
        try {
            fs.rmSync(targetPath, { recursive: true, force: true });
            db.deleteSeriesByPath(targetPath);
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    });

    ipcMain.handle("file:deleteSeason", async (event, { folderName, season }) => {
        const MEDIA_DIR = getMediaDir();
        const targetPath = path.join(MEDIA_DIR, folderName, season);
        try {
            fs.rmSync(targetPath, { recursive: true, force: true });
            db.deleteSeasonByPath(targetPath);
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    });

    ipcMain.handle("file:deleteEpisode", async (event, filePath) => {
        try {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            db.deleteEpisodeByPath(filePath);
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    });

    ipcMain.handle("file:syncDatabase", async () => {
        const MEDIA_DIR = getMediaDir();
        if (!MEDIA_DIR) return { success: false, error: "Medya klasörü ayarlanmamış" };
        
        try {
            db.syncFilesystemToDatabase(MEDIA_DIR, VIDEO_EXTS);
            return { success: true, message: "Senkronizasyon tamamlandı." };
        } catch (err) {
            return { success: false, error: err.message };
        }
    });
    ipcMain.handle("file:fetchMetadata", async (event, { imdbId, lang }) => {
        const settings = getSettings();
        const apiKey = settings.TMDB_API_KEY || settings.VITE_TMDB_API_KEY;
        const language = lang || 'tr-TR';

        if (!apiKey) return { success: false, message: "API Key bulunamadı." };

        try {
            const findUrl = `https://api.themoviedb.org/3/find/${imdbId}?api_key=${apiKey}&external_source=imdb_id&language=${language}`;
            const findRes = await axios.get(findUrl);
            const findData = findRes.data;

            let mediaType, tmdbId;
            if (findData.tv_results?.length > 0) {
                mediaType = 'tv';
                tmdbId = findData.tv_results[0].id;
            } else if (findData.movie_results?.length > 0) {
                mediaType = 'movie';
                tmdbId = findData.movie_results[0].id;
            } else {
                return { success: false, message: "TMDB'de içerik bulunamadı." };
            }
            const detailUrl = `https://api.themoviedb.org/3/${mediaType}/${tmdbId}?api_key=${apiKey}&language=${language}`;
            const detailRes = await axios.get(detailUrl);
            
            return { success: true, data: detailRes.data, mediaType };
            
        } catch (error) {
            console.error("TMDB Fetch Error:", error.message);
            return { success: false, message: "TMDB bağlantı hatası." };
        }
    });
};