import React, { createContext, useState, useContext, useEffect } from 'react';
import { getUser } from '../utils/api';

const SelectedCityContext = createContext();

export const SelectedCityProvider = ({ children }) => {
  const [selectedCity, setSelectedCity] = useState(() => {
    // Initialize from localStorage or user's city
    const saved = localStorage.getItem('selected_city_filter');
    if (saved) return saved;
    
    const user = getUser();
    return user?.city || 'all';
  });

  // Update localStorage when selectedCity changes
  useEffect(() => {
    localStorage.setItem('selected_city_filter', selectedCity);
  }, [selectedCity]);

  // Reset to user's city on logout/login
  useEffect(() => {
    const handleStorageChange = () => {
      const user = getUser();
      if (!user) {
        setSelectedCity('all');
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <SelectedCityContext.Provider value={{ selectedCity, setSelectedCity }}>
      {children}
    </SelectedCityContext.Provider>
  );
};

export const useSelectedCity = () => {
  const context = useContext(SelectedCityContext);
  if (!context) {
    throw new Error('useSelectedCity must be used within a SelectedCityProvider');
  }
  return context;
};
