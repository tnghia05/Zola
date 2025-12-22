import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { lightColors, darkColors } from '../styles/themeColors';
const ThemeContext = createContext(undefined);
export const ThemeProvider = ({ children }) => {
    const [mode, setModeState] = useState('system');
    const [systemColorScheme, setSystemColorScheme] = useState('light');
    // Listen to system color scheme changes
    useEffect(() => {
        const subscription = Appearance.addChangeListener(({ colorScheme }) => {
            setSystemColorScheme(colorScheme || 'light');
        });
        // Get initial system color scheme
        setSystemColorScheme(Appearance.getColorScheme() || 'light');
        return () => subscription?.remove();
    }, []);
    // Calculate if dark mode should be active
    const isDark = mode === 'dark' || (mode === 'system' && systemColorScheme === 'dark');
    const colors = isDark ? darkColors : lightColors;
    // Load saved theme mode from storage
    useEffect(() => {
        const loadThemeMode = async () => {
            try {
                const savedMode = await AsyncStorage.getItem('theme_mode');
                if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
                    setModeState(savedMode);
                }
            }
            catch (error) {
                console.error('Error loading theme mode:', error);
            }
        };
        loadThemeMode();
    }, []);
    // Save theme mode to storage
    const setMode = async (newMode) => {
        try {
            setModeState(newMode);
            await AsyncStorage.setItem('theme_mode', newMode);
        }
        catch (error) {
            console.error('Error saving theme mode:', error);
        }
    };
    const value = {
        mode,
        isDark,
        setMode,
        colors,
    };
    return (_jsx(ThemeContext.Provider, { value: value, children: children }));
};
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};
