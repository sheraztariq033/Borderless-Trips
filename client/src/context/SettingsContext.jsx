import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({
    business_name: 'Borderless Trips',
    phone: '+44 123 456 7890',
    email: 'info@borderlesstrips.com',
    whatsapp: '+441234567890',
    website_url: 'https://palegreen-bison-521258.hostingersite.com',
    bank_name: 'Barclays',
    account_name: 'Borderless Trips Ltd',
    sort_code: '20-XX-XX',
    account_number: 'XXXXXXXX',
    address: 'London, United Kingdom',
    currency: 'GBP',
    logo_url: '/logo.png',
    hero_images: [
      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1600&q=80",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80",
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1600&q=80",
      "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1600&q=80",
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=80"
    ],
    hero_video: 'https://player.vimeo.com/external/434045526.sd.mp4?s=c27d23d8c1ad2125e98583fb24285e683f491176&profile_id=165&oauth2_token_id=57447761'
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const data = await api.get('/analytics/settings/public');
      if (data && typeof data === 'object') {
        setSettings(prev => {
          const parsed = { ...prev };
          Object.entries(data).forEach(([key, val]) => {
            if (key === 'hero_images') {
              if (val) {
                parsed.hero_images = val.split(',').map(s => s.trim()).filter(Boolean);
              }
            } else {
              parsed[key] = val;
            }
          });
          return parsed;
        });
      }
    } catch (err) {
      console.error('Failed to load public settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
