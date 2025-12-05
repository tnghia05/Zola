import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { WebRTCView } from '../WebRTCView';

export type ParticipantVideo = {
  participantId: string;
  stream: MediaStream;
  isLocal?: boolean;
  label?: string;
};

type GroupCallGridProps = {
  participants: ParticipantVideo[];
};

const getGridStyle = (count: number) => {
  if (count <= 1) return styles.gridSingle;
  if (count === 2) return styles.gridDouble;
  if (count <= 4) return styles.gridQuad;
  if (count <= 6) return styles.gridSix;
  return styles.gridNine;
};

const getStreamSource = (stream: any) => {
  if (Platform.OS === 'web') {
    return stream;
  }
  if (stream?.toURL) {
    return stream.toURL();
  }
  return stream;
};

export function GroupCallGrid({ participants }: GroupCallGridProps) {
  const gridStyle = getGridStyle(participants.length || 1);

  return (
    <View style={[styles.gridContainer, gridStyle]}>
      {participants.map((participant) => (
        <View key={participant.participantId} style={styles.tile}>
          <View style={styles.videoWrapper}>
            <WebRTCView
              streamURL={getStreamSource(participant.stream)}
              style={styles.video}
              mirror={participant.isLocal}
              muted={participant.isLocal}
            />
          </View>
          <Text style={styles.name}>
            {participant.isLocal ? 'Bạn' : participant.label || participant.participantId}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    justifyContent: 'center',
    alignContent: 'center',
  },
  gridSingle: {
    justifyContent: 'center',
  },
  gridDouble: {
    justifyContent: 'space-evenly',
  },
  gridQuad: {
    justifyContent: 'space-between',
  },
  gridSix: {
    justifyContent: 'space-between',
  },
  gridNine: {
    justifyContent: 'space-between',
  },
  tile: {
    flexBasis: '48%',
    aspectRatio: 9 / 16,
    backgroundColor: '#111',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    margin: 4,
  },
  videoWrapper: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  name: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    color: '#fff',
    fontSize: 14,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

