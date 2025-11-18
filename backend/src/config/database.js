const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
class database {
  constructor(dbPath = null) {
     
    if (!dbPath) {
      dbPath = path.join(__dirname, '../../database.db');
    }
    
    this.db = new Database(dbPath);
    this.initializeTables();
  }

  initializeTables() {

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS SERIES (
        SERIE_ID INTEGER PRIMARY KEY AUTOINCREMENT,
        SERIE_NAME TEXT NOT NULL UNIQUE,
        SERIE_PATH TEXT NOT NULL,
        CREATED_AT DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS EPISODES (
        EPISODE_ID INTEGER PRIMARY KEY AUTOINCREMENT,
        SERIE_ID INTEGER NOT NULL,
        EPISODE_NUMBER INTEGER NOT NULL,
        EPISODE_NAME TEXT NOT NULL,
        FILE_PATH TEXT NOT NULL,
        FILE_SIZE INTEGER,
        DURATION INTEGER,
        CREATED_AT DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (SERIE_ID) REFERENCES SERIES(SERIE_ID) ON DELETE CASCADE,
        UNIQUE(SERIE_ID, EPISODE_NUMBER)
      )
    `);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS USER (
        USER_ID INTEGER PRIMARY KEY AUTOINCREMENT,
        USER_NAME TEXT NOT NULL UNIQUE,
        USER_PASSWORD TEXT NOT NULL,
        CREATED_AT DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS USER_EPISODE (
        USER_ID INTEGER NOT NULL,
        EPISODE_ID INTEGER NOT NULL,
        WATCHED_AT DATETIME DEFAULT CURRENT_TIMESTAMP,
        PROGRESS REAL DEFAULT 0.0 CHECK (PROGRESS >= 0 AND PROGRESS <= 1),
        WATCH_TIME INTEGER DEFAULT 0,
        PRIMARY KEY (USER_ID, EPISODE_ID),
        FOREIGN KEY (USER_ID) REFERENCES USER(USER_ID) ON DELETE CASCADE,
        FOREIGN KEY (EPISODE_ID) REFERENCES EPISODES(EPISODE_ID) ON DELETE CASCADE
      )
    `);
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_episodes_serie_id ON EPISODES(SERIE_ID);
      CREATE INDEX IF NOT EXISTS idx_user_episode_user_id ON USER_EPISODE(USER_ID);
      CREATE INDEX IF NOT EXISTS idx_user_episode_episode_id ON USER_EPISODE(EPISODE_ID);
    `);
  }

  // SERIES TABLE OPERATIONS
  addSeries(serieName, seriePath) {
    const stmt = this.db.prepare('INSERT INTO SERIES (SERIE_NAME, SERIE_PATH) VALUES (?, ?)');
    return stmt.run(serieName, seriePath);
  }

  getAllSeries() {
    const stmt = this.db.prepare(`
      SELECT s.*, COUNT(e.EPISODE_ID) as episode_count
      FROM SERIES s
      LEFT JOIN EPISODES e ON s.SERIE_ID = e.SERIE_ID
      GROUP BY s.SERIE_ID, s.SERIE_NAME, s.SERIE_PATH
      ORDER BY s.SERIE_NAME
    `);
    return stmt.all();
  }

  getSeriesById(serieId) {
    const stmt = this.db.prepare('SELECT * FROM SERIES WHERE SERIE_ID = ?');
    return stmt.get(serieId);
  }

  getSeriesByName(serieName) {
    const stmt = this.db.prepare('SELECT * FROM SERIES WHERE SERIE_NAME = ?');
    return stmt.get(serieName);
  }

  // EPISODES TABLES OPERATION
  addEpisode(serieId, episodeNumber, episodeName, filePath, fileSize = null) {
    const stmt = this.db.prepare(`
      INSERT INTO EPISODES (SERIE_ID, EPISODE_NUMBER, EPISODE_NAME, FILE_PATH, FILE_SIZE) 
      VALUES (?, ?, ?, ?, ?)
    `);
    return stmt.run(serieId, episodeNumber, episodeName, filePath, fileSize);
  }

  getEpisodesBySeries(serieId) {
    const stmt = this.db.prepare(`
      SELECT e.*, s.SERIE_NAME, s.SERIE_PATH 
      FROM EPISODES e 
      JOIN SERIES s ON e.SERIE_ID = s.SERIE_ID 
      WHERE e.SERIE_ID = ? 
      ORDER BY e.EPISODE_NUMBER
    `);
    return stmt.all(serieId);
  }

  getEpisodeBySeriesAndFile(seriesName, fileName) {
    const stmt = this.db.prepare(`
      SELECT e.*, s.SERIE_NAME, s.SERIE_PATH 
      FROM EPISODES e 
      JOIN SERIES s ON e.SERIE_ID = s.SERIE_ID 
      WHERE s.SERIE_NAME = ? AND e.EPISODE_NAME = ?
    `);
    return stmt.get(seriesName, fileName);
  }

  // USER TABLE OPERATIONS
  addUser(userName, password) {
    const stmt = this.db.prepare('INSERT INTO USER (USER_NAME, USER_PASSWORD) VALUES (?, ?)');
    return stmt.run(userName, password);
  }

  getUserById(userId) {
    const stmt = this.db.prepare('SELECT USER_ID, USER_NAME FROM USER WHERE USER_ID = ?');
    return stmt.get(userId);
  }
  getUserByUsername(userName){
    const stmt = this.db.prepare('SELECT * FROM USER WHERE USER_NAME = ?');
    return stmt.get(userName);
  }

  // USER_EPISODE TABLE OPERATIONS
  updateWatchProgress(userId, episodeId, progress, watchTime = 0) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO USER_EPISODE (USER_ID, EPISODE_ID, WATCHED_AT, PROGRESS, WATCH_TIME) 
      VALUES (?, ?, CURRENT_TIMESTAMP, ?, ?)
    `);
    return stmt.run(userId, episodeId, progress, watchTime);
  }

  getUserEpisodeProgress(userId, episodeId) {
    const stmt = this.db.prepare(`
      SELECT * FROM USER_EPISODE 
      WHERE USER_ID = ? AND EPISODE_ID = ?
    `);
    return stmt.get(userId, episodeId);
  }

  getSeriesWithUserProgress(userId) {
    const stmt = this.db.prepare(`
      SELECT 
        s.*,
        COUNT(e.EPISODE_ID) as total_episodes,
        COUNT(ue.EPISODE_ID) as watched_episodes,
        ROUND(COALESCE(COUNT(ue.EPISODE_ID) * 100.0 / COUNT(e.EPISODE_ID), 0), 2) as completion_percentage
      FROM SERIES s
      LEFT JOIN EPISODES e ON s.SERIE_ID = e.SERIE_ID
      LEFT JOIN USER_EPISODE ue ON e.EPISODE_ID = ue.EPISODE_ID AND ue.USER_ID = ?
      GROUP BY s.SERIE_ID
      ORDER BY s.SERIE_NAME
    `);
    return stmt.all(userId);
  }

  // ARCHIVE SYNC OPERATIONS
  syncFilesystemToDatabase(mediaDir, videoExts) {
    const transaction = this.db.transaction(() => {
      const dirents = fs.readdirSync(mediaDir, { withFileTypes: true });
      
      dirents.filter(d => d.isDirectory()).forEach(d => {
        const seriesPath = path.join(mediaDir, d.name);
        
        // Add or update series
        let series = this.getSeriesByName(d.name);
        if (!series) {
          const result = this.addSeries(d.name, seriesPath);
          series = { SERIE_ID: result.lastInsertRowid, SERIE_NAME: d.name, SERIE_PATH: seriesPath };
        }

        // Get video files in series directory
        const files = fs.readdirSync(seriesPath, { withFileTypes: true })
          .filter(f => f.isFile() && videoExts.includes(path.extname(f.name).toLowerCase()));

        files.forEach((f, index) => {
          const filePath = path.join(seriesPath, f.name);
          const fileStats = fs.statSync(filePath);
          
          // Check if episode already exists
          const existingEpisode = this.db.prepare(`
            SELECT * FROM EPISODES 
            WHERE SERIE_ID = ? AND EPISODE_NAME = ?
          `).get(series.SERIE_ID, f.name);

          if (!existingEpisode) {
            this.addEpisode(
              series.SERIE_ID,
              index + 1, // Episode number based on file order
              f.name,
              filePath,
              fileStats.size
            );
          }
        });
      });
    });

    transaction();
  }

  close() {
    this.db.close();
  }
}

module.exports = database;