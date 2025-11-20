import React, { createContext, useState, useEffect, useContext } from 'react';
import { getCities } from '../utils/api';
import { toast } from 'sonner';

const CitiesContext = createContext();

export const CitiesProvider = ({ children }) => {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const loadCities = async () => {
    if (loaded || loading) return; // Prevent duplicate loads
    
    setLoading(true);
    setError(null);
    
    try {
      const citiesData = await getCities();
      setCities(citiesData);
      setLoaded(true);
    } catch (err) {
      console.error('Error loading cities:', err);
      setError(err.message || 'Erreur lors du chargement des villes');
      toast.error('Erreur lors du chargement des villes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCities();
  }, []); // Load once on mount

  return (
    <CitiesContext.Provider value={{ cities, loading, error, loadCities }}>
      {children}
    </CitiesContext.Provider>
  );
};

export const useCities = () => {
  const context = useContext(CitiesContext);
  if (!context) {
    throw new Error('useCities must be used within a CitiesProvider');
  }
  return context;
};
