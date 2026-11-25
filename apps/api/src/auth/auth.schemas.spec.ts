import { loginSchema, registerSchema, updateProfileSchema } from './auth.schemas';

describe('registerSchema', () => {
  const valid = { email: '  Pablo@Exemplo.com ', password: 'senha-segura', displayName: 'Pablo' };

  it('normaliza o e-mail e aplica os padrões', () => {
    const parsed = registerSchema.parse(valid);
    expect(parsed.email).toBe('pablo@exemplo.com');
    expect(parsed.interfaceLanguage).toBe('PT');
    expect(parsed.timezone).toBe('America/Sao_Paulo');
  });

  it('rejeita senha curta e e-mail inválido', () => {
    expect(registerSchema.safeParse({ ...valid, password: '1234567' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, email: 'sem-arroba' }).success).toBe(false);
  });

  it('rejeita fuso horário inexistente', () => {
    expect(registerSchema.safeParse({ ...valid, timezone: 'Marte/Olympus' }).success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('exige senha preenchida', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: '' }).success).toBe(false);
  });
});

describe('updateProfileSchema', () => {
  it('aceita um perfil de estudo completo', () => {
    const result = updateProfileSchema.safeParse({
      profession: 'Medicina',
      targetLanguage: 'EN',
      level: 'INTERMEDIATE',
      dailyGoalMinutes: 15,
      remindersEnabled: true,
      completeOnboarding: true,
    });
    expect(result.success).toBe(true);
    expect(result.success && result.data.profession).toBe('medicina');
  });

  it('aceita atualização parcial', () => {
    expect(updateProfileSchema.safeParse({ remindersEnabled: false }).success).toBe(true);
  });

  it.each([
    { level: 'EXPERT' },
    { dailyGoalMinutes: 2 },
    { dailyGoalMinutes: 500 },
    { profession: 'Med 1' },
    { targetLanguage: 'XX' },
  ])('rejeita %p', (input) => {
    expect(updateProfileSchema.safeParse(input).success).toBe(false);
  });
});
