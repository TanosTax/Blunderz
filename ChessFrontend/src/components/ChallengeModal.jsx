import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

export default function ChallengeModal({ friendUsername, onSend, onClose }) {
  const { t } = useLanguage();
  const [timeControl, setTimeControl] = useState('10+0');

  const handleSend = () => {
    onSend(timeControl);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        borderRadius: '12px',
        padding: '40px',
        maxWidth: '400px',
        width: '90%',
        textAlign: 'center',
        boxShadow: '0 0 30px rgba(212, 175, 55, 0.3)',
        border: '2px solid #d4af37'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚔️</div>
        <h2 style={{ marginBottom: '10px', fontSize: '24px', color: '#d4af37' }}>
          {t('challenge.title')}
        </h2>
        <p style={{ color: '#aaa', fontSize: '16px', marginBottom: '30px' }}>
          {friendUsername}
        </p>

        <div style={{ marginBottom: '30px', textAlign: 'left' }}>
          <label style={{
            display: 'block',
            marginBottom: '12px',
            color: 'var(--color-text-primary)',
            fontSize: '16px',
            fontWeight: '500'
          }}>
            {t('challenge.selectTimeControl')}
          </label>
          <select
            value={timeControl}
            onChange={(e) => setTimeControl(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'var(--color-background)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              color: 'var(--color-text-primary)',
              fontSize: '15px',
              cursor: 'pointer'
            }}
          >
            <option value="1+0">⚡ {t('matchmaking.bullet')} (1+0)</option>
            <option value="3+0">⚡ {t('matchmaking.blitz')} (3+0)</option>
            <option value="5+0">⚡ {t('matchmaking.blitz')} (5+0)</option>
            <option value="10+0">🎯 {t('matchmaking.rapid')} (10+0)</option>
            <option value="15+10">🎯 {t('matchmaking.rapid')} (15+10)</option>
            <option value="30+0">♟️ {t('matchmaking.classical')} (30+0)</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={handleSend}
            style={{
              padding: '15px 30px',
              fontSize: '16px',
              background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            ⚔️ {t('challenge.sendChallenge')}
          </button>

          <button
            onClick={onClose}
            style={{
              padding: '12px 30px',
              fontSize: '14px',
              backgroundColor: 'transparent',
              color: '#888',
              border: '1px solid #444',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            {t('challenge.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
