import React, { ReactNode } from 'react';
import { lightColors } from '../styles/themeColors';
export type ThemeMode = 'light' | 'dark' | 'system';
interface ThemeContextType {
    mode: ThemeMode;
    isDark: boolean;
    setMode: (mode: ThemeMode) => void;
    colors: typeof lightColors;
}
interface ThemeProviderProps {
    children: ReactNode;
}
export declare const ThemeProvider: React.FC<ThemeProviderProps>;
export declare const useTheme: () => ThemeContextType;
export {};
