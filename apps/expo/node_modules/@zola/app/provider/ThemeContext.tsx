import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { lightColors, darkColors } from '../styles/themeColors';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  colors: typeof lightColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [systemColorScheme, setSystemColorScheme] = useState<'light' | 'dark'>('light');

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
          setModeState(savedMode as ThemeMode);
        }
      } catch (error) {
        console.error('Error loading theme mode:', error);
      }
    };
    loadThemeMode();
  }, []);

  // Save theme mode to storage
  const setMode = async (newMode: ThemeMode) => {
    try {
      setModeState(newMode);
      await AsyncStorage.setItem('theme_mode', newMode);
    } catch (error) {
      console.error('Error saving theme mode:', error);
    }
  };

  const value: ThemeContextType = {
    mode,
    isDark,
    setMode,
    colors,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
