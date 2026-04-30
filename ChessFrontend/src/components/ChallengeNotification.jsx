import { useLanguage } from '../i18n/LanguageContext';

export default function ChallengeNotification({ challenge, onAccept, onDecline }) {
  const { t } = useLanguage();

  const formatTimeRemaining = (expiresAt) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = Math.max(0, Math.floor((expires - now) / 1000));
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      position: 'fixed',
      top: '80px',
      right: '20px',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      border: '2px solid #d4af37',
      borderRadius: '12px',
      padding: '20px',
      maxWidth: '350px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8)',
      zIndex: 1000,
      animation: 'slideIn 0.3s ease-out'
    }}>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>

      <div style={{ fontSize: '32px', textAlign: 'center', marginBottom: '12px' }}>⚔️</div>
      <h3 style={{ color: '#d4af37', marginBottom: '8px', fontSize: '18px', textAlign: 'center' }}>
        {t('challenge.received')}
      </h3>
      <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '16px', textAlign: 'center' }}>
        {t('challenge.from')} <strong style={{ color: '#fff' }}>{challenge.challengerUsername}</strong>
      </p>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '16px',
        padding: '12px',
        background: 'var(--color-background)',
        borderRadius: '8px'
      }}>
        <div>
          <div style={{ color: '#888', fontSize: '12px' }}>{t('matchmaking.timeControl')}</div>
          <div style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>{challenge.timeControl}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#888', fontSize: '12px' }}>Time</div>
          <div style={{ color: '#ff9800', fontSize: '16px', fontWeight: 'bold' }}>
            {formatTimeRemaining(challenge.expiresAt)}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => onAccept(challenge.id)}
          style={{
            flex: 1,
            padding: '12px',
            fontSize: '14px',
            background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          ✓ {t('challenge.accept')}
        </button>

        <button
          onClick={() => onDecline(challenge.id)}
          style={{
            flex: 1,
            padding: '12px',
            fontSize: '14px',
            background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          ✗ {t('challenge.decline')}
        </button>
      </div>
    </div>
  );
}
