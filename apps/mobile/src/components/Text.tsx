import { Text as RNText, type TextProps, type TextStyle } from 'react-native';
import { useTheme } from '@/theme/theme';

type Variant = 'display' | 'title' | 'heading' | 'body' | 'caption' | 'label';
type Tone = 'text' | 'muted' | 'primary' | 'success' | 'danger' | 'onPrimary';

const variants: Record<Variant, TextStyle> = {
  display: { fontSize: 34, lineHeight: 40, fontWeight: '700', letterSpacing: -0.8 },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '700', letterSpacing: -0.4 },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: '600', letterSpacing: -0.2 },
  body: { fontSize: 16, lineHeight: 23, fontWeight: '400' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' },
};

interface Props extends TextProps {
  variant?: Variant;
  tone?: Tone;
}

export function Text({ variant = 'body', tone = 'text', style, ...rest }: Props) {
  const theme = useTheme();
  return <RNText {...rest} style={[variants[variant], { color: tone === 'primary' ? theme.primaryText : theme[tone] }, style]} />;
}
