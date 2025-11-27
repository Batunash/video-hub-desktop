import { formatTmdbData } from '../utils/formatters';

const getApiKeyFromSettings = async () => {
    const settings = await window.api.invoke('settings:get');
    return settings.TMDB_API_KEY || settings.VITE_TMDB_API_KEY || '';      
}

const BASE_URL = "https://api.themoviedb.org/3";

export const fetchSeriesByImdb = async (imdbId) => {
  const API_KEY = await getApiKeyFromSettings();
  
  if (!API_KEY) {
      throw new Error("TMDB API Key eksik. Lütfen Ayarlar'dan giriniz.");
  }
  
  try {
    const findResponse = await fetch(
      `${BASE_URL}/find/${imdbId}?api_key=${API_KEY}&external_source=imdb_id&language=tr-TR`
    );
    
    if (!findResponse.ok) throw new Error("Find API hatası");
    const findData = await findResponse.json();
    let mediaType;
    let tmdbId;

    if (findData.tv_results?.length > 0) {
        mediaType = 'tv';
        tmdbId = findData.tv_results[0].id;
    } else if (findData.movie_results?.length > 0) {
        mediaType = 'movie';
        tmdbId = findData.movie_results[0].id;
    } else {
        return null; 
    }
    const detailResponse = await fetch(
      `${BASE_URL}/${mediaType}/${tmdbId}?api_key=${API_KEY}&language=tr-TR`
    );
    
    if (!detailResponse.ok) {  
        throw new Error(`Detay çekilemedi (Kod: ${detailResponse.status})`);
    }    
    const detailData = await detailResponse.json();
    const finalFormatted = formatTmdbData(detailData, imdbId);
    finalFormatted.type = mediaType; 
    return finalFormatted;
    
  } catch (error) {
    console.error("TMDB Service Error:", error);
    throw error;
  }
};