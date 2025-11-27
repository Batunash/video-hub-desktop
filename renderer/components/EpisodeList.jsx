import React from 'react';
import { useTranslation } from 'react-i18next';

const EpisodeList = ({ episodes, activeSeason, onUpload, onDelete, uploadDisabled }) => {
  const { t } = useTranslation();

  return (
    <div style={styles.episodeSection}>
        <div style={styles.header}>
            <h3 style={{color: 'white', margin:0}}>
                {t('detail.episodes_title', { season: activeSeason })}
            </h3>
            {!uploadDisabled && (
                <button style={styles.uploadBtn} onClick={onUpload}>{t('detail.upload_file')}</button>
            )}
        </div>

        {episodes.length > 0 ? (
            <div style={styles.episodeGrid}>
                {episodes.map((ep, index) => (
                    <div key={index} style={styles.episodeCard}>
                        <div style={styles.epIcon}>▶</div>
                        <div style={{overflow:'hidden', flex: 1}}>
                            <div style={styles.epName}>{ep.name}</div>
                            <div style={styles.epSize}>{(ep.size / (1024*1024)).toFixed(1)} MB</div>
                        </div>
                         <button 
                            style={styles.deleteEpBtn}
                            onClick={() => onDelete(ep.path)}
                            title={t('common.delete')}
                        >
                            🗑️
                        </button>
                    </div>
                ))}
            </div>
        ) : (
            <div style={styles.emptyState}>{t('detail.empty_season')}</div>
        )}
    </div>
  );
};

const styles = {
  episodeSection: { animation: 'fadeIn 0.5s' },
  header: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 20 },
  uploadBtn: { backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  episodeGrid: { display: 'flex', flexDirection: 'column', gap: '10px' },
  episodeCard: { display: 'flex', alignItems: 'center', gap: '15px', backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '8px', border: '1px solid #333', cursor: 'pointer', transition: 'background 0.2s' },
  epIcon: { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' },
  epName: { fontWeight: '500', fontSize: '1rem', marginBottom: '4px' },
  epSize: { fontSize: '0.8rem', color: '#666' },
  deleteEpBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', opacity: 0.7, padding: '5px', transition: 'opacity 0.2s' },
  emptyState: { padding: '40px', textAlign: 'center', color: '#555', border: '2px dashed #333', borderRadius: '12px' },
};

export default EpisodeList;