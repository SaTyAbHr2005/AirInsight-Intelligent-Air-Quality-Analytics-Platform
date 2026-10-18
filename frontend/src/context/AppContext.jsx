import { createContext, useContext, useEffect, useState } from 'react';

const AppContext = createContext();

const stored = (key, fallback) => {
    try {
        return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
        return fallback;
    }
};

export const AppProvider = ({ children }) => {
    const [darkMode, setDarkMode] = useState(() => stored('night', false));
    const [regionId, setRegionId] = useState(() => stored('region', null));
    const [profile, setProfile] = useState(() => stored('profile', 'general'));
    const [isSimulating, setIsSimulating] = useState(false);
    const [streamLog, setStreamLog] = useState([]);
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

    useEffect(() => {
        document.documentElement.classList.toggle('dark', darkMode);
        localStorage.setItem('night', JSON.stringify(darkMode));
    }, [darkMode]);

    useEffect(() => {
        if (regionId != null) localStorage.setItem('region', JSON.stringify(regionId));
    }, [regionId]);

    useEffect(() => {
        localStorage.setItem('profile', JSON.stringify(profile));
    }, [profile]);

    const login = (token) => {
        localStorage.setItem('token', token);
        setIsAuthenticated(true);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
    };

    return (
        <AppContext.Provider
            value={{
                darkMode, toggleTheme: () => setDarkMode((d) => !d),
                regionId, setRegionId,
                profile, setProfile,
                isSimulating, setIsSimulating,
                streamLog, setStreamLog,
                isAuthenticated, login, logout,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => useContext(AppContext);
