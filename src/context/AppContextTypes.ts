import { createContext, useContext } from "react";
import { User } from "@supabase/supabase-js";
import { ExtendedDatabase } from "@/integrations/supabase/extended-types";
import {
  Cliente, Local, Trabalho, Orcamento, Funcionario, Ferramenta,
  TipoContato, StatusPagamento, StatusOrcamento, StatusObra, TipoFuncionario,
  CatalogoServico, OrcamentoItem, PontoDiario
} from "@/types";

export type ClienteRow = ExtendedDatabase["public"]["Tables"]["clientes"]["Row"];
export type CondominioRow = ExtendedDatabase["public"]["Tables"]["condominios"]["Row"];
export type TrabalhoRow = ExtendedDatabase["public"]["Tables"]["trabalhos"]["Row"];
export type OrcamentoRow = ExtendedDatabase["public"]["Tables"]["orcamentos"]["Row"];
export type FuncionarioRow = ExtendedDatabase["public"]["Tables"]["funcionarios"]["Row"];
export type FerramentaRow = ExtendedDatabase["public"]["Tables"]["ferramentas"]["Row"];
export type CatalogoServicoRow = ExtendedDatabase["public"]["Tables"]["catalogo_servicos"]["Row"];
export type OrcamentoItemRow = ExtendedDatabase["public"]["Tables"]["orcamento_itens"]["Row"];
export type PontoDiarioRow = ExtendedDatabase["public"]["Tables"]["ponto_diario"]["Row"];

export function mapCliente(row: ClienteRow): Cliente {
  return {
    id: row.id,
    nome: row.nome,
    tipo: row.tipo as TipoContato,
    cpf_cnpj: row.cpf_cnpj || "",
    telefone: row.telefone || "",
    email: row.email || "",
    observacoes: row.observacoes || "",
    criadoEm: row.criado_em,
  };
}

export function mapLocal(row: CondominioRow): Local {
  const r = row as CondominioRow & { tipo_local?: string | null };
  return {
    id: r.id,
    nome: r.nome,
    endereco: r.endereco,
    tipo_local: (r.tipo_local ?? "comercial") as Local["tipo_local"],
    observacoes: r.observacoes,
    criadoEm: r.criado_em,
  };
}

export function mapTrabalho(row: TrabalhoRow): Trabalho {
  return {
    id: row.id,
    codigo: row.codigo ?? "",
    titulo: row.titulo,
    descricao: row.descricao,
    data: row.data,
    prazo: row.prazo ?? null,
    valor: Number(row.valor),
    status_pagamento: (row.status_pagamento === "pago" ? "pago" : "nao_pago") as StatusPagamento,
    status_pagamento_detalhado: (row.status_pagamento_detalhado ?? "pendente") as Trabalho["status_pagamento_detalhado"],
    valor_pago: Number(row.valor_pago ?? 0),
    status_obra: (row.status_obra ?? "Novo") as StatusObra,
    prioridade: (row.prioridade ?? "Média") as Trabalho["prioridade"],
    compras_pendentes: row.compras_pendentes ?? false,
    responsavel_id: row.responsavel_id ?? null,
    nota_fiscal: row.nota_fiscal,
    nota_fiscal_data: row.nota_fiscal_data,
    nota_fiscal_hora: row.nota_fiscal_hora,
    data_pagamento: row.data_pagamento,
    nota_fiscal_foto_path: row.nota_fiscal_foto_path ?? "",
    condominioId: row.condominio_id,
    clienteId: row.cliente_id,
    sindicoId: row.sindico_id,
    endereco_obra: row.endereco_obra,
    observacoes: row.observacoes,
    conclusao_percentual: Number(row.conclusao_percentual ?? 0),
    etapa_atual: row.etapa_atual ?? "",
    custo_estimado: Number(row.custo_estimado ?? 0),
    criadoEm: row.criado_em,
  };
}

export function mapOrcamento(row: OrcamentoRow): Orcamento {
  return {
    id: row.id, 
    numero: row.numero, 
    titulo: row.titulo, 
    descricao: row.descricao,
    status: row.status as StatusOrcamento, 
    data_emissao: row.data_emissao, 
    validade: row.validade,
    valor: Number(row.valor), 
    observacoes: row.observacoes,
    condicoes_pagamento: row.condicoes_pagamento ?? "",
    prazo_execucao: row.prazo_execucao ?? "",
    data_prevista_inicio: row.data_prevista_inicio,
    exclusoes: row.exclusoes ?? "",
    responsabilidades: row.responsabilidades ?? "",
    condominioId: row.condominio_id, 
    clienteId: row.cliente_id, 
    sindicoId: row.sindico_id,
    endereco_obra: row.endereco_obra, 
    motivo_recusa: row.motivo_recusa,
    data_aprovacao: row.data_aprovacao, 
    trabalhoId: row.trabalho_id, 
    criadoEm: row.criado_em,
  };
}

export function mapFuncionario(row: FuncionarioRow): Funcionario {
  return {
    id: row.id,
    nome: row.nome,
    tipo: row.tipo as TipoFuncionario,
    valor_diaria: Number(row.valor_diaria || 0),
    ativo: row.ativo ?? true,
    criadoEm: row.criado_em,
  };
}

export function mapFerramenta(row: FerramentaRow): Ferramenta {
  return {
    id: row.id,
    nome: row.nome,
    local_atual: row.local_atual ?? "",
    quantidade: Number(row.quantidade ?? 1),
    observacoes: row.observacoes ?? "",
    criadoEm: row.criado_em,
  };
}

