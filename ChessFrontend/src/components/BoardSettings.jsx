import { useState } from 'react';
import { GiChessKnight } from 'react-icons/gi';

export default function BoardSettings({ settings, onSettingsChange, onClose }) {
  const [localSettings, setLocalSettings] = useState(settings);

  const themes = [
    { id: 'gold', name: 'Gold & Black', emoji: '👑' },
    { id: 'brown', name: 'Classic Brown', emoji: '🟤' },
    { id: 'blue', name: 'Ocean Blue', emoji: '🌊' },
    { id: 'green', name: 'Forest Green', emoji: '🌲' },
    { id: 'purple', name: 'Royal Purple', emoji: '💜' }
  ];

  const sizes = [
    { id: 'small', name: 'Small', size: '400px' },
    { id: 'medium', name: 'Medium', size: '600px' },
    { id: 'large', name: 'Large', size: '800px' }
  ];

  const handleChange = (key, value) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
  };

  const handleSave = () => {
    onSettingsChange(localSettings);
    localStorage.setItem('boardSettings', JSON.stringify(localSettings));
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border-gold)',
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 8px 32px rgba(212, 175, 55, 0.3)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '32px'
        }}>
          <GiChessKnight size={32} style={{ color: '#d4af37' }} />
          <h2 style={{
            fontSize: '24px',
            color: '#d4af37',
            margin: 0
          }}>
            Board Settings
          </h2>
        </div>

        {/* Theme Selection */}
        <div style={{ marginBottom: '32px' }}>
          <label style={{
            display: 'block',
            marginBottom: '12px',
            color: 'var(--color-text-primary)',
            fontSize: '16px',
            fontWeight: '600'
          }}>
            Board Theme
          </label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px'
          }}>
            {themes.map(theme => (
              <button
                key={theme.id}
                onClick={() => handleChange('theme', theme.id)}
                style={{
                  padding: '16px',
                  background: localSettings.theme === theme.id 
                    ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.1) 100%)'
                    : 'var(--color-background)',
                  border: localSettings.theme === theme.id 
                    ? '2px solid #d4af37' 
                    : '1px solid var(--color-border)',
                  borderRadius: '8px',
                  color: 'var(--color-text-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>{theme.emoji}</div>
                <div style={{ fontSize: '13px', fontWeight: '500' }}>{theme.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Size Selection */}
        <div style={{ marginBottom: '32px' }}>
          <label style={{
            display: 'block',
            marginBottom: '12px',
            color: 'var(--color-text-primary)',
            fontSize: '16px',
            fontWeight: '600'
          }}>
            Board Size
          </label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px'
          }}>
            {sizes.map(size => (
              <button
                key={size.id}
                onClick={() => handleChange('size', size.id)}
                style={{
                  padding: '12px',
                  background: localSettings.size === size.id 
                    ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.1) 100%)'
                    : 'var(--color-background)',
                  border: localSettings.size === size.id 
                    ? '2px solid #d4af37' 
                    : '1px solid var(--color-border)',
                  borderRadius: '8px',
                  color: 'var(--color-text-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                {size.name}
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                  {size.size}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Show Coordinates Toggle */}
        <div style={{ marginBottom: '32px' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            background: 'var(--color-background)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            cursor: 'pointer'
          }}>
            <div>
              <div style={{
                color: 'var(--color-text-primary)',
                fontSize: '16px',
                fontWeight: '600',
                marginBottom: '4px'
              }}>
                Show Coordinates
              </div>
              <div style={{
                color: 'var(--color-text-secondary)',
                fontSize: '13px'
              }}>
                Display A-H and 1-8 labels
              </div>
            </div>
            <input
              type="checkbox"
              checked={localSettings.showCoordinates}
              onChange={(e) => handleChange('showCoordinates', e.target.checked)}
              style={{
                width: '20px',
                height: '20px',
                cursor: 'pointer',
                accentColor: '#d4af37'
              }}
            />
          </label>
        </div>

        {/* Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px'
        }}>
          <button
            onClick={handleSave}
            className="btn-primary"
            style={{
              flex: 1,
              padding: '14px'
            }}
          >
            Save Settings
          </button>
          <button
            onClick={onClose}
            className="btn-outline"
            style={{
              flex: 1,
              padding: '14px'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
