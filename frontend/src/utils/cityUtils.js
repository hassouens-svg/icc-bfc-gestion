/**
 * Utilitaire pour formater les villes avec le pays
 */

/**
 * Formate le nom d'une ville avec son pays entre parenthèses
 * @param {Object|string} city - L'objet ville ou le nom de la ville
 * @param {Array} citiesList - La liste complète des villes (optionnel)
 * @returns {string} Le nom formaté "Ville (Pays)"
 */
export const formatCityWithCountry = (city, citiesList = []) => {
  if (!city) return '';
  
  // Si c'est déjà un objet avec name et country
  if (typeof city === 'object' && city.name) {
    return city.country ? `${city.name} (${city.country})` : city.name;
  }
  
  // Si c'est une string, chercher dans la liste des villes
  if (typeof city === 'string') {
    // Si ça contient déjà des parenthèses, retourner tel quel
    if (city.includes('(')) return city;
    
    // Chercher dans la liste des villes
    const cityObj = citiesList.find(c => 
      (typeof c === 'object' ? c.name : c) === city
    );
    
    if (cityObj && typeof cityObj === 'object' && cityObj.country) {
      return `${city} (${cityObj.country})`;
    }
    
    return city;
  }
  
  return String(city);
};

/**
 * Extrait le nom de la ville sans le pays
 * @param {string} formattedCity - Le nom formaté "Ville (Pays)"
 * @returns {string} Le nom de la ville sans parenthèses
 */
export const extractCityName = (formattedCity) => {
  if (!formattedCity) return '';
  // Retire le pays entre parenthèses s'il existe
  return formattedCity.replace(/\s*\([^)]*\)\s*$/, '').trim();
};

/**
 * Crée une liste de villes formatées avec pays
 * @param {Array} cities - Liste des objets villes
 * @returns {Array} Liste avec les noms formatés
 */
export const formatCitiesList = (cities) => {
  if (!Array.isArray(cities)) return [];
  
  return cities.map(city => ({
    ...city,
    displayName: formatCityWithCountry(city),
    value: typeof city === 'object' ? city.name : city
  }));
};

export default {
  formatCityWithCountry,
  extractCityName,
  formatCitiesList
};
