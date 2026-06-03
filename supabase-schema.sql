-- ============================================================
-- VULCANO CRM — Schema completo
-- Execute no Supabase → SQL Editor
-- Gerado a partir dos tipos TypeScript do projeto
-- ============================================================
-- Ordem de criação respeita as dependências entre tabelas.
-- Use este arquivo para criar um banco do zero.
-- ============================================================

-- ── Extensões necessárias ────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";  -- uuid_generate_v4() (fallback)

-- ============================================================
-- 1. CLIENTES
-- Pessoas físicas, empresas, construtoras, engenheiros, etc.
-- ============================================================
CREATE TABLE IF NOT EXISTS clientes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        TEXT NOT NULL,
  tipo        TEXT NOT NULL DEFAULT 'pessoa_fisica'
                CHECK (tipo IN ('pessoa_fisica','empresa','construtora','engenheiro','arquiteto','sindico','administradora')),
  cpf_cnpj    TEXT NOT NULL DEFAULT '',
  telefone    TEXT NOT NULL DEFAULT '',
  email       TEXT NOT NULL DEFAULT '',
  observacoes TEXT NOT NULL DEFAULT '',
  user_id     UUID REFERENCES auth.users(id),
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. CONDOMINIOS  (frontend usa o nome "Locais")
-- Locais de instalação / obra — residencial, comercial, industrial, obra
-- ============================================================
CREATE TABLE IF NOT EXISTS condominios (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        TEXT NOT NULL,
  endereco    TEXT NOT NULL DEFAULT '',
  tipo_local  TEXT NOT NULL DEFAULT 'comercial'
                CHECK (tipo_local IN ('residencial','comercial','industrial','obra')),
  observacoes TEXT NOT NULL DEFAULT '',
  -- Colunas legadas mantidas para compatibilidade com dados antigos
  cnpj              TEXT NOT NULL DEFAULT '',
  sindico_id        UUID REFERENCES clientes(id) ON DELETE SET NULL,
  administradora_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  user_id     UUID REFERENCES auth.users(id),
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. FUNCIONARIOS
-- Equipe própria e terceirizados
-- ============================================================
CREATE TABLE IF NOT EXISTS funcionarios (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome         TEXT NOT NULL,
  tipo         TEXT NOT NULL DEFAULT 'proprio'
                 CHECK (tipo IN ('proprio','terceirizado')),
  valor_diaria NUMERIC(10,2) NOT NULL DEFAULT 0,
  ativo        BOOLEAN NOT NULL DEFAULT true,
  user_id      UUID REFERENCES auth.users(id),
  criado_em    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. FERRAMENTAS
-- Inventário de equipamentos e ferramentas
-- ============================================================
CREATE TABLE IF NOT EXISTS ferramentas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        TEXT NOT NULL,
  local_atual TEXT NOT NULL DEFAULT '',
  quantidade  INTEGER NOT NULL DEFAULT 1,
  observacoes TEXT NOT NULL DEFAULT '',
  user_id     UUID REFERENCES auth.users(id),
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 5. CATALOGO_SERVICOS
-- Tabela de precificação com custos granulares de serralheria
-- ============================================================
CREATE TABLE IF NOT EXISTS catalogo_servicos (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome                 TEXT NOT NULL,
  unidade_padrao       TEXT NOT NULL DEFAULT 'un',
  valor_base_sugerido  NUMERIC(10,2) NOT NULL DEFAULT 0,
  custo_padrao         NUMERIC(10,2) NOT NULL DEFAULT 0,
  -- Custos granulares
  custo_material       NUMERIC(10,2) NOT NULL DEFAULT 0,
  custo_mao_obra       NUMERIC(10,2) NOT NULL DEFAULT 0,
  custo_deslocamento   NUMERIC(10,2) NOT NULL DEFAULT 0,
  custo_galvanizacao   NUMERIC(10,2) NOT NULL DEFAULT 0,
  custo_pintura        NUMERIC(10,2) NOT NULL DEFAULT 0,
  custo_corte_dobra    NUMERIC(10,2) NOT NULL DEFAULT 0,
  margem_desejada      NUMERIC(5,2)  NOT NULL DEFAULT 35,
  -- Classificação
  categoria            TEXT,
  subcategoria         TEXT,
  prestador_padrao_id  UUID REFERENCES funcionarios(id) ON DELETE SET NULL,
  -- Metadados operacionais
  tipo_servico         TEXT CHECK (tipo_servico IN ('fabricacao','instalacao','manutencao','reforma','emergencial')),
  dificuldade          TEXT CHECK (dificuldade IN ('facil','medio','dificil')),
  tempo_medio          TEXT,
  equipe_necessaria    TEXT,
  user_id              UUID REFERENCES auth.users(id),
  criado_em            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 6. TRABALHOS  (Ordens de Serviço)
-- Pipeline completo de produção em 9 etapas
-- ============================================================
CREATE TABLE IF NOT EXISTS trabalhos (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Identificação
  codigo                    TEXT NOT NULL DEFAULT '',           -- "OS-2026-001"
  titulo                    TEXT NOT NULL,
  descricao                 TEXT NOT NULL DEFAULT '',
  data                      DATE NOT NULL DEFAULT CURRENT_DATE,
  prazo                     DATE,
  -- Etapa e prioridade
  status_obra               TEXT NOT NULL DEFAULT 'Novo'
                              CHECK (status_obra IN (
                                'Novo','Medição','Projeto','Compras',
                                'Fabricação','Galvanização','Pintura','Instalação','Finalizado'
                              )),
  prioridade                TEXT NOT NULL DEFAULT 'Média'
                              CHECK (prioridade IN ('Baixa','Média','Alta','Crítica')),
  compras_pendentes         BOOLEAN NOT NULL DEFAULT false,
  conclusao_percentual      INTEGER NOT NULL DEFAULT 0 CHECK (conclusao_percentual BETWEEN 0 AND 100),
  etapa_atual               TEXT NOT NULL DEFAULT '',
  responsavel_id            UUID REFERENCES funcionarios(id) ON DELETE SET NULL,
  -- Financeiro
  valor                     NUMERIC(12,2) NOT NULL DEFAULT 0,
  custo_estimado            NUMERIC(12,2) NOT NULL DEFAULT 0,
  status_pagamento          TEXT NOT NULL DEFAULT 'nao_pago'
                              CHECK (status_pagamento IN ('pago','nao_pago')),
  status_pagamento_detalhado TEXT NOT NULL DEFAULT 'pendente'
                              CHECK (status_pagamento_detalhado IN ('pendente','parcial','pago')),
  valor_pago                NUMERIC(12,2) NOT NULL DEFAULT 0,
  data_pagamento            DATE,
  -- Nota fiscal
  nota_fiscal               TEXT NOT NULL DEFAULT '',
  nota_fiscal_data          DATE,
  nota_fiscal_hora          TEXT,
  nota_fiscal_foto_path     TEXT NOT NULL DEFAULT '',
  -- Vínculos
  condominio_id             UUID REFERENCES condominios(id) ON DELETE SET NULL,
  cliente_id                UUID REFERENCES clientes(id) ON DELETE SET NULL,
  sindico_id                UUID REFERENCES clientes(id) ON DELETE SET NULL,
  endereco_obra             TEXT NOT NULL DEFAULT '',
  observacoes               TEXT NOT NULL DEFAULT '',
  user_id                   UUID REFERENCES auth.users(id),
  criado_em                 TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 7. ORCAMENTOS
-- Propostas comerciais multi-etapa
-- ============================================================
CREATE TABLE IF NOT EXISTS orcamentos (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero                INTEGER NOT NULL DEFAULT 0,
  titulo                TEXT NOT NULL,
  descricao             TEXT NOT NULL DEFAULT '',
  status                TEXT NOT NULL DEFAULT 'rascunho'
                          CHECK (status IN ('rascunho','enviado','aprovado','recusado','vencido','convertido')),
  data_emissao          DATE NOT NULL DEFAULT CURRENT_DATE,
  validade              DATE,
  valor                 NUMERIC(12,2) NOT NULL DEFAULT 0,
  observacoes           TEXT NOT NULL DEFAULT '',
  -- Cláusulas contratuais
  condicoes_pagamento   TEXT NOT NULL DEFAULT '',
  prazo_execucao        TEXT NOT NULL DEFAULT '',
  data_prevista_inicio  DATE,
  exclusoes             TEXT NOT NULL DEFAULT '',
  responsabilidades     TEXT NOT NULL DEFAULT '',
  -- Localização e responsáveis
  condominio_id         UUID REFERENCES condominios(id) ON DELETE SET NULL,
  cliente_id            UUID REFERENCES clientes(id) ON DELETE SET NULL,
  sindico_id            UUID REFERENCES clientes(id) ON DELETE SET NULL,
  endereco_obra         TEXT NOT NULL DEFAULT '',
  -- Resultado
  motivo_recusa         TEXT NOT NULL DEFAULT '',
  data_aprovacao        DATE,
  trabalho_id           UUID REFERENCES trabalhos(id) ON DELETE SET NULL,
  user_id               UUID REFERENCES auth.users(id),
  criado_em             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-incremento de número de orçamento por usuário
CREATE OR REPLACE FUNCTION next_orcamento_numero(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE v_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(numero), 0) + 1 INTO v_num
  FROM orcamentos
  WHERE user_id = p_user_id;
  RETURN v_num;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 8. ORCAMENTO_ITENS
-- Linhas de serviço de cada orçamento
-- ============================================================
CREATE TABLE IF NOT EXISTS orcamento_itens (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id   UUID NOT NULL REFERENCES orcamentos(id) ON DELETE CASCADE,
  servico_id     UUID REFERENCES catalogo_servicos(id) ON DELETE SET NULL,
  nome           TEXT NOT NULL,
  unidade        TEXT NOT NULL DEFAULT 'un',
  quantidade     NUMERIC(10,3) NOT NULL DEFAULT 1,
  valor_unitario NUMERIC(12,2) NOT NULL DEFAULT 0,
  custo_unitario NUMERIC(12,2) NOT NULL DEFAULT 0,
  funcionario_id UUID REFERENCES funcionarios(id) ON DELETE SET NULL,
  user_id        UUID REFERENCES auth.users(id),
  criado_em      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 9. PONTO_DIARIO
-- Controle de diárias da equipe por OS
-- ============================================================
CREATE TABLE IF NOT EXISTS ponto_diario (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id UUID NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
  trabalho_id    UUID REFERENCES trabalhos(id) ON DELETE SET NULL,
  data           DATE NOT NULL,
  tipo_dia       TEXT NOT NULL DEFAULT 'completo'
                   CHECK (tipo_dia IN ('completo','meio')),
  valor_diaria   NUMERIC(10,2) NOT NULL DEFAULT 0,
  custo_total    NUMERIC(10,2) NOT NULL DEFAULT 0,
  observacoes    TEXT NOT NULL DEFAULT '',
  user_id        UUID REFERENCES auth.users(id),
  criado_em      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 10. ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_clientes_user_id          ON clientes(user_id);
CREATE INDEX IF NOT EXISTS idx_condominios_user_id       ON condominios(user_id);
CREATE INDEX IF NOT EXISTS idx_funcionarios_user_id      ON funcionarios(user_id);
CREATE INDEX IF NOT EXISTS idx_ferramentas_user_id       ON ferramentas(user_id);
CREATE INDEX IF NOT EXISTS idx_catalogo_user_id          ON catalogo_servicos(user_id);
CREATE INDEX IF NOT EXISTS idx_trabalhos_user_id         ON trabalhos(user_id);
CREATE INDEX IF NOT EXISTS idx_trabalhos_status_obra     ON trabalhos(user_id, status_obra);
CREATE INDEX IF NOT EXISTS idx_trabalhos_prazo           ON trabalhos(prazo) WHERE prazo IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_trabalhos_compras         ON trabalhos(user_id, compras_pendentes) WHERE compras_pendentes = true;
CREATE INDEX IF NOT EXISTS idx_orcamentos_user_id        ON orcamentos(user_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_status         ON orcamentos(user_id, status);
CREATE INDEX IF NOT EXISTS idx_orcamento_itens_orc_id    ON orcamento_itens(orcamento_id);
CREATE INDEX IF NOT EXISTS idx_ponto_diario_user_id      ON ponto_diario(user_id);
CREATE INDEX IF NOT EXISTS idx_ponto_diario_data         ON ponto_diario(user_id, data);

-- ============================================================
-- 11. FUNÇÃO next_os_code  (Fase 7)
-- Gera código sequencial por usuário/ano: "OS-2026-001"
-- ============================================================
CREATE OR REPLACE FUNCTION next_os_code(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_year TEXT := EXTRACT(YEAR FROM NOW())::TEXT;
  v_seq  INT;
BEGIN
  SELECT COUNT(*) + 1 INTO v_seq
  FROM trabalhos
  WHERE user_id = p_user_id
    AND EXTRACT(YEAR FROM criado_em) = EXTRACT(YEAR FROM NOW());
  RETURN 'OS-' || v_year || '-' || LPAD(v_seq::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 12. ROW LEVEL SECURITY  (Fase 6)
-- Isolamento completo por user_id — cada usuário vê
-- apenas seus próprios dados.
-- ============================================================

-- clientes
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "usuarios_isolados_clientes" ON clientes;
CREATE POLICY "usuarios_isolados_clientes" ON clientes
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- condominios (locais)
ALTER TABLE condominios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "usuarios_isolados_condominios" ON condominios;
CREATE POLICY "usuarios_isolados_condominios" ON condominios
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- funcionarios
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "usuarios_isolados_funcionarios" ON funcionarios;
CREATE POLICY "usuarios_isolados_funcionarios" ON funcionarios
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ferramentas
ALTER TABLE ferramentas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "usuarios_isolados_ferramentas" ON ferramentas;
CREATE POLICY "usuarios_isolados_ferramentas" ON ferramentas
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- catalogo_servicos
ALTER TABLE catalogo_servicos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "usuarios_isolados_catalogo_servicos" ON catalogo_servicos;
CREATE POLICY "usuarios_isolados_catalogo_servicos" ON catalogo_servicos
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- trabalhos
ALTER TABLE trabalhos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "usuarios_isolados_trabalhos" ON trabalhos;
CREATE POLICY "usuarios_isolados_trabalhos" ON trabalhos
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- orcamentos
ALTER TABLE orcamentos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "usuarios_isolados_orcamentos" ON orcamentos;
CREATE POLICY "usuarios_isolados_orcamentos" ON orcamentos
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- orcamento_itens
ALTER TABLE orcamento_itens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "usuarios_isolados_orcamento_itens" ON orcamento_itens;
CREATE POLICY "usuarios_isolados_orcamento_itens" ON orcamento_itens
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ponto_diario
ALTER TABLE ponto_diario ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "usuarios_isolados_ponto_diario" ON ponto_diario;
CREATE POLICY "usuarios_isolados_ponto_diario" ON ponto_diario
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 13. MIGRAÇÃO — Se você está adaptando um banco existente
-- Execute apenas se as tabelas JÁ EXISTEM com dados.
-- ============================================================

-- Adicionar colunas novas às tabelas existentes (idempotente)
ALTER TABLE clientes     ADD COLUMN IF NOT EXISTS cpf_cnpj  TEXT         NOT NULL DEFAULT '';
ALTER TABLE clientes     ADD COLUMN IF NOT EXISTS user_id   UUID         REFERENCES auth.users(id);

ALTER TABLE condominios  ADD COLUMN IF NOT EXISTS tipo_local TEXT        NOT NULL DEFAULT 'comercial';
ALTER TABLE condominios  ADD COLUMN IF NOT EXISTS user_id   UUID         REFERENCES auth.users(id);

ALTER TABLE funcionarios ADD COLUMN IF NOT EXISTS user_id   UUID         REFERENCES auth.users(id);
ALTER TABLE ferramentas  ADD COLUMN IF NOT EXISTS user_id   UUID         REFERENCES auth.users(id);

ALTER TABLE trabalhos    ADD COLUMN IF NOT EXISTS codigo                    TEXT    NOT NULL DEFAULT '';
ALTER TABLE trabalhos    ADD COLUMN IF NOT EXISTS prioridade                TEXT    NOT NULL DEFAULT 'Média';
ALTER TABLE trabalhos    ADD COLUMN IF NOT EXISTS prazo                     DATE;
ALTER TABLE trabalhos    ADD COLUMN IF NOT EXISTS responsavel_id            UUID    REFERENCES funcionarios(id) ON DELETE SET NULL;
ALTER TABLE trabalhos    ADD COLUMN IF NOT EXISTS status_obra               TEXT    NOT NULL DEFAULT 'Novo';
ALTER TABLE trabalhos    ADD COLUMN IF NOT EXISTS status_pagamento_detalhado TEXT   NOT NULL DEFAULT 'pendente';
ALTER TABLE trabalhos    ADD COLUMN IF NOT EXISTS valor_pago                NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE trabalhos    ADD COLUMN IF NOT EXISTS compras_pendentes         BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trabalhos    ADD COLUMN IF NOT EXISTS conclusao_percentual      INTEGER NOT NULL DEFAULT 0;
ALTER TABLE trabalhos    ADD COLUMN IF NOT EXISTS etapa_atual               TEXT    NOT NULL DEFAULT '';
ALTER TABLE trabalhos    ADD COLUMN IF NOT EXISTS custo_estimado            NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE trabalhos    ADD COLUMN IF NOT EXISTS user_id                   UUID    REFERENCES auth.users(id);

ALTER TABLE orcamentos   ADD COLUMN IF NOT EXISTS condicoes_pagamento  TEXT NOT NULL DEFAULT '';
ALTER TABLE orcamentos   ADD COLUMN IF NOT EXISTS prazo_execucao       TEXT NOT NULL DEFAULT '';
ALTER TABLE orcamentos   ADD COLUMN IF NOT EXISTS data_prevista_inicio DATE;
ALTER TABLE orcamentos   ADD COLUMN IF NOT EXISTS exclusoes            TEXT NOT NULL DEFAULT '';
ALTER TABLE orcamentos   ADD COLUMN IF NOT EXISTS responsabilidades    TEXT NOT NULL DEFAULT '';
ALTER TABLE orcamentos   ADD COLUMN IF NOT EXISTS user_id              UUID REFERENCES auth.users(id);

ALTER TABLE catalogo_servicos ADD COLUMN IF NOT EXISTS custo_material     NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE catalogo_servicos ADD COLUMN IF NOT EXISTS custo_mao_obra     NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE catalogo_servicos ADD COLUMN IF NOT EXISTS custo_deslocamento NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE catalogo_servicos ADD COLUMN IF NOT EXISTS custo_galvanizacao NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE catalogo_servicos ADD COLUMN IF NOT EXISTS custo_pintura      NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE catalogo_servicos ADD COLUMN IF NOT EXISTS custo_corte_dobra  NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE catalogo_servicos ADD COLUMN IF NOT EXISTS margem_desejada    NUMERIC(5,2)  NOT NULL DEFAULT 35;
ALTER TABLE catalogo_servicos ADD COLUMN IF NOT EXISTS tipo_servico       TEXT;
ALTER TABLE catalogo_servicos ADD COLUMN IF NOT EXISTS dificuldade        TEXT;
ALTER TABLE catalogo_servicos ADD COLUMN IF NOT EXISTS tempo_medio        TEXT;
ALTER TABLE catalogo_servicos ADD COLUMN IF NOT EXISTS equipe_necessaria  TEXT;
ALTER TABLE catalogo_servicos ADD COLUMN IF NOT EXISTS user_id            UUID REFERENCES auth.users(id);

ALTER TABLE orcamento_itens ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE ponto_diario    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- ============================================================
-- 14. VERIFICAÇÃO FINAL
-- ============================================================
SELECT
  tablename,
  rowsecurity AS rls_ativo
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'clientes','condominios','funcionarios','ferramentas',
    'catalogo_servicos','trabalhos','orcamentos',
    'orcamento_itens','ponto_diario'
  )
ORDER BY tablename;
