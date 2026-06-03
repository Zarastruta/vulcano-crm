import { Database } from "./types";

// Extended database types to fix missing columns/tables in generated types
export type ExtendedDatabase = Database & {
  public: Database["public"] & {
    Tables: Database["public"]["Tables"] & {
      condominios: {
        Row: Database["public"]["Tables"]["condominios"]["Row"] & {
          tipo_local: string | null;
          user_id: string | null;
        };
        Insert: Database["public"]["Tables"]["condominios"]["Insert"] & {
          tipo_local?: string | null;
          user_id?: string | null;
        };
        Update: Database["public"]["Tables"]["condominios"]["Update"] & {
          tipo_local?: string | null;
          user_id?: string | null;
        };
        Relationships: Database["public"]["Tables"]["condominios"]["Relationships"];
      };
      clientes: {
        Row: Database["public"]["Tables"]["clientes"]["Row"] & {
          cpf_cnpj: string | null;
          user_id: string | null;
        };
        Insert: Database["public"]["Tables"]["clientes"]["Insert"] & {
          cpf_cnpj?: string | null;
          user_id?: string | null;
        };
        Update: Database["public"]["Tables"]["clientes"]["Update"] & {
          cpf_cnpj?: string | null;
          user_id?: string | null;
        };
        Relationships: Database["public"]["Tables"]["clientes"]["Relationships"];
      };
      trabalhos: {
        Row: Database["public"]["Tables"]["trabalhos"]["Row"] & {
          conclusao_percentual: number | null;
          etapa_atual: string | null;
          custo_estimado: number | null;
          status_obra: string | null;
          // Novos campos Vulcano CRM (Fase 1)
          codigo: string | null;
          prioridade: string | null;
          prazo: string | null;
          responsavel_id: string | null;
          status_pagamento_detalhado: string | null;
          valor_pago: number | null;
          compras_pendentes: boolean | null;
          user_id: string | null;
        };
        Insert: Database["public"]["Tables"]["trabalhos"]["Insert"] & {
          conclusao_percentual?: number | null;
          etapa_atual?: string | null;
          custo_estimado?: number | null;
          status_obra?: string | null;
          codigo?: string | null;
          prioridade?: string | null;
          prazo?: string | null;
          responsavel_id?: string | null;
          status_pagamento_detalhado?: string | null;
          valor_pago?: number | null;
          compras_pendentes?: boolean | null;
          user_id?: string | null;
        };
        Update: Database["public"]["Tables"]["trabalhos"]["Update"] & {
          conclusao_percentual?: number | null;
          etapa_atual?: string | null;
          custo_estimado?: number | null;
          status_obra?: string | null;
          codigo?: string | null;
          prioridade?: string | null;
          prazo?: string | null;
          responsavel_id?: string | null;
          status_pagamento_detalhado?: string | null;
          valor_pago?: number | null;
          compras_pendentes?: boolean | null;
          user_id?: string | null;
        };
        Relationships: Database["public"]["Tables"]["trabalhos"]["Relationships"];
      };
      ferramentas: {
        Row: {
          id: string;
          nome: string;
          local_atual: string | null;
          quantidade: number | null;
          observacoes: string | null;
          criado_em: string;
          user_id: string | null;
        };
        Insert: {
          id?: string;
          nome: string;
          local_atual?: string | null;
          quantidade?: number | null;
          observacoes?: string | null;
          criado_em?: string;
          user_id?: string | null;
        };
        Update: {
          id?: string;
          nome?: string;
          local_atual?: string | null;
          quantidade?: number | null;
          observacoes?: string | null;
          criado_em?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      funcionarios: {
        Row: Database["public"]["Tables"]["funcionarios"]["Row"] & {
          user_id: string | null;
        };
        Insert: Database["public"]["Tables"]["funcionarios"]["Insert"] & {
          user_id?: string | null;
        };
        Update: Database["public"]["Tables"]["funcionarios"]["Update"] & {
          user_id?: string | null;
        };
        Relationships: Database["public"]["Tables"]["funcionarios"]["Relationships"];
      };
      orcamentos: {
        Row: Database["public"]["Tables"]["orcamentos"]["Row"] & {
          condicoes_pagamento: string | null;
          prazo_execucao: string | null;
          data_prevista_inicio: string | null;
          exclusoes: string | null;
          responsabilidades: string | null;
          user_id: string | null;
        };
        Insert: Database["public"]["Tables"]["orcamentos"]["Insert"] & {
          condicoes_pagamento?: string | null;
          prazo_execucao?: string | null;
          data_prevista_inicio?: string | null;
          exclusoes?: string | null;
          responsabilidades?: string | null;
          user_id?: string | null;
        };
        Update: Database["public"]["Tables"]["orcamentos"]["Update"] & {
          condicoes_pagamento?: string | null;
          prazo_execucao?: string | null;
          data_prevista_inicio?: string | null;
          exclusoes?: string | null;
          responsabilidades?: string | null;
          user_id?: string | null;
        };
        Relationships: Database["public"]["Tables"]["orcamentos"]["Relationships"];
      };
      catalogo_servicos: {
        Row: {
          id: string;
          nome: string;
          unidade_padrao: string;
          valor_base_sugerido: number;
          custo_padrao: number;
          custo_material: number | null;
          custo_mao_obra: number | null;
          custo_deslocamento: number | null;
          custo_galvanizacao: number | null;
          custo_pintura: number | null;
          custo_corte_dobra: number | null;
          margem_desejada: number | null;
          prestador_padrao_id: string | null;
          categoria: string | null;
          subcategoria: string | null;
          tipo_servico: string | null;
          dificuldade: string | null;
          tempo_medio: string | null;
          equipe_necessaria: string | null;
          criado_em: string;
          user_id: string | null;
        };
        Insert: {
          id?: string;
          nome: string;
          unidade_padrao?: string;
          valor_base_sugerido?: number;
          custo_padrao?: number;
          custo_material?: number | null;
          custo_mao_obra?: number | null;
          custo_deslocamento?: number | null;
          custo_galvanizacao?: number | null;
          custo_pintura?: number | null;
          custo_corte_dobra?: number | null;
          margem_desejada?: number | null;
          prestador_padrao_id?: string | null;
          categoria?: string | null;
          subcategoria?: string | null;
          tipo_servico?: string | null;
          dificuldade?: string | null;
          tempo_medio?: string | null;
          equipe_necessaria?: string | null;
          criado_em?: string;
          user_id?: string | null;
        };
        Update: {
          id?: string;
          nome?: string;
          unidade_padrao?: string;
          valor_base_sugerido?: number;
          custo_padrao?: number;
          custo_material?: number | null;
          custo_mao_obra?: number | null;
          custo_deslocamento?: number | null;
          custo_galvanizacao?: number | null;
          custo_pintura?: number | null;
          custo_corte_dobra?: number | null;
          margem_desejada?: number | null;
          prestador_padrao_id?: string | null;
          categoria?: string | null;
          subcategoria?: string | null;
          tipo_servico?: string | null;
          dificuldade?: string | null;
          tempo_medio?: string | null;
          equipe_necessaria?: string | null;
          criado_em?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "catalogo_servicos_prestador_padrao_id_fkey";
            columns: ["prestador_padrao_id"];
            isOneToOne: false;
            referencedRelation: "funcionarios";
            referencedColumns: ["id"];
          }
        ];
      };
      ponto_diario: {
        Row: {
          id: string;
          funcionario_id: string;
          trabalho_id: string | null;
          data: string;
          tipo_dia: string;
          valor_diaria: number;
          custo_total: number;
          observacoes: string | null;
          criado_em: string;
          user_id: string | null;
        };
        Insert: {
          id?: string;
          funcionario_id: string;
          trabalho_id?: string | null;
          data: string;
          tipo_dia?: string;
          valor_diaria: number;
          custo_total: number;
          observacoes?: string | null;
          criado_em?: string;
          user_id?: string | null;
        };
        Update: {
          id?: string;
          funcionario_id?: string;
          trabalho_id?: string | null;
          data?: string;
          tipo_dia?: string;
          valor_diaria?: number;
          custo_total?: number;
          observacoes?: string | null;
          criado_em?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      orcamento_itens: {
        Row: {
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
          user_id: string | null;
        };
        Insert: {
          id?: string;
          orcamento_id: string;
          servico_id?: string | null;
          nome: string;
          unidade: string;
          quantidade?: number;
          valor_unitario?: number;
          custo_unitario?: number;
          funcionario_id?: string | null;
          criado_em?: string;
          user_id?: string | null;
        };
        Update: {
          id?: string;
          orcamento_id?: string;
          servico_id?: string | null;
          nome?: string;
          unidade?: string;
          quantidade?: number;
          valor_unitario?: number;
          custo_unitario?: number;
          funcionario_id?: string | null;
          criado_em?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "orcamento_itens_orcamento_id_fkey";
            columns: ["orcamento_id"];
            isOneToOne: false;
            referencedRelation: "orcamentos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orcamento_itens_servico_id_fkey";
            columns: ["servico_id"];
            isOneToOne: false;
            referencedRelation: "catalogo_servicos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orcamento_itens_funcionario_id_fkey";
            columns: ["funcionario_id"];
            isOneToOne: false;
            referencedRelation: "funcionarios";
            referencedColumns: ["id"];
          }
        ];
      };
    };
  };
};
