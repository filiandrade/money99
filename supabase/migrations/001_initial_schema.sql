-- =============================================================================
-- Money99 - Schema Completo do Banco de Dados
-- Execute este script no SQL Editor do Supabase
-- =============================================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- TABELA: profiles (extensão da tabela auth.users do Supabase)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  currency TEXT NOT NULL DEFAULT 'BRL',
  theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- TABELA: categories (categorias de transações)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('receita', 'despesa', 'ambos')),
  color TEXT NOT NULL DEFAULT '#6366f1',
  icon TEXT NOT NULL DEFAULT 'tag',
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- TABELA: subcategories
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.subcategories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- TABELA: accounts (contas bancárias, cartões, etc.)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('corrente', 'poupanca', 'cartao_credito', 'investimento', 'dinheiro', 'outro')),
  balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  color TEXT NOT NULL DEFAULT '#6366f1',
  icon TEXT NOT NULL DEFAULT 'landmark',
  bank_name TEXT,
  last_four_digits TEXT,
  credit_limit DECIMAL(15, 2),
  due_day INTEGER CHECK (due_day >= 1 AND due_day <= 31),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- TABELA: transactions (transações financeiras)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  destination_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('receita', 'despesa', 'transferencia')),
  amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  notes TEXT,
  date DATE NOT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  recurring_frequency TEXT CHECK (recurring_frequency IN ('diario', 'semanal', 'mensal', 'anual')),
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- TABELA: budgets (orçamentos mensais por categoria)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2000 AND year <= 2100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, category_id, month, year)
);

-- =============================================================================
-- TABELA: goals (metas de economia)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  target_amount DECIMAL(15, 2) NOT NULL CHECK (target_amount > 0),
  current_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00 CHECK (current_amount >= 0),
  target_date DATE,
  color TEXT NOT NULL DEFAULT '#6366f1',
  icon TEXT NOT NULL DEFAULT 'target',
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- ÍNDICES para performance
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_budgets_user_month_year ON public.budgets(user_id, month, year);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);

-- =============================================================================
-- FUNÇÃO: atualizar updated_at automaticamente
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers de updated_at
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_subcategories_updated_at
  BEFORE UPDATE ON public.subcategories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_accounts_updated_at
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_budgets_updated_at
  BEFORE UPDATE ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- FUNÇÃO: criar profile e dados padrão quando novo usuário se registra
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_alimentacao_id UUID;
  v_moradia_id UUID;
  v_transporte_id UUID;
  v_saude_id UUID;
  v_educacao_id UUID;
  v_lazer_id UUID;
  v_roupas_id UUID;
  v_salario_id UUID;
  v_freelance_id UUID;
  v_investimentos_id UUID;
