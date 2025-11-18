const mediaService = require('../services/mediaService');

// /series endpointi
async function listSeries(req, res) {
  try {
    const userId = req.user?.id; 
    const series = mediaService.getSeries(userId);
    res.json({ series });
  } catch (e) {s
    console.error(e);
    res.status(500).json({ error: 'SERIES_LIST_FAILED' });
  }
}
async function getSeriesEpisodes(req, res) {
  try {
    const { seriesId } = req.params;
    const userId = req.user?.id;
    const episodes = mediaService.getEpisodesBySeries(seriesId, userId);
    res.json({ episodes });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'EPISODES_LIST_FAILED' });
  }
}
module.exports = {
  listSeries,
  getSeriesEpisodes
};
