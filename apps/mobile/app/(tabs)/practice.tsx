import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useActiveTrack } from '@/api/hooks';
import { Button } from '@/components/Button';
import { TopBar } from '@/components/TopBar';
import { Text } from '@/components/Text';
import { radius, useTheme } from '@/theme/theme';

const KINDS: { icon: keyof typeof Ionicons.glyphMap; title: string; text: string }[] = [
  { icon: 'swap-horizontal-outline', title: 'Registro', text: 'Troque a expressão coloquial pelo termo formal.' },
  { icon: 'reorder-three-outline', title: 'Frases', text: 'Monte frases reais de prontuários, PRs e documentos.' },
  { icon: 'create-outline', title: 'Produção', text: 'Digite o termo a partir da definição.' },
];

export default function PracticeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { summary } = useActiveTrack();
  const studied = summary?.completedCount ?? 0;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg, padding: 20, gap: 24 }}>
      <TopBar />
      <View style={{ gap: 6 }}>
        <Text variant="label" tone="primary">Prática livre</Text>
        <Text variant="display">Use o que aprendeu</Text>
        <Text tone="muted">
          Cada sessão mistura os termos das lições que você já concluiu em exercícios diferentes, para você aprender também como cada termo é usado.
        </Text>
      </View>

      <View style={{ gap: 10 }}>
        {KINDS.map((kind) => (
          <View
            key={kind.title}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              padding: 14,
              borderRadius: radius.lg,
              backgroundColor: theme.surface,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <Ionicons name={kind.icon} size={22} color={theme.primary} />
            <View style={{ flex: 1 }}>
              <Text variant="heading">{kind.title}</Text>
              <Text variant="caption" tone="muted">{kind.text}</Text>
            </View>
          </View>
        ))}
      </View>

      {studied > 0 ? (
        <Button label="Começar prática" onPress={() => router.push('/practice-session')} />
      ) : (
        <Text tone="muted">Conclua pelo menos uma lição desta área para liberar a prática.</Text>
      )}
    </SafeAreaView>
  );
}
