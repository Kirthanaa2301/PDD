import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { useHaptics } from '../hooks/useHaptics';
import { getAudioFromStorage, getAudioFromMemory } from '../services/audioStorage';

interface AudioPlaybackCardProps {
  audioUri?: string | null;
  fileName?: string;
  durationSeconds?: number;
  title?: string;
  subtitle?: string;
  isWheeze?: boolean;
}

export default function AudioPlaybackCard({
  audioUri: propAudioUri,
  fileName = 'respiratory_audio.wav',
  durationSeconds = 5,
  title = 'Original Audio',
  subtitle = 'Listen to the original uploaded recording',
  isWheeze = false,
}: AudioPlaybackCardProps) {
  const { colors } = useTheme();
  const haptics = useHaptics();

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationSeconds || 5);
  const [isMuted, setIsMuted] = useState(false);
  const [activeUri, setActiveUri] = useState<string | null>(propAudioUri || null);
  const audioRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  // Equalizer animation heights
  const waveAnim1 = useRef(new Animated.Value(6)).current;
  const waveAnim2 = useRef(new Animated.Value(14)).current;
  const waveAnim3 = useRef(new Animated.Value(10)).current;
  const waveAnim4 = useRef(new Animated.Value(18)).current;
  const waveAnim5 = useRef(new Animated.Value(8)).current;

  // Resolve audio track from prop, memory cache, or storage
  useEffect(() => {
    if (propAudioUri && typeof propAudioUri === 'string' && propAudioUri.trim().length > 0) {
      setActiveUri(propAudioUri);
      return;
    }
    const mem = getAudioFromMemory(fileName) || (propAudioUri ? getAudioFromMemory(propAudioUri) : null);
    if (mem) {
      setActiveUri(mem);
      return;
    }
    getAudioFromStorage(fileName).then((stored) => {
      if (stored) setActiveUri(stored);
    });
  }, [propAudioUri, fileName]);

  const resolvedUri = activeUri || propAudioUri || null;

  // Equalizer animations
  useEffect(() => {
    let animLoop: Animated.CompositeAnimation | null = null;
    if (isPlaying) {
      const createBarAnim = (anim: Animated.Value, min: number, max: number, dur: number) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, { toValue: max, duration: dur, useNativeDriver: false }),
            Animated.timing(anim, { toValue: min, duration: dur, useNativeDriver: false }),
          ])
        );

      animLoop = Animated.parallel([
        createBarAnim(waveAnim1, 4, 20, 200),
        createBarAnim(waveAnim2, 6, 24, 170),
        createBarAnim(waveAnim3, 8, 26, 240),
        createBarAnim(waveAnim4, 4, 22, 190),
        createBarAnim(waveAnim5, 6, 18, 220),
      ]);
      animLoop.start();
    } else {
      Animated.parallel([
        Animated.timing(waveAnim1, { toValue: 6, duration: 150, useNativeDriver: false }),
        Animated.timing(waveAnim2, { toValue: 12, duration: 150, useNativeDriver: false }),
        Animated.timing(waveAnim3, { toValue: 8, duration: 150, useNativeDriver: false }),
        Animated.timing(waveAnim4, { toValue: 14, duration: 150, useNativeDriver: false }),
        Animated.timing(waveAnim5, { toValue: 6, duration: 150, useNativeDriver: false }),
      ]).start();
    }

    return () => {
      if (animLoop) animLoop.stop();
    };
  }, [isPlaying]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        try {
          if (Platform.OS === 'web') {
            audioRef.current.pause();
          }
          audioRef.current = null;
        } catch (_) {}
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [resolvedUri]);

  const togglePlay = async () => {
    haptics.light();

    if (isPlaying) {
      if (Platform.OS === 'web' && audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    try {
      if (Platform.OS === 'web') {
        if (resolvedUri) {
          if (!audioRef.current || audioRef.current.src !== resolvedUri) {
            audioRef.current = new (window as any).Audio(resolvedUri);
            audioRef.current.muted = isMuted;
            audioRef.current.onloadedmetadata = () => {
              if (audioRef.current?.duration && Number.isFinite(audioRef.current.duration)) {
                setDuration(Math.max(1, Math.round(audioRef.current.duration)));
              }
            };
            audioRef.current.onended = () => {
              setIsPlaying(false);
              setCurrentTime(0);
              if (timerRef.current) clearInterval(timerRef.current);
            };
            audioRef.current.onerror = (e: any) => {
              console.warn('Audio element playback error:', e);
              setIsPlaying(false);
            };
          }
          await audioRef.current.play();
          setIsPlaying(true);

          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = setInterval(() => {
            if (audioRef.current) {
              setCurrentTime(Math.round(audioRef.current.currentTime || 0));
            }
          }, 150);
        } else {
          setIsPlaying(true);
          let elapsed = 0;
          const dur = duration || 5;
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = setInterval(() => {
            elapsed++;
            setCurrentTime(elapsed);
            if (elapsed >= dur) {
              setIsPlaying(false);
              setCurrentTime(0);
              clearInterval(timerRef.current);
            }
          }, 1000);
        }
      } else {
        // Native fallback playback timer
        setIsPlaying(true);
        let elapsed = 0;
        const dur = duration || 5;
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          elapsed++;
          setCurrentTime(elapsed);
          if (elapsed >= dur) {
            setIsPlaying(false);
            setCurrentTime(0);
            clearInterval(timerRef.current);
          }
        }, 1000);
      }
    } catch (err) {
      console.warn('Audio playback error:', err);
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    haptics.light();
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (audioRef.current && Platform.OS === 'web') {
      audioRef.current.muted = nextMute;
    }
  };

  const handleSeek = (event: any) => {
    if (!duration || duration <= 0) return;
    try {
      const { locationX } = event.nativeEvent;
      const trackWidth = 200;
      const targetPct = Math.max(0, Math.min(1, locationX / trackWidth));
      const targetSec = Math.round(targetPct * duration);
      setCurrentTime(targetSec);
      if (audioRef.current && Platform.OS === 'web') {
        audioRef.current.currentTime = targetSec;
      }
    } catch (_) {}
  };

  const progressPercent = Math.min(100, Math.max(0, (currentTime / (duration || 1)) * 100));

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = String(Math.floor(secs % 60)).padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
      {/* Header Info */}
      <View style={styles.topRow}>
        <View style={styles.titleInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Feather name="headphones" size={15} color={colors.accent} />
            <Text style={[styles.titleText, { color: colors.accent }]}>{title}</Text>
          </View>
          <Text style={[styles.fileNameText, { color: colors.text }]} numberOfLines={1}>
            {fileName}
          </Text>
        </View>

        {/* Dynamic Waveform Visualizer */}
        <View style={[styles.equalizer, { backgroundColor: `${colors.accent}12` }]}>
          {[waveAnim1, waveAnim2, waveAnim3, waveAnim4, waveAnim5].map((anim, idx) => (
            <Animated.View
              key={idx}
              style={[
                styles.equalizerBar,
                {
                  height: anim,
                  backgroundColor: isPlaying ? colors.accent : colors.textSub,
                  opacity: isPlaying ? 1 : 0.4,
                },
              ]}
            />
          ))}
        </View>
      </View>

      {/* Play Controls & Seekable Timeline */}
      <View style={styles.controlsRow}>
        <TouchableOpacity
          onPress={togglePlay}
          activeOpacity={0.85}
          style={[
            styles.playButton,
            {
              backgroundColor: colors.accent,
              shadowColor: colors.accent,
            },
          ]}
        >
          <Feather name={isPlaying ? 'pause' : 'play'} size={20} color="#fff" />
        </TouchableOpacity>

        <View style={styles.progressContainer}>
          <View style={styles.timeRow}>
            <Text style={[styles.timeLabel, { color: isPlaying ? colors.accent : colors.textSub }]}>
              {isPlaying ? 'Playing Audio' : 'Click to Listen'}
            </Text>
            <Text style={[styles.timeNumbers, { color: colors.text }]}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </Text>
          </View>

          <TouchableOpacity activeOpacity={0.9} onPress={handleSeek} style={[styles.trackBg, { backgroundColor: colors.cardBorder }]}>
            <View style={[styles.trackFill, { width: `${progressPercent}%`, backgroundColor: colors.accent }]} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={toggleMute}
          activeOpacity={0.8}
          style={[styles.muteBtn, { backgroundColor: isMuted ? colors.dangerTint : colors.cardBorder }]}
        >
          <Feather name={isMuted ? 'volume-x' : 'volume-2'} size={16} color={isMuted ? colors.danger : colors.text} />
        </TouchableOpacity>
      </View>

      {/* Subtitle helper footer */}
      <Text style={[styles.subtitleText, { color: colors.textSub }]}>
        {subtitle}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    marginVertical: 10,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleInfo: {
    flex: 1,
    gap: 3,
  },
  titleText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  fileNameText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    marginTop: 2,
  },
  equalizer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    height: 28,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  equalizerBar: {
    width: 3.5,
    borderRadius: 2,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  progressContainer: {
    flex: 1,
    gap: 6,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
  },
  timeNumbers: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
  },
  trackBg: {
    height: 8,
    borderRadius: 4,
    width: '100%',
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: 4,
  },
  muteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitleText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11.5,
    lineHeight: 15,
  },
});
