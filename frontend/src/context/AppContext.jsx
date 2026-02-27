import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [darkMode, setDarkMode] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [liveData, setLiveData] = useState([]);
    const [isSimulating, setIsSimulating] = useState(false);

    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

    const toggleTheme = () => setDarkMode(!darkMode);
    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    const login = (token) => {
        localStorage.setItem('token', token);
        setIsAuthenticated(true);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
    };

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    return (
        <AppContext.Provider value={{
            darkMode, toggleTheme,
            sidebarOpen, toggleSidebar,
            liveData, setLiveData,
            isSimulating, setIsSimulating,
            isAuthenticated, login, logout
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => useContext(AppContext);
