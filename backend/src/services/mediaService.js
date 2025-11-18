const fs = require('fs');
const path = require('path');
const { MEDIA_DIR } = require('../config/config');
const { VIDEO_EXTS } = require('../constants');
const database =require('../config/database');
const dbPath= path.join(__dirname,'../../database.db');
const db = new database(dbPath);

function initializeDatabase() {
  try {
    db.syncFilesystemToDatabase(MEDIA_DIR, VIDEO_EXTS);
    console.log('Database synchronized with filesystem');
  } catch (error) {
    console.error('Failed to sync database:', error);
  }
}
// Dizileri getir
function getSeries(userId = null) {
  initializeDatabase();
  try {
    if (userId) {
      const seriesWithProgress = db.getSeriesWithUserProgress(userId);
      return seriesWithProgress.map(series => ({
        id: series.SERIE_ID,
        title: series.SERIE_NAME,
        count: series.total_episodes,
        watched: series.watched_episodes,
        completion: series.completion_percentage,
        episodes: getEpisodesBySeries(series.SERIE_ID, userId)
      }));
    } else {
      const allSeries = db.getAllSeries();
      return allSeries.map(series => ({
        id: series.SERIE_ID,
        title: series.SERIE_NAME,
        count: series.episode_count,
        episodes: getEpisodesBySeries(series.SERIE_ID)
      }));
    }
  } catch (error) {
    console.error('Error getting series:', error);
    throw error;
  }
}
function getEpisodesBySeries(serieId, userId = null) {
  try {
    const episodes = db.getEpisodesBySeries(serieId);
    
    if (userId) {
      return episodes.map(episode => {
        const progress = db.getUserEpisodeProgress(userId, episode.EPISODE_ID);
        return {
          id: episode.EPISODE_ID,
          name: episode.EPISODE_NAME,
          number: episode.EPISODE_NUMBER,
          relPath: `${episode.SERIE_NAME}/${episode.EPISODE_NAME}`,
          watched: progress ? progress.PROGRESS >= 1.0 : false,
          progress: progress ? progress.PROGRESS : 0,
          watchTime: progress ? progress.WATCH_TIME : 0
        };
      });
    } else {
      return episodes.map(episode => ({
        id: episode.EPISODE_ID,
        name: episode.EPISODE_NAME,
        number: episode.EPISODE_NUMBER,
        relPath: `${episode.SERIE_NAME}/${episode.EPISODE_NAME}`,
        watched: false
      }));
    }
  } catch (error) {
    console.error('Error getting episodes:', error);
    throw error;
  }
}

module.exports = {
  getSeries,
  getEpisodesBySeries,
  initializeDatabase,
  db 
};