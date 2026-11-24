import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { useTheme } from '@/theme/theme';

export function ProgressBar({ value }: { value: number }) {
  const theme = useTheme();
  const progress = useRef(new Animated.Value(value)).current;

  useEffect(() => {
    Animated.timing(progress, { toValue: value, duration: 280, useNativeDriver: false }).start();
  }, [value, progress]);

  return (
    <View style={{ height: 8, borderRadius: 4, backgroundColor: theme.surfaceAlt, overflow: 'hidden', flex: 1 }}>
      <Animated.View
        style={{
          height: '100%',
          borderRadius: 4,
          backgroundColor: theme.primary,
          width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
        }}
      />
    </View>
  );
}
