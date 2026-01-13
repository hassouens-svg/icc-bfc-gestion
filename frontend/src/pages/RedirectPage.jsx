import React, { useEffect, useState } from 'react';

const RedirectPage = () => {
  const [countdown, setCountdown] = useState(10);
  const newDomain = 'https://mychurchiccapp.com';
  
  useEffect(() => {
    // Countdown timer and auto-redirect
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = newDomain;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e3a8a 0%, #581c87 50%, #312e81 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none'
      }}>
        <div style={{
          position: 'absolute',
          top: '25%',
          left: '25%',
          width: '384px',
          height: '384px',
          background: 'rgba(59, 130, 246, 0.2)',
          borderRadius: '50%',
          filter: 'blur(60px)'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '25%',
          right: '25%',
          width: '384px',
          height: '384px',
          background: 'rgba(147, 51, 234, 0.2)',
          borderRadius: '50%',
          filter: 'blur(60px)'
        }}></div>
      </div>
      
      <div style={{
        position: 'relative',
        zIndex: 10,
        maxWidth: '672px',
        width: '100%'
      }}>
        {/* Main Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(16px)',
          borderRadius: '24px',
          padding: '48px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          {/* Logo/Icon */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #facc15 0%, #f97316 100%)',
              borderRadius: '50%',
              marginBottom: '16px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            }}>
              <span style={{ fontSize: '40px' }}>⛪</span>
            </div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: 'white',
              marginBottom: '8px',
              margin: '0 0 8px 0'
            }}>
              Nouvelle Adresse !
            </h1>
            <p style={{
              color: '#93c5fd',
              fontSize: '18px',
              margin: 0
            }}>
              Impact Centre Chrétien BFC-ITALIE
            </p>
          </div>
          
          {/* Message principal */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{ flexShrink: 0 }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: 'rgba(34, 197, 94, 0.2)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ fontSize: '24px' }}>🎉</span>
                </div>
              </div>
              <div>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: 'white',
                  marginBottom: '8px',
                  margin: '0 0 8px 0'
                }}>
                  Bonne nouvelle !
                </h2>
                <p style={{
                  color: '#dbeafe',
                  lineHeight: 1.6,
                  margin: 0
                }}>
                  Notre application a désormais son <strong style={{ color: '#fde047' }}>propre nom de domaine</strong>. 
                  Veuillez mettre à jour vos favoris avec notre nouvelle adresse.
                </p>
              </div>
            </div>
          </div>
          
          {/* Message important */}
          <div style={{
            background: 'rgba(59, 130, 246, 0.2)',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '32px',
            border: '1px solid rgba(96, 165, 250, 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <span style={{ fontSize: '24px' }}>ℹ️</span>
              <div>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: 'white',
                  marginBottom: '8px',
                  margin: '0 0 8px 0'
                }}>
                  Rien ne change, juste le lien d'accès !
                </h3>
                <ul style={{
                  color: '#dbeafe',
                  margin: 0,
                  padding: 0,
                  listStyle: 'none',
                  fontSize: '14px'
                }}>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ color: '#4ade80' }}>✓</span>
                    <span>Toutes vos données sont <strong style={{ color: 'white' }}>conservées</strong></span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ color: '#4ade80' }}>✓</span>
                    <span>L'application reste <strong style={{ color: 'white' }}>identique</strong></span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <span style={{ color: '#facc15' }}>⚠️</span>
                    <span>Si vous aviez des identifiants, vous devrez <strong style={{ color: '#fde047' }}>vous reconnecter</strong> une seule fois sur le nouveau lien</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* New Domain Link */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <p style={{
              color: '#93c5fd',
              marginBottom: '12px',
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              margin: '0 0 12px 0'
            }}>
              Notre nouvelle adresse
            </p>
            <a 
              href={newDomain}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                background: 'linear-gradient(135deg, #facc15 0%, #f97316 100%)',
                color: '#111827',
                fontWeight: 'bold',
                fontSize: '24px',
                padding: '16px 32px',
                borderRadius: '12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                textDecoration: 'none',
                transition: 'transform 0.3s, box-shadow 0.3s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
              }}
            >
              <span>🌐</span>
              <span>mychurchiccapp.com</span>
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
          </div>
          
          {/* Countdown */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '8px 16px',
              borderRadius: '9999px'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                background: '#4ade80',
                borderRadius: '50%',
                animation: 'pulse 2s infinite'
              }}></div>
              <span style={{ color: '#93c5fd', fontSize: '14px' }}>
                Redirection automatique dans <span style={{ color: 'white', fontWeight: 'bold' }}>{countdown}</span> secondes
              </span>
            </div>
          </div>
          
          {/* Footer */}
          <div style={{
            marginTop: '32px',
            paddingTop: '24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            textAlign: 'center'
          }}>
            <p style={{
              color: 'rgba(147, 197, 253, 0.6)',
              fontSize: '14px',
              margin: 0
            }}>
              © 2026 Impact Centre Chrétien BFC-ITALIE • La BFC pour Christ
            </p>
          </div>
        </div>
        
        {/* Skip link */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <a 
            href={newDomain}
            style={{
              color: '#93c5fd',
              fontSize: '14px',
              textDecoration: 'underline',
              textUnderlineOffset: '4px'
            }}
          >
            Cliquez ici si vous n'êtes pas redirigé automatiquement
          </a>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default RedirectPage;
