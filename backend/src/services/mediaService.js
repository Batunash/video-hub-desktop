const fs = require('fs');
const path = require('path');
const { MEDIA_DIR } = require('../config/config');
const { VIDEO_EXTS } = require('../constants') || { VIDEO_EXTS: ['.mp4', '.mkv', '.avi'] };
const db = require('../config/database'); 

function initializeDatabase() {
  try {
    db.syncFilesystemToDatabase(MEDIA_DIR, VIDEO_EXTS);
    console.log('Database synchronized');
  } catch (error) {
    console.error('Sync error:', error);
  }
}

function getSeries(userId = null) {
  try {
    const seriesList = userId ? db.getSeriesWithUserProgress(userId) : db.getAllSeries();
    
    return seriesList.map(series => ({
      id: series.ID,
      title: series.TITLE,
      poster: series.POSTER_PATH,
      backdrop: series.BACKDROP_PATH,
      rating: series.RATING,
      overview: series.OVERVIEW,
      episodes: getEpisodesBySeries(series.ID, userId)
    }));
  } catch (error) {
    console.error('Error getting series:', error);
    throw error;
  }
}

function getEpisodesBySeries(serieId, userId = null) {
  try {
    const episodes = db.getEpisodesBySeries(serieId);
    
    return episodes.map(episode => {
      let progress = null;
      if (userId) progress = db.getUserEpisodeProgress(userId, episode.EPISODE_ID);
      
      return {
        id: episode.EPISODE_ID,
        name: episode.EPISODE_NAME,
        number: episode.EPISODE_NUMBER,
        season: episode.SEASON_NUMBER,
        relPath: `${episode.SERIE_NAME}/${episode.EPISODE_NAME}`,
        streamUrl: `/api/stream/${episode.EPISODE_ID}`,
        watched: progress ? progress.PROGRESS >= 0.9 : false,
        progress: progress ? progress.PROGRESS : 0,
        watchTime: progress ? progress.WATCH_TIME : 0
      };
    });
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