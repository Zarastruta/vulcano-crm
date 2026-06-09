export type TipoContato = "pessoa_fisica" | "empresa" | "construtora" | "engenheiro" | "arquiteto" | "sindico" | "administradora";
export type StatusPagamento = "pago" | "nao_pago";
export type StatusOrcamento = "rascunho" | "enviado" | "aprovado" | "recusado" | "vencido" | "convertido";
export const OS_STATUSES = [
  "Novo", "Medição", "Projeto", "Compras",
  "Fabricação", "Galvanização", "Pintura", "Instalação", "Finalizado"
] as const;
export type StatusObra = typeof OS_STATUSES[number];
export type TipoFuncionario = "proprio" | "terceirizado";
export type TipoServico = "fabricacao" | "instalacao" | "manutencao" | "reforma" | "emergencial";
export type NivelDificuldade = "facil" | "medio" | "dificil";

export interface Cliente {
  id: string;
  nome: string;
  tipo: TipoContato;
  cpf_cnpj: string;
  telefone: string;
  email: string;
  observacoes: string;
  responsavel_id?: string | null;
  criadoEm: string;
}

export interface Local {
  id: string;
  nome: string;
  endereco: string;
  tipo_local: "residencial" | "comercial" | "industrial" | "obra";
  observacoes: string;
  criadoEm: string;
}

export interface Funcionario {
  id: string;
  nome: string;
  tipo: TipoFuncionario;
  valor_diaria: number;
  ativo: boolean;
  criadoEm: string;
}

export interface Trabalho {
  id: string;
  codigo: string;
  titulo: string;
  descricao: string;
  data: string;
  valor: number;
  status_pagamento: StatusPagamento;
  status_pagamento_detalhado: "pendente" | "parcial" | "pago";
  valor_pago: number;
  status_obra: StatusObra;
  prioridade: "Baixa" | "Média" | "Alta" | "Crítica";
  prazo: string | null;
  responsavel_id: string | null;
  compras_pendentes: boolean;
  nota_fiscal: string;
  nota_fiscal_data: string | null;
  nota_fiscal_hora: string | null;
  data_pagamento: string | null;
  nota_fiscal_foto_path: string;
  condominioId: string | null;
  clienteId: string | null;
  sindicoId: string | null;
  endereco_obra: string;
  observacoes: string;
  conclusao_percentual: number;
  etapa_atual: string;
  custo_estimado: number;
  criadoEm: string;
}

export interface Orcamento {
  id: string;
  numero: number;
  titulo: string;
  descricao: string;
  status: StatusOrcamento;
  data_emissao: string;
  validade: string | null;
  valor: number;
  observacoes: string;
  condicoes_pagamento?: string;
  prazo_execucao?: string;
  data_prevista_inicio?: string | null;
  exclusoes?: string;
  responsabilidades?: string;
  /** Ajustes financeiros do documento (padrão Vulcano) */
  desconto_pct?: number;
  imposto_pct?: number;
  condominioId: string | null;
  clienteId: string | null;
  sindicoId: string | null;
  endereco_obra: string;
  motivo_recusa: string;
  data_aprovacao: string | null;
  trabalhoId: string | null;
  criadoEm: string;
  itens?: OrcamentoItem[];
}

export interface Ferramenta {
  id: string;
  nome: string;
  local_atual: string;
  quantidade: number;
  observacoes: string;
  criadoEm: string;
}

export interface CatalogoServico {
  id: string;
  nome: string;
  unidade_padrao: string;
  valor_base_sugerido: number;
  custo_padrao: number;
  // Custo granular
  custo_material: number;
  custo_mao_obra: number;
  custo_deslocamento: number;
  custo_galvanizacao: number;
  custo_pintura: number;
  custo_corte_dobra: number;
  margem_desejada: number;
  // Classificação
  prestador_padrao_id: string | null;
  categoria: string | null;
  subcategoria: string | null;
  // Metadados operacionais
  tipo_servico: TipoServico | null;
  dificuldade: NivelDificuldade | null;
  tempo_medio: string | null;
  equipe_necessaria: string | null;
  criado_em: string;
}

export interface PontoDiario {
  id: string;
  funcionario_id: string;
  trabalho_id: string | null;
  data: string;           // "YYYY-MM-DD"
  tipo_dia: "completo" | "meio";
  valor_diaria: number;
  custo_total: number;
  observacoes: string;
  criado_em: string;
}

/** Ícones/esquemas técnicos do template de orçamento Vulcano */
export type IconeItem =
  | "gate" | "grade" | "stairs" | "cover"
  | "rail" | "struct" | "window" | "other";

export interface OrcamentoItem {
  id: string;
  orcamento_id: string;
  servico_id: string | null;
  nome: string;
  unidade: string;
  quantidade: number;
  valor_unitario: number;
  custo_unitario: number;
  funcionario_id: string | null;
  criado_em: string;
  // Especificações técnicas (padrão Vulcano) — opcionais
  largura_mm?: number | null;
  altura_mm?: number | null;
  material?: string;
  acabamento?: string;
  cor?: string;
  observacao?: string;
  icone?: IconeItem;
}

/** Dados pré-preenchidos vindos do parser de WhatsApp */
export interface OrcamentoDraft {
  titulo?: string;
  descricao?: string;
  endereco_obra?: string;
  clienteId?: string | null;
  clienteNomeDetectado?: string;
  items?: Partial<OrcamentoItem>[];
}
