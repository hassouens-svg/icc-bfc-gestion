import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const RedirectPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [countdown, setCountdown] = useState(10);
  const newDomain = 'https://mychurchiccapp.com';
  
  // Check if we're on the old domain or in test mode
  const isTestMode = location.pathname === '/redirect-test';
  const isOldDomain = window.location.hostname.includes('italian-church-app.emergent.host') || 
                      window.location.hostname.includes('emergent.host');
  
  const shouldShowRedirect = isTestMode || isOldDomain;
  
  useEffect(() => {
    if (!shouldShowRedirect) {
      navigate('/');
      return;
    }
    
    // Don't auto-redirect in test mode
    if (isTestMode) return;
    
    // Countdown timer
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
  }, [shouldShowRedirect, isTestMode, navigate]);

  if (!shouldShowRedirect) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative z-10 max-w-2xl w-full">
        {/* Main Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 md:p-12 shadow-2xl border border-white/20">
          {/* Logo/Icon */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-4 shadow-lg">
              <span className="text-4xl">⛪</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Nouvelle Adresse !
            </h1>
            <p className="text-blue-200 text-lg">
              Impact Centre Chrétien BFC-ITALIE
            </p>
          </div>
          
          {/* Message */}
          <div className="bg-white/10 rounded-2xl p-6 mb-8 border border-white/10">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🎉</span>
                </div>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">
                  Bonne nouvelle !
                </h2>
                <p className="text-blue-100 leading-relaxed">
                  Notre application a désormais son <strong className="text-yellow-300">propre nom de domaine</strong>. 
                  Veuillez mettre à jour vos favoris avec notre nouvelle adresse.
                </p>
              </div>
            </div>
          </div>
          
          {/* New Domain Link */}
          <div className="text-center mb-8">
            <p className="text-blue-200 mb-3 text-sm uppercase tracking-wide">
              Notre nouvelle adresse
            </p>
            <a 
              href={newDomain}
              className="inline-flex items-center gap-3 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-gray-900 font-bold text-xl md:text-2xl px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <span>🌐</span>
              <span>mychurchiccapp.com</span>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
          </div>
          
          {/* Countdown */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-blue-200 text-sm">
                Redirection automatique dans <span className="text-white font-bold">{countdown}</span> secondes
              </span>
            </div>
          </div>
          
          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-blue-300/60 text-sm">
              © 2026 Impact Centre Chrétien BFC-ITALIE • La BFC pour Christ
            </p>
          </div>
        </div>
        
        {/* Skip link */}
        <div className="text-center mt-6">
          <a 
            href={newDomain}
            className="text-blue-300 hover:text-white text-sm underline underline-offset-4 transition-colors"
          >
            Cliquez ici si vous n'êtes pas redirigé automatiquement
          </a>
        </div>
      </div>
    </div>
  );
};

export default RedirectPage;
