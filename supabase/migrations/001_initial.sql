-- POUP — Migration inicial
-- Execute este script no SQL Editor do Supabase

-- ======================================================
-- 1. PROFILES
-- ======================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id      UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name    TEXT NOT NULL DEFAULT '',
  phone   TEXT,
  plan    TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê próprio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuário atualiza próprio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Usuário insere próprio perfil"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Trigger: criar perfil automaticamente após signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, phone, plan)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', ''),
    COALESCE(new.raw_user_meta_data->>'phone', NULL),
    'free'
  )
  ON CONFLICT (id) DO UPDATE SET
    name  = EXCLUDED.name,
    phone = EXCLUDED.phone;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ======================================================
-- 2. STATEMENTS
-- ======================================================
CREATE TABLE IF NOT EXISTS public.statements (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  filename       TEXT,
  period_start   DATE,
  period_end     DATE,
  total_income   NUMERIC(12,2) DEFAULT 0,
  total_expenses NUMERIC(12,2) DEFAULT 0,
  uploaded_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.statements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário gerencia próprios extratos"
  ON public.statements FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ======================================================
-- 3. TRANSACTIONS
-- ======================================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  statement_id UUID REFERENCES public.statements(id) ON DELETE SET NULL,
  date         DATE NOT NULL,
  description  TEXT NOT NULL,
  amount       NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  type         TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  category     TEXT NOT NULL DEFAULT 'Outros',
  category_ai  BOOLEAN DEFAULT FALSE,
  raw_data     JSONB,
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário gerencia próprias transações"
  ON public.transactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_date
  ON public.transactions(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_category
  ON public.transactions(user_id, category);

CREATE INDEX IF NOT EXISTS idx_transactions_statement
  ON public.transactions(statement_id);

-- ======================================================
-- Verificação
-- ======================================================
SELECT 'Tabelas criadas com sucesso!' AS status;
