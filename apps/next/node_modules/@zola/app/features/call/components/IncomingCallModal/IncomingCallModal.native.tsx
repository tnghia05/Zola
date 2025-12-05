import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Image } from 'react-native';
import { Platform } from 'react-native';

interface IncomingCallModalProps {
  visible: boolean;
  callerName: string;
  callerAvatar?: string;
  onAccept: () => void;
  onDecline: () => void;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  visible,
  callerName,
  callerAvatar,
  onAccept,
  onDecline
}) => {
  if (Platform.OS === 'web') {
    // Web: Custom popup modal
    if (!visible) return null;
    
    return (
      <div style={webStyles.overlay}>
        <div style={webStyles.modal}>
          <div style={webStyles.header}>
            <div style={webStyles.avatarContainer}>
              {callerAvatar ? (
                <img src={callerAvatar} alt="Caller" style={webStyles.avatar} />
              ) : (
                <div style={webStyles.defaultAvatar}>
                  <span style={webStyles.avatarText}>
                    {callerName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div style={webStyles.content}>
            <Text style={webStyles.callerName}>{callerName}</Text>
            <Text style={webStyles.callingText}>đang gọi cho bạn</Text>
            
            <div style={webStyles.encryption}>
              <span style={webStyles.lockIcon}>🔒</span>
              <Text style={webStyles.encryptionText}>Được mã hóa đầu cuối</Text>
            </div>
          </div>
          
          <div style={webStyles.actions}>
            <TouchableOpacity 
              style={[webStyles.actionButton, webStyles.declineButton]} 
              onPress={onDecline}
            >
              <Text style={webStyles.actionButtonText}>✕</Text>
              <Text style={webStyles.actionButtonLabel}>Từ chối</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[webStyles.actionButton, webStyles.acceptButton]} 
              onPress={onAccept}
            >
              <Text style={webStyles.actionButtonText}>📹</Text>
              <Text style={webStyles.actionButtonLabel}>Chấp nhận</Text>
            </TouchableOpacity>
          </div>
          
          <TouchableOpacity style={webStyles.closeButton} onPress={onDecline}>
            <Text style={webStyles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </div>
      </div>
    );
  }

  // Mobile: Native modal
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onDecline}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              {callerAvatar ? (
                <Image source={{ uri: callerAvatar }} style={styles.avatar} />
              ) : (
                <View style={styles.defaultAvatar}>
                  <Text style={styles.avatarText}>
                    {callerName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.content}>
            <Text style={styles.callerName}>{callerName}</Text>
            <Text style={styles.callingText}>đang gọi cho bạn</Text>
            
            <View style={styles.encryption}>
              <Text style={styles.lockIcon}>🔒</Text>
              <Text style={styles.encryptionText}>Được mã hóa đầu cuối</Text>
            </View>
          </View>
          
          <View style={styles.actions}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.declineButton]} 
              onPress={onDecline}
            >
              <Text style={styles.actionButtonText}>✕</Text>
              <Text style={styles.actionButtonLabel}>Từ chối</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.acceptButton]} 
              onPress={onAccept}
            >
              <Text style={styles.actionButtonText}>📹</Text>
              <Text style={styles.actionButtonLabel}>Chấp nhận</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Mobile styles
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    minWidth: 300,
    maxWidth: 400,
  },
  header: {
    marginBottom: 20,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    backgroundColor: '#333',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  defaultAvatar: {
    width: '100%',
    height: '100%',
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    alignItems: 'center',
    marginBottom: 30,
  },
  callerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  callingText: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 15,
  },
  encryption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lockIcon: {
    fontSize: 14,
    marginRight: 5,
  },
  encryptionText: {
    fontSize: 12,
    color: '#888',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  actionButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  declineButton: {
    backgroundColor: '#ff4444',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    fontSize: 24,
    color: 'white',
    marginBottom: 4,
  },
  actionButtonLabel: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
});

// Web styles - using any to avoid TypeScript issues with web styles
const webStyles: any = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  modal: {
    backgroundColor: '#1a1a1a',
    borderRadius: '20px',
    padding: '30px',
    alignItems: 'center',
    minWidth: '300px',
    maxWidth: '400px',
    position: 'relative',
  },
  header: {
    marginBottom: '20px',
  },
  avatarContainer: {
    width: '80px',
    height: '80px',
    borderRadius: '40px',
    overflow: 'hidden',
    backgroundColor: '#333',
  },
  avatar: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  defaultAvatar: {
    width: '100%',
    height: '100%',
    backgroundColor: '#4a90e2',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    alignItems: 'center',
    marginBottom: '30px',
  },
  callerName: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: 'white',
    marginBottom: '8px',
  },
  callingText: {
    fontSize: '16px',
    color: '#ccc',
    marginBottom: '15px',
  },
  encryption: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  lockIcon: {
    fontSize: '14px',
    marginRight: '5px',
  },
  encryptionText: {
    fontSize: '12px',
    color: '#888',
  },
  actions: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  actionButton: {
    width: '70px',
    height: '70px',
    borderRadius: '35px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: '20px',
    cursor: 'pointer',
    border: 'none',
  },
  declineButton: {
    backgroundColor: '#ff4444',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    fontSize: '24px',
    color: 'white',
    marginBottom: '4px',
  },
  actionButtonLabel: {
    fontSize: '12px',
    color: 'white',
    fontWeight: '500',
  },
  closeButton: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    width: '30px',
    height: '30px',
    borderRadius: '15px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
  },
  closeButtonText: {
    color: 'white',
    fontSize: '16px',
  },
};
