import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const API = `${window.location.origin}/api`;

const SchoolContext = createContext();

export const useSchool = () => {
  const context = useContext(SchoolContext);
  // Return default values if used outside provider (e.g., in print windows)
  if (!context) {
    return {
      school: null,
      loading: false,
      branding: {
        primary_color: '#65A30D',
        secondary_color: '#334155',
        accent_color: '#F59E0B',
        font_family: 'Manrope'
      },
      refreshSchool: () => {},
      defaultBranding: {
        primary_color: '#65A30D',
        secondary_color: '#334155',
        accent_color: '#F59E0B',
        font_family: 'Manrope'
      }
    };
  }
  return context;
};

export const SchoolProvider = ({ children }) => {
  const { user } = useAuth();
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);

  // Default branding
  const defaultBranding = {
    primary_color: '#65A30D',
    secondary_color: '#334155',
    accent_color: '#F59E0B',
    font_family: 'Manrope'
  };

  useEffect(() => {
    const fetchSchool = async () => {
      if (!user?.school_id) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(`${API}/schools/${user.school_id}`, { withCredentials: true });
        setSchool(res.data);
        
        // Apply branding to CSS variables
        const branding = res.data.branding || defaultBranding;
        applyBranding(branding);
      } catch (error) {
        console.error('Error fetching school:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSchool();
  }, [user?.school_id]);

  const applyBranding = (branding) => {
    const root = document.documentElement;
    
    // Convert hex to HSL for CSS variables
    const hexToHSL = (hex) => {
      let r = parseInt(hex.slice(1, 3), 16) / 255;
      let g = parseInt(hex.slice(3, 5), 16) / 255;
      let b = parseInt(hex.slice(5, 7), 16) / 255;

      let max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h, s, l = (max + min) / 2;

      if (max === min) {
        h = s = 0;
      } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
          case g: h = ((b - r) / d + 2) / 6; break;
          case b: h = ((r - g) / d + 4) / 6; break;
          default: h = 0;
        }
      }

      return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    };

    // Apply colors
    if (branding.primary_color) {
      root.style.setProperty('--school-primary', branding.primary_color);
      root.style.setProperty('--school-primary-hsl', hexToHSL(branding.primary_color));
    }
    if (branding.secondary_color) {
      root.style.setProperty('--school-secondary', branding.secondary_color);
      root.style.setProperty('--school-secondary-hsl', hexToHSL(branding.secondary_color));
    }
    if (branding.accent_color) {
      root.style.setProperty('--school-accent', branding.accent_color);
      root.style.setProperty('--school-accent-hsl', hexToHSL(branding.accent_color));
    }
    if (branding.font_family) {
      root.style.setProperty('--school-font', branding.font_family);
    }
  };

  const getBranding = () => {
    return school?.branding || defaultBranding;
  };

  const refreshSchool = async () => {
    if (!user?.school_id) return;
    
    try {
      const res = await axios.get(`${API}/schools/${user.school_id}`, { withCredentials: true });
      setSchool(res.data);
      applyBranding(res.data.branding || defaultBranding);
    } catch (error) {
      console.error('Error refreshing school:', error);
    }
  };

  return (
    <SchoolContext.Provider value={{ 
      school, 
      loading, 
      branding: getBranding(),
      refreshSchool,
      defaultBranding
    }}>
      {children}
    </SchoolContext.Provider>
  );
};

export default SchoolContext;
