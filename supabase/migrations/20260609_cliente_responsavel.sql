-- ============================================================
-- Adiciona "Responsável" ao cliente (vendedor/representante)
-- Liga o cliente a um membro da equipe (funcionarios).
-- ============================================================

ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS responsavel_id UUID REFERENCES funcionarios(id) ON DELETE SET NULL;

-- Índice para filtrar/agrupar clientes por responsável
CREATE INDEX IF NOT EXISTS idx_clientes_responsavel ON clientes(responsavel_id);
