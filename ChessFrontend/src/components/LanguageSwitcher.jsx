import { useLanguage } from '../i18n/LanguageContext';

export default function LanguageSwitcher() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      className="language-switcher"
      style={{
        background: 'var(--color-surface)',
        border: '2px solid var(--color-border)',
        borderRadius: '8px',
        padding: '6px 10px',
        color: '#fff',
        cursor: 'pointer',
        fontSize: '20px',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '48px',
        height: '40px'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(212, 175, 55, 0.1)';
        e.currentTarget.style.borderColor = '#d4af37';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--color-surface)';
        e.currentTarget.style.borderColor = 'var(--color-border)';
      }}
      title={language === 'en' ? 'Switch to Russian' : 'Переключить на английский'}
    >
      {language === 'en' ? '🇬🇧' : '🇷🇺'}
    </button>
  );
}