BEGIN
  v_user_id := NEW.id;

  -- Criar profile
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    v_user_id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );

  -- Criar conta padrão
  INSERT INTO public.accounts (user_id, name, type, balance, color, icon)
  VALUES (v_user_id, 'Conta Principal', 'corrente', 0.00, '#6366f1', 'landmark');

  -- Criar categorias de despesa padrão
  INSERT INTO public.categories (user_id, name, type, color, icon, is_default)
  VALUES (v_user_id, 'Alimentação', 'despesa', '#f97316', 'utensils', true)
  RETURNING id INTO v_alimentacao_id;

  INSERT INTO public.categories (user_id, name, type, color, icon, is_default)
  VALUES (v_user_id, 'Moradia', 'despesa', '#3b82f6', 'home', true)
  RETURNING id INTO v_moradia_id;

  INSERT INTO public.categories (user_id, name, type, color, icon, is_default)
  VALUES (v_user_id, 'Transporte', 'despesa', '#eab308', 'car', true)
  RETURNING id INTO v_transporte_id;

  INSERT INTO public.categories (user_id, name, type, color, icon, is_default)
  VALUES (v_user_id, 'Saúde', 'despesa', '#ef4444', 'heart-pulse', true)
  RETURNING id INTO v_saude_id;

  INSERT INTO public.categories (user_id, name, type, color, icon, is_default)
  VALUES (v_user_id, 'Educação', 'despesa', '#8b5cf6', 'graduation-cap', true)
  RETURNING id INTO v_educacao_id;

  INSERT INTO public.categories (user_id, name, type, color, icon, is_default)
  VALUES (v_user_id, 'Lazer', 'despesa', '#ec4899', 'gamepad-2', true)
  RETURNING id INTO v_lazer_id;

  INSERT INTO public.categories (user_id, name, type, color, icon, is_default)
  VALUES (v_user_id, 'Roupas', 'despesa', '#14b8a6', 'shirt', true)
  RETURNING id INTO v_roupas_id;

  INSERT INTO public.categories (user_id, name, type, color, icon, is_default)
  VALUES (v_user_id, 'Outros Gastos', 'despesa', '#64748b', 'ellipsis', true);

  -- Criar categorias de receita padrão
  INSERT INTO public.categories (user_id, name, type, color, icon, is_default)
  VALUES (v_user_id, 'Salário', 'receita', '#22c55e', 'banknote', true)
  RETURNING id INTO v_salario_id;

  INSERT INTO public.categories (user_id, name, type, color, icon, is_default)
  VALUES (v_user_id, 'Freelance', 'receita', '#10b981', 'laptop', true)
  RETURNING id INTO v_freelance_id;

  INSERT INTO public.categories (user_id, name, type, color, icon, is_default)
  VALUES (v_user_id, 'Investimentos', 'receita', '#06b6d4', 'trending-up', true)
  RETURNING id INTO v_investimentos_id;

  INSERT INTO public.categories (user_id, name, type, color, icon, is_default)
  VALUES (v_user_id, 'Outras Receitas', 'receita', '#84cc16', 'plus-circle', true);

  -- Criar subcategorias padrão
  INSERT INTO public.subcategories (user_id, category_id, name) VALUES
    (v_user_id, v_alimentacao_id, 'Supermercado'),
    (v_user_id, v_alimentacao_id, 'Restaurante'),
    (v_user_id, v_alimentacao_id, 'Delivery'),
    (v_user_id, v_alimentacao_id, 'Lanche'),
    (v_user_id, v_moradia_id, 'Aluguel'),
    (v_user_id, v_moradia_id, 'Condomínio'),
    (v_user_id, v_moradia_id, 'Água'),
    (v_user_id, v_moradia_id, 'Luz'),
    (v_user_id, v_moradia_id, 'Internet'),
    (v_user_id, v_moradia_id, 'Manutenção'),
    (v_user_id, v_transporte_id, 'Combustível'),
    (v_user_id, v_transporte_id, 'Uber/99'),
    (v_user_id, v_transporte_id, 'Transporte Público'),
    (v_user_id, v_transporte_id, 'Estacionamento'),
    (v_user_id, v_saude_id, 'Consulta Médica'),
    (v_user_id, v_saude_id, 'Farmácia'),
    (v_user_id, v_saude_id, 'Academia'),
    (v_user_id, v_saude_id, 'Plano de Saúde'),
    (v_user_id, v_educacao_id, 'Faculdade'),
    (v_user_id, v_educacao_id, 'Cursos Online'),
    (v_user_id, v_educacao_id, 'Livros'),
    (v_user_id, v_lazer_id, 'Cinema'),
    (v_user_id, v_lazer_id, 'Shows'),
    (v_user_id, v_lazer_id, 'Viagens'),
    (v_user_id, v_lazer_id, 'Streaming'),
    (v_user_id, v_investimentos_id, 'Dividendos'),
    (v_user_id, v_investimentos_id, 'Rendimentos'),
    (v_user_id, v_investimentos_id, 'Aluguel Recebido');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: criar dados padrão para novo usuário
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- FUNÇÃO: atualizar saldo da conta após transação
-- =============================================================================
CREATE OR REPLACE FUNCTION public.update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- INSERT: adicionar ao saldo
  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'receita' THEN
      UPDATE public.accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
    ELSIF NEW.type = 'despesa' THEN
      UPDATE public.accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
    ELSIF NEW.type = 'transferencia' THEN
      UPDATE public.accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
      UPDATE public.accounts SET balance = balance + NEW.amount WHERE id = NEW.destination_account_id;
    END IF;

  -- DELETE: reverter saldo
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.type = 'receita' THEN
      UPDATE public.accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
    ELSIF OLD.type = 'despesa' THEN
      UPDATE public.accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
    ELSIF OLD.type = 'transferencia' THEN
      UPDATE public.accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
      UPDATE public.accounts SET balance = balance - OLD.amount WHERE id = OLD.destination_account_id;
    END IF;

  -- UPDATE: reverter antigo e aplicar novo
  ELSIF TG_OP = 'UPDATE' THEN
    -- Reverter transação antiga
    IF OLD.type = 'receita' THEN
      UPDATE public.accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
    ELSIF OLD.type = 'despesa' THEN
      UPDATE public.accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
    ELSIF OLD.type = 'transferencia' THEN
      UPDATE public.accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
      UPDATE public.accounts SET balance = balance - OLD.amount WHERE id = OLD.destination_account_id;
    END IF;
    -- Aplicar transação nova
    IF NEW.type = 'receita' THEN
      UPDATE public.accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
    ELSIF NEW.type = 'despesa' THEN
      UPDATE public.accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
    ELSIF NEW.type = 'transferencia' THEN
      UPDATE public.accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
      UPDATE public.accounts SET balance = balance + NEW.amount WHERE id = NEW.destination_account_id;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: atualizar saldo após transação