export function mapCatalogoServico(row: CatalogoServicoRow): CatalogoServico {
  return {
    id: row.id,
    nome: row.nome,
    unidade_padrao: row.unidade_padrao,
    valor_base_sugerido: Number(row.valor_base_sugerido),
    custo_padrao: Number(row.custo_padrao),
    custo_material:     Number(row.custo_material ?? 0),
    custo_mao_obra:     Number(row.custo_mao_obra ?? 0),
    custo_deslocamento: Number(row.custo_deslocamento ?? 0),
    custo_galvanizacao: Number(row.custo_galvanizacao ?? 0),
    custo_pintura:      Number(row.custo_pintura ?? 0),
    custo_corte_dobra:  Number(row.custo_corte_dobra ?? 0),
    margem_desejada:    Number(row.margem_desejada ?? 35),
    prestador_padrao_id: row.prestador_padrao_id,
    categoria:    row.categoria ?? null,
    subcategoria: row.subcategoria ?? null,
    tipo_servico:      (row.tipo_servico ?? null) as CatalogoServico["tipo_servico"],
    dificuldade:       (row.dificuldade ?? null) as CatalogoServico["dificuldade"],
    tempo_medio:       row.tempo_medio ?? null,
    equipe_necessaria: row.equipe_necessaria ?? null,
    criado_em: row.criado_em,
  };
}


export function mapPontoDiario(row: PontoDiarioRow): PontoDiario {
  return {
    id: row.id,
    funcionario_id: row.funcionario_id,
    trabalho_id: row.trabalho_id,
    data: row.data,
    tipo_dia: (row.tipo_dia === "meio" ? "meio" : "completo"),
    valor_diaria: Number(row.valor_diaria),
    custo_total: Number(row.custo_total),
    observacoes: row.observacoes ?? "",
    criado_em: row.criado_em,
  };
}

export function mapOrcamentoItem(row: OrcamentoItemRow): OrcamentoItem {
  return {
    id: row.id,
    orcamento_id: row.orcamento_id,
    servico_id: row.servico_id,
    nome: row.nome,
    unidade: row.unidade,
    quantidade: Number(row.quantidade),
    valor_unitario: Number(row.valor_unitario),
    custo_unitario: Number(row.custo_unitario),
    funcionario_id: row.funcionario_id,
    criado_em: row.criado_em,
  };
}

export interface AppContextType {
  isLoggedIn: boolean;
  user: User | null;
  loading: boolean;
  dataLoading: boolean;

  login: (email: string, senha: string) => Promise<string | null>;
  logout: () => Promise<void>;

  clientes: Cliente[];
  addCliente: (c: Omit<Cliente, "id" | "criadoEm">) => Promise<string | false>;
  updateCliente: (id: string, c: Partial<Cliente>) => Promise<boolean>;
  deleteCliente: (id: string) => Promise<boolean>;
  refreshClientes: () => Promise<void>;

  locais: Local[];
  addLocal: (c: Omit<Local, "id" | "criadoEm">) => Promise<string | false>;
  updateLocal: (id: string, c: Partial<Local>) => Promise<boolean>;
  deleteLocal: (id: string) => Promise<boolean>;
  refreshLocais: () => Promise<void>;

  trabalhos: Trabalho[];
  addTrabalho: (t: Omit<Trabalho, "id" | "criadoEm">) => Promise<string | false>;
  updateTrabalho: (id: string, t: Partial<Trabalho>) => Promise<boolean>;
  deleteTrabalho: (id: string) => Promise<boolean>;
  refreshTrabalhos: () => Promise<void>;

  orcamentos: Orcamento[];
  addOrcamento: (o: Omit<Orcamento, "id" | "criadoEm">) => Promise<string | false>;
  updateOrcamento: (id: string, o: Partial<Orcamento>) => Promise<boolean>;
  batchUpdateOrcamentosStatus: (ids: string[], status: StatusOrcamento) => Promise<void>;
  deleteOrcamento: (id: string) => Promise<boolean>;
  refreshOrcamentos: () => Promise<void>;

  funcionarios: Funcionario[];
  addFuncionario: (f: Omit<Funcionario, "id" | "criadoEm">) => Promise<string | false>;
  updateFuncionario: (id: string, f: Partial<Funcionario>) => Promise<boolean>;
  deleteFuncionario: (id: string) => Promise<boolean>;
  refreshFuncionarios: () => Promise<void>;

  ferramentas: Ferramenta[];
  addFerramenta: (f: Omit<Ferramenta, "id" | "criadoEm">) => Promise<string | false>;
  updateFerramenta: (id: string, f: Partial<Ferramenta>) => Promise<boolean>;
  deleteFerramenta: (id: string) => Promise<boolean>;
  refreshFerramentas: () => Promise<void>;

  refreshAll: () => Promise<void>;

  catalogoServicos: CatalogoServico[];
  addCatalogoServico: (s: Omit<CatalogoServico, "id" | "criado_em">) => Promise<string | false>;
  updateCatalogoServico: (id: string, s: Partial<CatalogoServico>) => Promise<boolean>;
  deleteCatalogoServico: (id: string) => Promise<boolean>;
  refreshCatalogoServicos: () => Promise<void>;

  pontoDiario: PontoDiario[];
  addPontoDiario: (p: Omit<PontoDiario, "id" | "criado_em">) => Promise<string | false>;
  updatePontoDiario: (id: string, p: Partial<PontoDiario>) => Promise<boolean>;
  deletePontoDiario: (id: string) => Promise<boolean>;
  refreshPontoDiario: () => Promise<void>;
}

export const AppContext = createContext<AppContextType | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
