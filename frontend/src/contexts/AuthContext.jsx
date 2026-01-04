import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [guestContext, setGuestContext] = useState(null);

  // Initialize from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedGuestContext = localStorage.getItem('guest_bergerie_context');
    
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsGuest(false);
    } else if (storedGuestContext) {
      const guestData = JSON.parse(storedGuestContext);
      setGuestContext(guestData);
      setIsGuest(true);
      // Create a virtual user for guest mode
      setUser({
        id: 'guest',
        username: `Bergerie ${guestData.month_name}`,
        role: 'berger', // Give berger role for UI display
        city: guestData.ville,
        assigned_month: `${new Date().getFullYear()}-${guestData.month_num}`,
        promo_name: `Bergerie ${guestData.month_name}`,
        is_guest: true
      });
    }
  }, []);

  // Create guest session for public bergerie access
  const createGuestSession = (bergerieData) => {
    const guestData = {
      ville: bergerieData.ville,
      month_num: bergerieData.month_num,
      month_name: bergerieData.month_name,
      nom: bergerieData.nom || `Bergerie ${bergerieData.month_name}`
    };
    
    localStorage.setItem('guest_bergerie_context', JSON.stringify(guestData));
    localStorage.setItem('selected_department', 'promotions');
    
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
  };

  // Clear guest session
  const clearGuestSession = () => {
    localStorage.removeItem('guest_bergerie_context');
    setGuestContext(null);
    setIsGuest(false);
    setUser(null);
  };

  // Login real user
  const loginUser = (userData, token) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    clearGuestSession(); // Clear any guest session
    setUser(userData);
    setIsGuest(false);
  };

  // Logout
  const logoutUser = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    clearGuestSession();
    setUser(null);
    setIsGuest(false);
  };

  const value = {
    user,
    isGuest,
    guestContext,
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
