// Gera um orçamento de exemplo para conferência visual do template.
// Uso: npx tsx scripts/preview-orcamento.mts  → cria orcamento-preview.html
import { writeFileSync } from "node:fs";
import { buildOrcamentoHtml } from "../src/services/OrcamentoPrint.ts";

const orcamento: any = {
  id: "demo", numero: 7, titulo: "Portões e gradil — Residência",
  descricao: "", status: "enviado",
  data_emissao: "2026-06-08", validade: "2026-06-23", valor: 0, observacoes: "Inclui instalação. Não inclui alvenaria.",
  condicoes_pagamento: "50% entrada + 50% na entrega", prazo_execucao: "20 dias úteis",
  exclusoes: "Pintura de piso e obras civis.", responsabilidades: "Liberar acesso e energia no local.",
  desconto_pct: 5, imposto_pct: 8,
  condominioId: null, clienteId: "c1", sindicoId: null,
  endereco_obra: "Rua das Palmeiras, 320 — Centro, Governador Celso Ramos/SC",
  motivo_recusa: "", data_aprovacao: null, trabalhoId: null, criadoEm: "",
};
const cliente: any = { id: "c1", nome: "João da Silva", tipo: "pessoa_fisica", cpf_cnpj: "123.456.789-00", telefone: "(48) 99999-1234", email: "", observacoes: "", criadoEm: "" };
const items: any[] = [
  { id: "1", orcamento_id: "demo", servico_id: null, nome: "Portão Basculante Articulado", unidade: "un", quantidade: 1, valor_unitario: 4800, custo_unitario: 0, funcionario_id: null, criado_em: "",
    largura_mm: 4620, altura_mm: 2460, material: "Aço Galvanizado a Fogo", acabamento: "Pintura Eletrostática", cor: "Preto Fosco / RAL 9005", observacao: "Inclui motor, dobradiças e cadeado.", icone: "gate" },
  { id: "2", orcamento_id: "demo", servico_id: null, nome: "Grade de Janela", unidade: "un", quantidade: 4, valor_unitario: 380, custo_unitario: 0, funcionario_id: null, criado_em: "",
    largura_mm: 1200, altura_mm: 1000, material: "Aço Carbono", acabamento: "Zarcão + Esmalte Sintético", cor: "Preto", observacao: "", icone: "grade" },
  { id: "3", orcamento_id: "demo", servico_id: null, nome: "Corrimão Escada Externa", unidade: "m", quantidade: 6, valor_unitario: 210, custo_unitario: 0, funcionario_id: null, criado_em: "",
    largura_mm: null, altura_mm: 900, material: "Aço Inox 304", acabamento: "Polido", cor: "", observacao: "Fixação química nas paredes.", icone: "rail" },
];

const html = buildOrcamentoHtml(orcamento, items, cliente, undefined, false);
writeFileSync(new URL("../orcamento-preview.html", import.meta.url), html);
console.log("OK: orcamento-preview.html gerado");
