import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { MediaTest } from '../components/MediaTest';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const [showMediaTest, setShowMediaTest] = useState(false);
  
  return (
    <div style={{ 
      width: '100%', 
      height: '100vh', 
      backgroundColor: colors.background,
      color: colors.text,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'auto'
    }}>
      {!showMediaTest ? (
        <div style={{
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh'
        }}>
          <h1 style={{ marginBottom: '20px' }}>Settings</h1>
          
          <div style={{
            padding: '20px',
            backgroundColor: colors.surface || '#2a2a2a',
            borderRadius: '8px',
            maxWidth: '600px',
            width: '100%'
          }}>
            <h2 style={{ marginBottom: '15px' }}>Media Permissions Test</h2>
            <p style={{ marginBottom: '20px', opacity: 0.8 }}>
              Test camera and microphone permissions to verify they work correctly on Windows.
            </p>
            <button
              onClick={() => setShowMediaTest(true)}
              style={{
                padding: '12px 24px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              📹 Test Camera & Microphone
            </button>
          </div>
        </div>
      ) : (
        <div style={{ padding: '20px' }}>
          <button
            onClick={() => setShowMediaTest(false)}
            style={{
              marginBottom: '20px',
              padding: '10px 20px',
              backgroundColor: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ← Back to Settings
          </button>
          <MediaTest />
        </div>
      )}
    </div>
  );
}

