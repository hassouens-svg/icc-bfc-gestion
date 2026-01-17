import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Initialize from localStorage synchronously to avoid flash
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        return JSON.parse(storedUser);
      }
      // Check for guest context
      const storedGuestContext = localStorage.getItem('guest_bergerie_context');
      if (storedGuestContext) {
        const guestData = JSON.parse(storedGuestContext);
        return {
          id: 'guest',
          username: guestData.nom || `Bergerie ${guestData.month_name}`,
          role: 'berger',
          city: guestData.ville,
          assigned_month: `${new Date().getFullYear()}-${guestData.month_num}`,
          promo_name: guestData.nom || `Bergerie ${guestData.month_name}`,
          is_guest: true
        };
      }
    }q catch (e) {
      console.error('Error reading auth from localStorage:', e);
    }
    return null;
  });
  
  const [isGuest, setIsGuest] = useState(() => {
    try {
      const storedUser = localStorage.getItem('user');
      const storedGuestContext = localStorage.getItem('guest_bergerie_context');
      return !storedUser && !!storedGuestContext;
    } catch (e) {
      return false;
    }
  });
  
  const [guestContext, setGuestContext] = useState(() => {
    try {
      const storedGuestContext = localStorage.getItem('guest_bergerie_context');
      return storedGuestContext ? JSON.parse(storedGuestContext) : null;
    } catch (e) {
      return null;
    }
  });
  
  const [isLoading, setIsLoading] = useState(false);

  // Create guest session for public bergerie access
  const createGuestSession = useCallback((bergerieData) => {
    const guestData = {
      ville: bergerieData.ville,
      month_num: bergerieData.month_num,
      month_name: bergerieData.month_name,
      nom: bergerieData.nom || `Bergerie ${bergerieData.month_name}`
    };
    
    try {
      localStorage.setItem('guest_bergerie_context', JSON.stringify(guestData));
      localStorage.setItem('selected_department', 'promotions');
    } catch (e) {
      console.error('Error saving guest session:', e);
    }
    
    setGuestContext(guestData);
    setIsGuest(true);
    setUser({
      id: 'guest',
      username: guestData.nom,
      role: 'berger',
      city: guestData.ville,
      assigned_month: `${new Date().getFullYear()}-${guestData.month_num}`,
      promo_name: guestData.nom,
      is_guest: true
    });
    
    return guestData;
  }, []);

  // Clear guest session
  const clearGuestSession = useCallback(() => {
    try {
      localStorage.removeItem('guest_bergerie_context');
    } catch (e) {
      console.error('Error clearing guest session:', e);
    }
    setGuestContext(null);
    setIsGuest(false);
    setUser(null);
  }, []);

  // Login real user
  const loginUser = useCallback((userData, token) => {
    try {
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', token);
      // Clear any guest session
      localStorage.removeItem('guest_bergerie_context');
    } catch (e) {
      console.error('Error saving user session:', e);
    }
    setGuestContext(null);
    setIsGuest(false);
    setUser(userData);
  }, []);

  // Logout
  const logoutUser = useCallback(() => {
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('guest_bergerie_context');
    } catch (e) {
      console.error('Error clearing session:', e);
    }
    setUser(null);
    setIsGuest(false);
    setGuestContext(null);
  }, []);

  const value = {
    user,
    isGuest,
    guestContext,
    isLoading,
    isAuthenticated: !!user && !isGuest,
    isGuestAuthenticated: !!user && isGuest,
    createGuestSession,
    clearGuestSession,
    loginUser,
    logoutUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
