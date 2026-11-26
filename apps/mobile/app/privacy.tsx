import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text } from '@/components/Text';
import { useTheme } from '@/theme/theme';

const SECTIONS: { title: string; body: string }[] = [
  {
    title: 'O que guardamos',
    body: 'Nome, e-mail, a senha (armazenada apenas em forma criptografada), o fuso horário e suas escolhas de estudo: profissão, idioma, nível, meta diária e horário do lembrete.',
  },
  {
    title: 'Seu progresso',
    body: 'Lições concluídas, pontuação, XP, sequência de dias, cartões de revisão e as palavras do caderno de memorização. Isso serve apenas para o app funcionar e mostrar a sua evolução.',
  },
  {
    title: 'O que não fazemos',
    body: 'Não vendemos nem compartilhamos seus dados, não usamos anúncios e não rastreamos você em outros apps. As lições não usam inteligência artificial e não enviam o que você escreve a terceiros.',
  },
  {
    title: 'Onde ficam os dados',
    body: 'Em um banco de dados na nuvem protegido por senha, com comunicação criptografada. No aparelho, o acesso à conta fica no armazenamento seguro do Android.',
  },
  {
    title: 'Notificações',
    body: 'Os lembretes são gerados no próprio aparelho, só se você permitir. Dá para desligar a qualquer momento no Perfil ou nas configurações do Android.',
  },
  {
    title: 'Excluir seus dados',
    body: 'Em Perfil > Privacidade > Excluir minha conta, tudo o que está ligado à sua conta é apagado de forma definitiva.',
  },
  {
    title: 'Conteúdo educativo',
    body: 'Os termos técnicos (saúde, direito, engenharia e outras áreas) servem para estudo de vocabulário. Não substituem orientação profissional nem tradução juramentada.',
  },
];

export default function PrivacyScreen() {
  const theme = useTheme();
  const router = useRouter();
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48, gap: 18 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={26} color={theme.text} />
        </Pressable>
        <Text variant="display">Política de privacidade</Text>
        {SECTIONS.map((s) => (
          <View key={s.title} style={{ gap: 4 }}>
            <Text variant="heading">{s.title}</Text>
            <Text tone="muted">{s.body}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
