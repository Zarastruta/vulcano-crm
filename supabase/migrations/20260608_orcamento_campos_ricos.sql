-- ════════════════════════════════════════════════════════════════════
-- Campos ricos de orçamento (padrão Vulcano)
-- Adiciona especificações técnicas por item + desconto/imposto no orçamento,
-- para o gerador de orçamento bater com o template orcamento-vulcano-print.html
-- ════════════════════════════════════════════════════════════════════

-- Especificações técnicas por item
ALTER TABLE orcamento_itens
  ADD COLUMN IF NOT EXISTS largura_mm  INTEGER,
  ADD COLUMN IF NOT EXISTS altura_mm   INTEGER,
  ADD COLUMN IF NOT EXISTS material    TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS acabamento  TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS cor         TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS observacao  TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS icone       TEXT NOT NULL DEFAULT 'other';

-- Ajustes financeiros do orçamento (percentuais)
ALTER TABLE orcamentos
  ADD COLUMN IF NOT EXISTS desconto_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS imposto_pct  NUMERIC(5,2) NOT NULL DEFAULT 0;