CREATE TRIGGER on_transaction_change
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_account_balance();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Policies: profiles
CREATE POLICY "Usuário pode ver seu próprio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuário pode atualizar seu próprio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Policies: categories
CREATE POLICY "Usuário pode ver suas categorias"
  ON public.categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário pode criar categorias"
  ON public.categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuário pode atualizar suas categorias"
  ON public.categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário pode excluir suas categorias"
  ON public.categories FOR DELETE
  USING (auth.uid() = user_id);

-- Policies: subcategories
CREATE POLICY "Usuário pode ver suas subcategorias"
  ON public.subcategories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário pode criar subcategorias"
  ON public.subcategories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuário pode atualizar suas subcategorias"
  ON public.subcategories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário pode excluir suas subcategorias"
  ON public.subcategories FOR DELETE
  USING (auth.uid() = user_id);

-- Policies: accounts
CREATE POLICY "Usuário pode ver suas contas"
  ON public.accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário pode criar contas"
  ON public.accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuário pode atualizar suas contas"
  ON public.accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário pode excluir suas contas"
  ON public.accounts FOR DELETE
  USING (auth.uid() = user_id);

-- Policies: transactions
CREATE POLICY "Usuário pode ver suas transações"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário pode criar transações"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuário pode atualizar suas transações"
  ON public.transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário pode excluir suas transações"
  ON public.transactions FOR DELETE
  USING (auth.uid() = user_id);

-- Policies: budgets
CREATE POLICY "Usuário pode ver seus orçamentos"
  ON public.budgets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário pode criar orçamentos"
  ON public.budgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuário pode atualizar seus orçamentos"
  ON public.budgets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário pode excluir seus orçamentos"
  ON public.budgets FOR DELETE
  USING (auth.uid() = user_id);

-- Policies: goals
CREATE POLICY "Usuário pode ver suas metas"
  ON public.goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário pode criar metas"
  ON public.goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuário pode atualizar suas metas"
  ON public.goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário pode excluir suas metas"
  ON public.goals FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- VIEWS úteis
-- =============================================================================

-- View: resumo mensal por categoria
CREATE OR REPLACE VIEW public.monthly_category_summary AS
SELECT
  t.user_id,
  t.category_id,
  c.name AS category_name,
  c.color AS category_color,
  c.icon AS category_icon,
  t.type,
  EXTRACT(MONTH FROM t.date)::INTEGER AS month,
  EXTRACT(YEAR FROM t.date)::INTEGER AS year,
  SUM(t.amount) AS total_amount,
  COUNT(t.id) AS transaction_count
FROM public.transactions t
LEFT JOIN public.categories c ON t.category_id = c.id
GROUP BY t.user_id, t.category_id, c.name, c.color, c.icon, t.type,
         EXTRACT(MONTH FROM t.date), EXTRACT(YEAR FROM t.date);

-- Permissão para usuários autenticados acessarem a view
GRANT SELECT ON public.monthly_category_summary TO authenticated;
