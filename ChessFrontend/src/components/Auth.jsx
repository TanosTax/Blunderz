import { useState } from 'react';
import { GiChessKnight } from 'react-icons/gi';
import apiService from '../services/apiService';

export default function Auth({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let userData;
      if (isLogin) {
        userData = await apiService.login(username, password);
      } else {
        userData = await apiService.register(username, password, email);
      }
      
      // Сохраняем в localStorage
      localStorage.setItem('userId', userData.userId);
      localStorage.setItem('username', userData.username);
      localStorage.setItem('isAnonymous', userData.isAnonymous);
      
      onAuthSuccess(userData);
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const userData = await apiService.createGuest();
      
      // Сохраняем в localStorage
      localStorage.setItem('userId', userData.userId);
      localStorage.setItem('username', userData.username);
      localStorage.setItem('isAnonymous', 'true');
      
      // Передаем флаг, что это гость и нужно сразу в матчмейкинг
      onAuthSuccess({ ...userData, isGuest: true });
    } catch (err) {
      setError('Failed to create guest account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '450px',
        width: '100%',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '16px',
        padding: '48px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Gold accent line */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, transparent 0%, #d4af37 50%, transparent 100%)'
        }} />

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-block',
            padding: '16px',
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%)',
            borderRadius: '16px',
            border: '2px solid #d4af37',
            marginBottom: '16px'
          }}>
            <GiChessKnight 
              size={60} 
              style={{ 
                color: '#d4af37',
                filter: 'drop-shadow(0 0 15px rgba(212, 175, 55, 0.6))'
              }} 
            />
          </div>
          <h1 style={{
            fontSize: '32px',
            marginBottom: '8px',
            background: 'linear-gradient(135deg, #f4d03f 0%, #d4af37 50%, #b8941e 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: '700'
          }}>
            Blunderz
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px' }}>
            {isLogin ? 'Welcome back!' : 'Create your account'}
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '32px',
          background: 'var(--color-background)',
          padding: '4px',
          borderRadius: '10px'
        }}>
          <button
            onClick={() => setIsLogin(true)}
            style={{
              flex: 1,
              padding: '12px',
              background: isLogin ? 'linear-gradient(135deg, #f4d03f 0%, #d4af37 100%)' : 'transparent',
              color: isLogin ? '#000000' : 'var(--color-text-secondary)',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            style={{
              flex: 1,
              padding: '12px',
              background: !isLogin ? 'linear-gradient(135deg, #f4d03f 0%, #d4af37 100%)' : 'transparent',
              color: !isLogin ? '#000000' : 'var(--color-text-secondary)',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            Register
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: 'var(--color-text-primary)',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                color: 'var(--color-text-primary)',
                fontSize: '15px',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#d4af37'}
              onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
            />
          </div>

          {!isLogin && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: 'var(--color-text-primary)',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Email (optional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'var(--color-background)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  color: 'var(--color-text-primary)',
                  fontSize: '15px',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#d4af37'}
                onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
              />
            </div>
          )}

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: 'var(--color-text-primary)',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                color: 'var(--color-text-primary)',
                fontSize: '15px',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#d4af37'}
              onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
            />
          </div>

          {error && (
            <div style={{
              padding: '12px',
              background: 'rgba(139, 0, 0, 0.1)',
              border: '1px solid #8b0000',
              borderRadius: '8px',
              color: '#ff6b6b',
              fontSize: '14px',
              marginBottom: '20px'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '14px',
              marginBottom: '16px'
            }}
          >
            {loading ? 'Loading...' : (isLogin ? 'Login' : 'Create Account')}
          </button>
        </form>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          margin: '24px 0'
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
          <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
        </div>

        {/* Guest button */}
        <button
          onClick={handleGuestLogin}
          disabled={loading}
          className="btn-outline"
          style={{
            width: '100%',
            padding: '14px'
          }}
        >
          🎭 Play as Guest
        </button>

        <p style={{
          marginTop: '24px',
          textAlign: 'center',
          color: 'var(--color-text-muted)',
          fontSize: '13px'
        }}>
          Guest accounts can play but won't save progress
        </p>
      </div>
    </div>
  );
}
