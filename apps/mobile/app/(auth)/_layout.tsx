import { Stack } from 'expo-router';
import { useTheme } from '@/theme/theme';

export default function AuthLayout() {
  const theme = useTheme();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.bg } }} />;
}
