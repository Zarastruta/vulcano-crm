import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarIcon, Plus, Trash2, Tag, Save, ArrowRight, User, HelpCircle,
  Info, CheckCircle2, ChevronLeft, ChevronRight, UserPlus, Building2,
  Search, PackageOpen, Users,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Orcamento, StatusOrcamento, OrcamentoItem, OrcamentoDraft } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { addDays } from "date-fns";
import { ContatoModal } from "./ContatoModal";
import { LocalModal } from "./LocalModal";

const DEFAULT_CONDICOES = "Entrada de 50% na aprovação e 50% na conclusão dos serviços.";
const DEFAULT_PRAZO = "Aproximadamente 15 dias úteis após a aprovação e liberação do local.";
const DEFAULT_EXCLUSOES = "Fornecimento de materiais de acabamento (pisos, louças, metais), caçamba de entulho, regularização em órgãos públicos e taxas extras de condomínio.";
const DEFAULT_RESPONSABILIDADES = "O cliente deve garantir o livre acesso da equipe ao local em horário comercial, fornecer água e energia elétrica, e remover objetos pessoais frágeis da área de obra.";

const UNIDADES_COMUNS = [
  { value: "m²", label: "m² — Metro quadrado" },
  { value: "m", label: "m — Metro linear" },
  { value: "m³", label: "m³ — Metro cúbico" },
  { value: "un", label: "un — Unidade" },
  { value: "h", label: "h — Hora" },
  { value: "vb", label: "vb — Verba" },
  { value: "kg", label: "kg — Quilograma" },
  { value: "pç", label: "pç — Peça" },
  { value: "sc", label: "sc — Saco" },
  { value: "cx", label: "cx — Caixa" },
  { value: "l", label: "l — Litro" },
  { value: "pt", label: "pt — Ponto" },
];

// ── Especificações técnicas (padrão Vulcano / template de orçamento) ──
const MATERIAIS = [
  "Aço Carbono", "Aço Galvanizado a Fogo", "Aço Inox 304", "Aço Inox 316",
  "Ferro Forjado", "Alumínio", "Misto (Aço + Alumínio)",
];
const ACABAMENTOS = [
  "Pintura Eletrostática", "Pintura Epóxi", "Zarcão + Esmalte Sintético",
  "Galvanizado a Fogo", "Polido", "Sem acabamento (em bruto)",
];
const ICONES_ITEM: { value: string; label: string }[] = [
  { value: "gate", label: "🚧 Portão" },
  { value: "grade", label: "⬛ Grade" },
  { value: "stairs", label: "🪜 Escada" },
  { value: "cover", label: "🔲 Tampa / Alçapão" },
  { value: "rail", label: "➿ Corrimão" },
  { value: "struct", label: "🏗️ Estrutura" },
  { value: "window", label: "🪟 Janela / Esquadria" },
  { value: "other", label: "🔩 Outro" },
];

const TAB_ORDER = ["dados", "servicos", "prazos", "clausulas", "revisao"] as const;
type TabKey = typeof TAB_ORDER[number];

// Detecta (uma vez) se a migration de campos ricos já foi aplicada no banco.
// Mantém o app funcionando antes E depois de rodar a migration.
let _richColsAvailable: boolean | null = null;
async function detectRichCols(): Promise<boolean> {
  if (_richColsAvailable !== null) return _richColsAvailable;
  const { error } = await supabase.from("orcamento_itens").select("largura_mm").limit(1);
  _richColsAvailable = !error;
  return _richColsAvailable;
}

const statusOptions: { value: StatusOrcamento; label: string }[] = [
  { value: "rascunho", label: "Rascunho" },
  { value: "enviado", label: "Enviado" },
  { value: "aprovado", label: "Aprovado" },
  { value: "recusado", label: "Recusado" },
  { value: "vencido", label: "Vencido" },
  { value: "convertido", label: "Convertido" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  orcamento?: Orcamento;
  initialClienteId?: string;
  initialDraft?: OrcamentoDraft;
}

export function OrcamentoModal({ open, onClose, orcamento, initialClienteId, initialDraft }: Props) {
  const { addOrcamento, updateOrcamento, locais, clientes, catalogoServicos, refreshAll } = useApp();
  const isEdit = !!orcamento;
  const [activeTab, setActiveTab] = useState<TabKey>("dados");

  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    status: "rascunho" as StatusOrcamento,
    data_emissao: new Date(),
    validade: null as Date | null,
    valor: 0,
    observacoes: "",
    condominioId: null as string | null,
    clienteId: null as string | null,
    sindicoId: null as string | null,
    endereco_obra: "",
    motivo_recusa: "",
    data_aprovacao: null as Date | null,
    condicoes_pagamento: "",
    prazo_execucao: "",
    data_prevista_inicio: null as Date | null,
    exclusoes: "",
    responsabilidades: "",
    // Custos adicionais metalurgia
    ca_mao_obra: 0,
    ca_galvanizacao: 0,
    ca_pintura: 0,
    ca_transporte: 0,
    ca_outros: 0,
    margem_lucro: 0,
    // Ajustes do documento (padrão Vulcano)
    desconto_pct: 0,
    imposto_pct: 0,
  });

  const [items, setItems] = useState<Partial<OrcamentoItem>[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [newClientModalOpen, setNewClientModalOpen] = useState(false);
  const [newCondominioModalOpen, setNewCondominioModalOpen] = useState(false);
  const [catalogoAberto, setCatalogoAberto] = useState(false);
  const [catalogoSearch, setCatalogoSearch] = useState("");

  // ─── Cliente selecionado e tipo ───────────────────────────────────────────
  const clienteSelecionado = clientes.find(c => c.id === form.clienteId);
  const clienteTipo = clienteSelecionado?.tipo;
  const precisaCondominio = clienteTipo === "sindico" || clienteTipo === "administradora";

  // ─── Reset ao abrir ────────────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      setActiveTab("dados");
      if (orcamento) {
        setForm({
          titulo: orcamento.titulo,
          descricao: orcamento.descricao,
          status: orcamento.status,
          data_emissao: orcamento.data_emissao ? new Date(orcamento.data_emissao + "T12:00:00") : new Date(),
          validade: orcamento.validade ? new Date(orcamento.validade + "T12:00:00") : null,
          valor: orcamento.valor,
          observacoes: orcamento.observacoes,
          condominioId: orcamento.condominioId,
          clienteId: orcamento.clienteId,
          sindicoId: orcamento.sindicoId,
          endereco_obra: orcamento.endereco_obra,
          motivo_recusa: orcamento.motivo_recusa,
          data_aprovacao: orcamento.data_aprovacao ? new Date(orcamento.data_aprovacao + "T12:00:00") : null,
          condicoes_pagamento: orcamento.condicoes_pagamento || "",
          prazo_execucao: orcamento.prazo_execucao || "",
          data_prevista_inicio: orcamento.data_prevista_inicio ? new Date(orcamento.data_prevista_inicio + "T12:00:00") : null,
          exclusoes: orcamento.exclusoes || "",
          responsabilidades: orcamento.responsabilidades || "",
          ca_mao_obra: 0, ca_galvanizacao: 0, ca_pintura: 0, ca_transporte: 0, ca_outros: 0, margem_lucro: 0,
          desconto_pct: orcamento.desconto_pct ?? 0,
          imposto_pct: orcamento.imposto_pct ?? 0,
        });
        fetchItems(orcamento.id);
      } else {
        setForm({
          titulo: initialDraft?.titulo ?? "",
          descricao: initialDraft?.descricao ?? "",
          status: "rascunho",
          data_emissao: new Date(),
          validade: addDays(new Date(), 10),
          valor: 0,
          observacoes: "",
          condominioId: null,
          clienteId: initialDraft?.clienteId ?? initialClienteId ?? null,
          sindicoId: null,
          endereco_obra: initialDraft?.endereco_obra ?? "",
          motivo_recusa: "",
          data_aprovacao: null,
          condicoes_pagamento: DEFAULT_CONDICOES,
          prazo_execucao: DEFAULT_PRAZO,
          data_prevista_inicio: addDays(new Date(), 7),
          exclusoes: DEFAULT_EXCLUSOES,
          responsabilidades: DEFAULT_RESPONSABILIDADES,
          ca_mao_obra: 0, ca_galvanizacao: 0, ca_pintura: 0, ca_transporte: 0, ca_outros: 0, margem_lucro: 0,
          desconto_pct: 0, imposto_pct: 0,
        });
        setItems(initialDraft?.items ?? []);
        // Se tem draft com clienteId, auto-vai para Passo 2 para o usuário ver os itens
        if (initialDraft?.items && initialDraft.items.length > 0) {
          setActiveTab("servicos");
        }
      }
    }
  }, [orcamento, open, initialClienteId, initialDraft]);

  const fetchItems = async (orcID: string) => {
    const { data, error } = await supabase
      .from("orcamento_itens").select("*")
      .eq("orcamento_id", orcID).order("criado_em", { ascending: true });
    if (!error && data) setItems(data);
  };

  // ─── Handlers de cliente e condomínio com lógica inteligente ──────────────
  const handleClienteChange = (v: string) => {
    const novoCliente = clientes.find(c => c.id === v);
    const updates: Partial<typeof form> = { clienteId: v === "_none" ? null : v };

    // Se não é síndico nem administradora, limpa vínculo com condomínio
    if (!novoCliente || (novoCliente.tipo !== "sindico" && novoCliente.tipo !== "administradora")) {
      updates.condominioId = null;
      updates.sindicoId = null;
    }
    // Se é síndico, auto-preenche sindicoId com ele mesmo
    if (novoCliente?.tipo === "sindico") {
      updates.sindicoId = v === "_none" ? null : v;
    }
    // M2: Auto-sugere título baseado no cliente (se o título ainda está vazio)
    if (novoCliente && !form.titulo) {
      updates.titulo = `Proposta de Serviços - ${novoCliente.nome}`;
    }

    setForm(prev => ({ ...prev, ...updates }));
  };

  const handleCondominioChange = (v: string) => {
    const local = locais.find(l => l.id === v);
    const updates: Partial<typeof form> = {
      condominioId: v === "_none" ? null : v,
      sindicoId: clienteTipo !== "sindico" ? null : form.sindicoId,
    };
    if (local?.endereco && !form.endereco_obra) {
      updates.endereco_obra = local.endereco;
    }
    const clienteAtual = clientes.find(c => c.id === form.clienteId);
    if (local && (form.titulo === "" || form.titulo === `Proposta de Serviços - ${clienteAtual?.nome || ''}`)) {
      updates.titulo = `Serviço - ${local.nome}`;
    }
    setForm(prev => ({ ...prev, ...updates }));
  };

  // ─── Itens ────────────────────────────────────────────────────────────────
  const addItemFromCatalogo = (servicoId: string) => {
    const srv = catalogoServicos.find(s => s.id === servicoId);
    if (!srv) return;
    // FIX P0: detectar duplicata antes de adicionar
    const jaExiste = items.some(it => it.servico_id === srv.id);
    if (jaExiste) {
      toast.warning(`"${srv.nome}" já está na lista. Verifique antes de adicionar novamente.`);
    }
    setItems(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        servico_id: srv.id,
        nome: srv.nome,
        unidade: srv.unidade_padrao,
        quantidade: 1,
        valor_unitario: srv.valor_base_sugerido,
        custo_unitario: srv.custo_padrao,
        funcionario_id: srv.prestador_padrao_id,
      },
    ]);
  };

  const addAvulsoItem = () => {
    setItems(prev => [
      ...prev,
      { id: crypto.randomUUID(), servico_id: null, nome: "", unidade: "un", quantidade: 1, valor_unitario: 0, custo_unitario: 0, funcionario_id: null,
        largura_mm: null, altura_mm: null, material: "", acabamento: "", cor: "", observacao: "", icone: "other" },
    ]);
  };

  const updateItem = (index: number, field: keyof OrcamentoItem, value: string | number | null) => {
    setItems(prev => {
      const nw = [...prev];
      nw[index] = { ...nw[index], [field]: value };
      return nw;
    });
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // ─── Totais ───────────────────────────────────────────────────────────────
  const totalItens = items.reduce((acc, it) => acc + ((it.valor_unitario || 0) * (it.quantidade || 1)), 0);
  const totalVenda = totalItens; // alias mantido para compatibilidade interna
  const totalCusto = items.reduce((acc, it) => acc + ((it.custo_unitario || 0) * (it.quantidade || 1)), 0);

  const somaCustosAdicionais =
    form.ca_mao_obra + form.ca_galvanizacao + form.ca_pintura + form.ca_transporte + form.ca_outros;

  // ── Modelo do documento (padrão Vulcano): subtotal itens → desconto% → imposto% ──
  const descontoValor = totalItens * (form.desconto_pct || 0) / 100;
  const baseImposto = totalItens - descontoValor;
  const impostoValor = baseImposto * (form.imposto_pct || 0) / 100;
  const valorCliente = baseImposto + impostoValor;

  // ── Estimativa interna (custos adicionais + margem) — apenas informativa ──
  const subtotal = totalItens + somaCustosAdicionais;
  const valorFinal = form.margem_lucro > 0 && form.margem_lucro < 100
    ? subtotal / (1 - form.margem_lucro / 100)
    : subtotal;

  const lucro = valorCliente - totalCusto - somaCustosAdicionais;
  const margemPercentual = valorCliente > 0 ? (lucro / valorCliente) * 100 : 0;

  // Auto-sync valor (o que o cliente paga) com o total do documento
  useEffect(() => {
    setForm(prev => ({ ...prev, valor: parseFloat(valorCliente.toFixed(2)) }));
  }, [valorCliente]);

  // ─── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.titulo.trim()) {
      toast.error("O título da proposta é obrigatório.");
      setActiveTab("dados");
      return;
    }
    // FIX P0: bloquear orçamento sem itens
    if (items.length === 0) {
      toast.error("Adicione pelo menos um serviço antes de gerar a proposta.");
      setActiveTab("servicos");
      return;
    }
    const itensSemNome = items.filter(it => !it.nome?.trim());
    if (itensSemNome.length > 0) {
      toast.error(`${itensSemNome.length} item(s) sem nome. Preencha antes de salvar.`);
      setActiveTab("servicos");
      return;
    }
    // FIX P0: alertar itens com valor zerado (não bloqueia, mas avisa)
    const itensComValorZero = items.filter(it => !it.valor_unitario || it.valor_unitario === 0);
    if (itensComValorZero.length > 0) {
      toast.warning(
        `${itensComValorZero.length} item(s) com valor R$ 0,00: ${itensComValorZero.map(i => i.nome || "sem nome").join(", ")}. Verifique antes de enviar ao cliente.`,
        { duration: 6000 }
      );
    }
    // FIX bonus: alertar itens com quantidade zero
    const itensQtdZero = items.filter(it => !it.quantidade || it.quantidade === 0);
    if (itensQtdZero.length > 0) {
      toast.warning(`${itensQtdZero.length} item(s) com quantidade zero. Corrija antes de enviar.`, { duration: 5000 });
      setActiveTab("servicos");
      return;
    }
    setIsSaving(true);

    const richCols = await detectRichCols();
    if (!richCols) {
      toast.warning("Campos técnicos/desconto ainda não estão no banco. Rode a migration para salvá-los.", { duration: 6000 });
    }

    const payload = {
      numero: orcamento?.numero || 0,
      titulo: form.titulo,
      descricao: form.descricao,
      status: form.status,
      data_emissao: format(form.data_emissao, "yyyy-MM-dd"),
      validade: form.validade ? format(form.validade, "yyyy-MM-dd") : null,
      valor: form.valor,
      observacoes: form.observacoes,
      condominioId: form.condominioId,
      clienteId: form.clienteId,
      sindicoId: form.sindicoId,
      endereco_obra: form.endereco_obra,
      motivo_recusa: form.motivo_recusa,
      data_aprovacao: form.data_aprovacao ? format(form.data_aprovacao, "yyyy-MM-dd") : null,
      trabalhoId: orcamento?.trabalhoId ?? null,
      condicoes_pagamento: form.condicoes_pagamento,
      prazo_execucao: form.prazo_execucao,
      data_prevista_inicio: form.data_prevista_inicio ? format(form.data_prevista_inicio, "yyyy-MM-dd") : null,
      exclusoes: form.exclusoes,
      responsabilidades: form.responsabilidades,
      ...(richCols ? { desconto_pct: form.desconto_pct, imposto_pct: form.imposto_pct } : {}),
    };

    let savedOrcID = orcamento?.id;

    try {
      if (isEdit && savedOrcID) {
        await updateOrcamento(savedOrcID, payload);
      } else {
        const novoID = await addOrcamento(payload);
        if (novoID) savedOrcID = novoID;
      }

      if (savedOrcID) {
        const { error: delError } = await supabase.from("orcamento_itens").delete().eq("orcamento_id", savedOrcID);
        if (delError) throw new Error("Falha ao limpar itens: " + delError.message);

        if (items.length > 0) {
          // RLS de orcamento_itens exige user_id = auth.uid() — sem isso a
          // inserção é rejeitada e os itens não aparecem no orçamento.
          const { data: authData } = await supabase.auth.getUser();
          const authUserId = authData.user?.id;
          const insertPayload = items.map(it => ({
            orcamento_id: savedOrcID as string,
            user_id: authUserId,
            servico_id: it.servico_id ?? null,
            nome: it.nome,
            unidade: it.unidade,
            quantidade: it.quantidade,
            valor_unitario: it.valor_unitario,
            custo_unitario: it.custo_unitario,
            funcionario_id: it.funcionario_id ?? null,
            // Especificações técnicas (padrão Vulcano) — só quando a migration já rodou
            ...(richCols ? {
              largura_mm: it.largura_mm ?? null,
              altura_mm: it.altura_mm ?? null,
              material: it.material ?? "",
              acabamento: it.acabamento ?? "",
              cor: it.cor ?? "",
              observacao: it.observacao ?? "",
              icone: it.icone ?? "other",
            } : {}),
          }));
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: insError } = await supabase.from("orcamento_itens").insert(insertPayload as any);
          if (insError) throw new Error("Falha ao salvar itens: " + insError.message);
        }
      }
      await refreshAll();
      onClose();
    } catch (e) {
      toast.error("Erro ao salvar o orçamento");
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Navegação entre tabs ─────────────────────────────────────────────────
  const goNext = () => {
    // FIX P1: aviso suave ao sair do Passo 2 sem serviços
    if (activeTab === "servicos" && items.length === 0) {
      toast.warning("Nenhum serviço adicionado. Você pode voltar e adicionar depois.", { duration: 4000 });
    }
    const idx = TAB_ORDER.indexOf(activeTab);
    if (idx < TAB_ORDER.length - 1) setActiveTab(TAB_ORDER[idx + 1]);
  };
  const goPrev = () => {
    const idx = TAB_ORDER.indexOf(activeTab);
    if (idx > 0) setActiveTab(TAB_ORDER[idx - 1]);
  };
  const stepNumber = TAB_ORDER.indexOf(activeTab) + 1;

  const fmt = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        className="max-w-[900px] w-full p-0 gap-0 bg-background shadow-2xl overflow-hidden
          h-dvh sm:h-[90vh] sm:max-h-[90vh] rounded-none sm:rounded-2xl"
      >
        <div className="flex flex-col h-full">

          {/* Header */}
          <DialogHeader className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border bg-muted/20 shrink-0 pr-12 sm:pr-6">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg sm:text-2xl font-bold font-oswald uppercase tracking-tight leading-tight">
                {isEdit ? "Editar Proposta" : "Nova Proposta"}
              </DialogTitle>
              <span className="text-xs font-bold font-oswald text-primary bg-primary/10 px-2 py-1 rounded-full">
                {stepNumber}/5
              </span>
            </div>
          </DialogHeader>

          {/* Indicador de passos clicável */}
          <div className="px-4 sm:px-6 py-3 border-b border-border bg-card shrink-0">
            <div className="flex items-center gap-1.5">
              {TAB_ORDER.map((tab, idx) => {
                const num = idx + 1;
                const isActive = tab === activeTab;
                const isDone = TAB_ORDER.indexOf(activeTab) > idx;
                const labels = ["Dados", "Serviços", "Prazos", "Cláusulas", "Revisão"];
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-bold font-oswald uppercase transition-all shrink-0",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : isDone
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground"
                    )}
                  >
                    <span className={cn(
                      "h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0",
                      isActive ? "bg-white/20" : isDone ? "bg-emerald-500 text-white" : "bg-muted-foreground/20"
                    )}>
                      {isDone ? "✓" : num}
                    </span>
                    <span className="hidden sm:inline">{labels[idx]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)} className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-card">

              {/* ── PASSO 1: Identidade e Local ── */}
              <TabsContent value="dados" className="m-0 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="pb-4 border-b border-border/50">
                  <h2 className="text-xl font-bold font-oswald uppercase text-primary flex items-center gap-2">
                    <User className="h-5 w-5" /> 1. O Início: Identidade e Local
                  </h2>
                  <p className="text-sm text-muted-foreground font-barlow italic">Quem vai contratar e onde a obra vai acontecer?</p>
                </div>

                {/* Bloco de vínculos — Cliente primeiro */}
                <div className="bg-muted/30 p-5 rounded-xl border border-border space-y-4">
                  <h3 className="font-oswald uppercase text-xs font-bold text-muted-foreground tracking-widest border-b border-border/50 pb-2">
                    Quem Contrata?
                  </h3>

                  {/* 1. Cliente (sempre primeiro) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-barlow font-bold">Cliente Contratante</Label>
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 bg-primary/10 hover:bg-primary/20" onClick={() => setNewClientModalOpen(true)} title="Novo Cliente">
                        <UserPlus className="h-4 w-4 text-primary" />
                      </Button>
                    </div>
                    <Select value={form.clienteId ?? "_none"} onValueChange={handleClienteChange}>
                      <SelectTrigger className="h-12"><SelectValue placeholder="Selecionar Cliente..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none">Nenhum</SelectItem>
                        {clientes.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.nome}
                            <span className="ml-2 text-[10px] text-muted-foreground uppercase">({c.tipo})</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 2. Local — apenas se síndico ou administradora */}
                  {precisaCondominio && (
                    <div className="space-y-1.5 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-barlow font-bold flex items-center gap-1.5">
                          <Building2 className="h-3 w-3 text-primary" />
                          Local
                        </Label>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 bg-primary/10 hover:bg-primary/20" onClick={() => setNewCondominioModalOpen(true)} title="Novo Local">
                          <Plus className="h-4 w-4 text-primary" />
                        </Button>
                      </div>
                      <Select value={form.condominioId ?? "_none"} onValueChange={handleCondominioChange}>
                        <SelectTrigger className="h-12"><SelectValue placeholder="Selecionar Local..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_none">Nenhum</SelectItem>
                          {locais.map((l) => <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* 3. Síndico — apenas se administradora com condomínio selecionado */}
                  {clienteTipo === "administradora" && form.condominioId && (
                    <div className="space-y-1.5 animate-in fade-in duration-200">
                      <Label className="text-xs font-barlow font-bold">Síndico Responsável</Label>
                      <Select value={form.sindicoId ?? "_none"} onValueChange={(v) => setForm(prev => ({ ...prev, sindicoId: v === "_none" ? null : v }))}>
                        <SelectTrigger className="h-12"><SelectValue placeholder="Selecionar Síndico..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_none">Nenhum</SelectItem>
                          {clientes.filter(c => c.tipo === "sindico").map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Tag informativa quando síndico é auto-preenchido */}
                  {clienteTipo === "sindico" && form.clienteId && (
                    <p className="text-[10px] text-emerald-600 font-barlow font-bold flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Síndico definido automaticamente como contato selecionado.
                    </p>
                  )}
                </div>

                {/* Título + Endereço */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="uppercase text-[10px] font-bold tracking-widest text-muted-foreground flex items-center gap-1.5">
                      Título Comercial *
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild><HelpCircle className="h-3 w-3 cursor-help text-muted-foreground/50" /></TooltipTrigger>
                          <TooltipContent className="text-xs">Ex: Reforma de Sacada – Apto 202</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <Input
                      value={form.titulo}
                      onChange={(e) => setForm(prev => ({ ...prev, titulo: e.target.value }))}
                      placeholder="Ex: Reforma Cobertura Palmas"
                      className="font-oswald text-lg h-12"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="uppercase text-[10px] font-bold tracking-widest text-muted-foreground">
                      Endereço da Obra
                      {form.condominioId && <span className="ml-1 text-emerald-600 normal-case font-normal">(preenchido do condomínio)</span>}
                    </Label>
                    <Input
                      value={form.endereco_obra}
                      onChange={(e) => setForm(prev => ({ ...prev, endereco_obra: e.target.value }))}
                      placeholder="Endereço exato da obra..."
                      className="font-barlow h-12"
                    />
                  </div>
                </div>

                {/* Descrição */}
                <div className="space-y-1.5">
                  <Label className="uppercase text-[10px] font-bold tracking-widest text-muted-foreground">Apresentação / Descrição Inicial do Projeto</Label>
                  <Textarea
                    value={form.descricao}
                    onChange={(e) => setForm(prev => ({ ...prev, descricao: e.target.value }))}
                    placeholder="Texto introdutório que o cliente vai ler antes da tabela de serviços..."
                    rows={4}
                    className="font-barlow"
                  />
                </div>
              </TabsContent>

              {/* ── PASSO 2: Serviços ── */}
              <TabsContent value="servicos" className="m-0 flex flex-col space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="pb-4 border-b border-border/50">
                  <h2 className="text-xl font-bold font-oswald uppercase text-primary flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" /> 2. O Projeto: O que faremos?
                  </h2>
                  <p className="text-sm text-muted-foreground font-barlow italic">
                    Monte a lista de serviços. O custo interno é só seu — o cliente vê apenas o preço final.
                  </p>
                </div>

                {/* Barra de adicionar */}
                <div className="flex gap-2">
                  {/* Busca no catálogo */}
                  <Popover open={catalogoAberto} onOpenChange={(v) => { setCatalogoAberto(v); if (!v) setCatalogoSearch(""); }}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="default"
                        className="flex-1 justify-start gap-2 font-oswald uppercase font-bold text-sm h-12 bg-primary text-primary-foreground"
                      >
                        <Search className="h-4 w-4" />
                        {catalogoServicos.length > 0
                          ? `Catálogo (${catalogoServicos.length})`
                          : "Catálogo vazio"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[420px] p-0" align="start" side="bottom">
                      <Command>
                        <CommandInput
                          placeholder="Buscar serviço por nome ou categoria..."
                          className="font-barlow"
                          value={catalogoSearch}
                          onValueChange={setCatalogoSearch}
                        />
                        <CommandList className="max-h-64 overflow-y-auto">
                          <CommandEmpty className="py-6 text-center text-sm text-muted-foreground font-barlow">
                            Nenhum serviço encontrado.
                          </CommandEmpty>
                          {/* Agrupamento por Categorias */}
                          {Object.entries(
                            catalogoServicos.reduce((acc, s) => {
                              const cat = s.categoria || "Geral";
                              if (!acc[cat]) acc[cat] = [];
                              acc[cat].push(s);
                              return acc;
                            }, {} as Record<string, typeof catalogoServicos>)
                          ).map(([cat, items]) => (
                            <CommandGroup key={cat} heading={cat.toUpperCase()} className="font-oswald text-[10px] tracking-widest text-primary">
                              {items.map(s => (
                                <CommandItem
                                  key={s.id}
                                  value={`${cat} ${s.nome} ${s.subcategoria || ""}`}
                                  onSelect={() => {
                                    addItemFromCatalogo(s.id);
                                    setCatalogoAberto(false);
                                    setCatalogoSearch("");
                                  }}
                                  className="flex items-center justify-between cursor-pointer font-barlow py-2"
                                >
                                  <div className="flex flex-col">
                                    <span className="font-medium text-foreground">{s.nome}</span>
                                    {s.subcategoria && <span className="text-[9px] uppercase text-muted-foreground">{s.subcategoria}</span>}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-muted rounded">
                                      {s.unidade_padrao}
                                    </span>
                                    {s.valor_base_sugerido > 0 && (
                                      <span className="text-[10px] text-emerald-600 font-bold">
                                        {fmt(s.valor_base_sugerido)}
                                      </span>
                                    )}
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          ))}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={addAvulsoItem}
                    className="h-12 font-oswald uppercase font-bold text-xs gap-1.5 shrink-0 px-3"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Item Avulso</span>
                  </Button>
                </div>

                {/* Lista de itens como cards */}
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground border-2 border-dashed border-border rounded-2xl">
                    <PackageOpen className="h-10 w-10 opacity-20" />
                    <p className="text-sm font-barlow italic">Nenhum serviço adicionado ainda.</p>
                    <p className="text-xs font-barlow text-muted-foreground/60">Use o catálogo ou adicione um item avulso acima.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.map((it, idx) => {
                      const venda = it.valor_unitario || 0;
                      const custo = it.custo_unitario || 0;
                      const qtd = it.quantidade || 1;
                      const totalItem = venda * qtd;
                      const margemItem = venda > 0 ? ((venda - custo) / venda) * 100 : 0;
                      const margemCor = margemItem > 35
                        ? "text-emerald-600"
                        : margemItem > 20
                          ? "text-orange-500"
                          : "text-destructive";
                      const barCor = margemItem > 35
                        ? "bg-emerald-500"
                        : margemItem > 20
                          ? "bg-orange-400"
                          : "bg-destructive";

                      return (
                        <div key={it.id || idx} className="border border-border rounded-xl bg-card overflow-hidden">
                          {/* Cabeçalho do card */}
                          <div className="flex items-center gap-2 px-3 sm:px-4 pt-3 pb-2">
                            <span className="text-[10px] font-bold text-muted-foreground font-oswald w-5 shrink-0">#{idx + 1}</span>
                            <Input
                              value={it.nome || ""}
                              onChange={(e) => updateItem(idx, "nome", e.target.value)}
                              placeholder="Nome do serviço..."
                              className="flex-1 font-oswald font-bold uppercase text-sm h-10 border-0 border-b border-border/50 rounded-none px-0 focus-visible:ring-0 bg-transparent"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => removeItem(idx)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Corpo do card */}
                          <div className="px-3 sm:px-4 pb-3 space-y-3">
                            {/* Linha mobile: Qtd + Unidade + Total numa linha só */}
                            <div className="flex items-end gap-2">
                              <div className="space-y-1">
                                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground font-barlow">Qtd</p>
                                <Input
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  value={it.quantidade ?? 1}
                                  onChange={(e) => updateItem(idx, "quantidade", Number(e.target.value))}
                                  className="h-11 w-20 text-center font-barlow text-base"
                                />
                              </div>
                              <div className="space-y-1">
                                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground font-barlow">UN</p>
                                <Select
                                  value={it.unidade || "un"}
                                  onValueChange={(v) => updateItem(idx, "unidade", v)}
                                >
                                  <SelectTrigger className="h-11 w-24 text-xs font-barlow">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {UNIDADES_COMUNS.map(u => (
                                      <SelectItem key={u.value} value={u.value} className="text-xs font-barlow">
                                        {u.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              {/* Total do item em destaque */}
                              <div className="ml-auto text-right space-y-0.5">
                                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground font-barlow">Total</p>
                                <p className="font-oswald font-bold text-xl text-foreground">{fmt(totalItem)}</p>
                              </div>
                            </div>

                            {/* Preço de venda em destaque — campo principal mobile */}
                            <div className="space-y-1">
                              <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-700 font-barlow">Preço Unitário (cliente)</p>
                              <CurrencyInput
                                value={it.valor_unitario || 0}
                                onChange={(v) => updateItem(idx, "valor_unitario", v)}
                                className="h-12 text-right font-bold text-emerald-700 bg-emerald-500/5 border-emerald-500/30 text-base"
                              />
                            </div>

                            {/* Custo interno — colapsável no mobile */}
                            <details className="group">
                              <summary className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-barlow cursor-pointer list-none py-1 select-none">
                                <ChevronRight className="h-3 w-3 group-open:rotate-90 transition-transform" />
                                Custo interno e margem
                                {/* FIX P0: só mostra % se custo foi preenchido. custo=0 era enganosamente verde */}
                                {custo > 0 ? (
                                  <span className={cn("ml-auto font-bold font-oswald text-[11px]", margemCor)}>
                                    {margemItem.toFixed(0)}% margem
                                  </span>
                                ) : (
                                  <span className="ml-auto text-[10px] text-orange-500 font-barlow italic">custo não informado</span>
                                )}
                              </summary>
                              <div className="pt-2 space-y-2">
                                <div className="space-y-1">
                                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 font-barlow">Custo Unitário (interno)</p>
                                  <CurrencyInput
                                    value={it.custo_unitario || 0}
                                    onChange={(v) => updateItem(idx, "custo_unitario", v)}
                                    className="h-11 text-right text-destructive/70 bg-destructive/5 border-destructive/20"
                                  />
                                </div>
                                {/* FIX P0: barra só renderiza quando custo real existe */}
                                {custo > 0 ? (
                                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                    <Progress
                                      value={Math.min(Math.max(margemItem, 0), 100)}
                                      className={cn("h-1.5", barCor)}
                                    />
                                  </div>
                                ) : (
                                  <p className="text-[10px] text-orange-500 font-barlow italic">
                                    Preencha o custo para calcular a margem real deste item.
                                  </p>
                                )}
                              </div>
                            </details>

                            {/* Especificações técnicas (aparecem no orçamento Vulcano) */}
                            <details className="group">
                              <summary className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-barlow cursor-pointer list-none py-1 select-none">
                                <ChevronRight className="h-3 w-3 group-open:rotate-90 transition-transform" />
                                Especificações técnicas (orçamento)
                              </summary>
                              <div className="pt-2 grid grid-cols-2 gap-2">
                                <div className="col-span-2 space-y-1">
                                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 font-barlow">Esquema / Tipo</p>
                                  <select
                                    value={it.icone || "other"}
                                    onChange={(e) => updateItem(idx, "icone", e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-2 text-xs font-barlow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                  >
                                    {ICONES_ITEM.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                  </select>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 font-barlow">Largura (mm)</p>
                                  <Input type="number" min={0} value={it.largura_mm ?? ""} placeholder="ex: 4620"
                                    onChange={(e) => updateItem(idx, "largura_mm", e.target.value === "" ? null : Number(e.target.value))}
                                    className="h-10 font-barlow" />
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 font-barlow">Altura (mm)</p>
                                  <Input type="number" min={0} value={it.altura_mm ?? ""} placeholder="ex: 2460"
                                    onChange={(e) => updateItem(idx, "altura_mm", e.target.value === "" ? null : Number(e.target.value))}
                                    className="h-10 font-barlow" />
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 font-barlow">Material</p>
                                  <select
                                    value={it.material || ""}
                                    onChange={(e) => updateItem(idx, "material", e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-2 text-xs font-barlow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                  >
                                    <option value="">— Selecione —</option>
                                    {MATERIAIS.map(m => <option key={m} value={m}>{m}</option>)}
                                  </select>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 font-barlow">Acabamento</p>
                                  <select
                                    value={it.acabamento || ""}
                                    onChange={(e) => updateItem(idx, "acabamento", e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-2 text-xs font-barlow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                  >
                                    <option value="">— Selecione —</option>
                                    {ACABAMENTOS.map(a => <option key={a} value={a}>{a}</option>)}
                                  </select>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 font-barlow">Cor</p>
                                  <Input value={it.cor || ""} placeholder="Ex: Preto Fosco / RAL 9005"
                                    onChange={(e) => updateItem(idx, "cor", e.target.value)}
                                    className="h-10 font-barlow" />
                                </div>
                                <div className="col-span-2 space-y-1">
                                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 font-barlow">Observação do item</p>
                                  <Input value={it.observacao || ""} placeholder="Ex: Inclui instalação, dobradiças e cadeado"
                                    onChange={(e) => updateItem(idx, "observacao", e.target.value)}
                                    className="h-10 font-barlow" />
                                </div>
                              </div>
                            </details>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Custos Adicionais */}
                <div className="rounded-xl border border-border bg-muted/20 overflow-hidden">
                  <div className="px-4 py-3 bg-muted/40 border-b border-border">
                    <p className="text-[10px] font-bold font-oswald uppercase tracking-widest text-muted-foreground">Custos Adicionais</p>
                    <p className="text-[10px] text-muted-foreground font-barlow">Mão de obra, galvanização, pintura e outros custos de produção.</p>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      {([
                        { key: "ca_mao_obra",     label: "Mão de Obra (R$)" },
                        { key: "ca_galvanizacao",  label: "Galvanização (R$)" },
                        { key: "ca_pintura",       label: "Pintura / Jateamento (R$)" },
                        { key: "ca_transporte",    label: "Transporte / Instalação (R$)" },
                        { key: "ca_outros",        label: "Outros (R$)" },
                      ] as const).map(({ key, label }) => (
                        <div key={key} className="space-y-1">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground font-barlow">{label}</p>
                          <CurrencyInput
                            value={form[key]}
                            onChange={(v) => setForm(prev => ({ ...prev, [key]: v }))}
                            className="h-10"
                          />
                        </div>
                      ))}
                      <div className="space-y-1">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground font-barlow">Margem de Lucro (%)</p>
                        <input
                          type="number" min={0} max={99} step={1}
                          value={form.margem_lucro}
                          onChange={(e) => setForm(prev => ({ ...prev, margem_lucro: Number(e.target.value) }))}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-oswald font-bold text-center ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </div>
                    </div>
                    {somaCustosAdicionais > 0 || form.margem_lucro > 0 ? (
                      <div className="mt-2 bg-card rounded-lg border border-border p-3 space-y-1.5 text-xs font-barlow">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Itens</span><span className="font-bold">{fmt(totalItens)}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Custos adicionais</span><span className="font-bold">{fmt(somaCustosAdicionais)}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Subtotal</span><span className="font-bold">{fmt(subtotal)}</span>
                        </div>
                        {form.margem_lucro > 0 && (
                          <div className="flex justify-between text-primary font-bold border-t border-border pt-1.5">
                            <span>Valor Final (c/ {form.margem_lucro}% margem)</span>
                            <span>{fmt(valorFinal)}</span>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Desconto e Impostos (aparecem no documento do cliente) */}
                <div className="rounded-xl border border-border bg-muted/20 overflow-hidden">
                  <div className="px-4 py-3 bg-muted/40 border-b border-border">
                    <p className="text-[10px] font-bold font-oswald uppercase tracking-widest text-muted-foreground">Desconto e Impostos</p>
                    <p className="text-[10px] text-muted-foreground font-barlow">Aplicados sobre o subtotal dos itens — aparecem no orçamento do cliente.</p>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground font-barlow">Desconto (%)</p>
                        <input
                          type="number" min={0} max={100} step={0.5}
                          value={form.desconto_pct}
                          onChange={(e) => setForm(prev => ({ ...prev, desconto_pct: Number(e.target.value) }))}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-oswald font-bold text-center ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground font-barlow">Impostos / Taxas (%)</p>
                        <input
                          type="number" min={0} max={100} step={0.5}
                          value={form.imposto_pct}
                          onChange={(e) => setForm(prev => ({ ...prev, imposto_pct: Number(e.target.value) }))}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-oswald font-bold text-center ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </div>
                    </div>
                    {items.length > 0 && (
                      <div className="mt-2 bg-card rounded-lg border border-border p-3 space-y-1.5 text-xs font-barlow">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Subtotal</span><span className="font-bold">{fmt(totalItens)}</span>
                        </div>
                        {form.desconto_pct > 0 && (
                          <div className="flex justify-between text-emerald-600">
                            <span>Desconto ({form.desconto_pct}%)</span><span className="font-bold">- {fmt(descontoValor)}</span>
                          </div>
                        )}
                        {form.imposto_pct > 0 && (
                          <div className="flex justify-between text-muted-foreground">
                            <span>Impostos / Taxas ({form.imposto_pct}%)</span><span className="font-bold">{fmt(impostoValor)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-primary font-bold border-t border-border pt-1.5 text-sm">
                          <span>Total do orçamento</span><span>{fmt(valorCliente)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Totais consolidados */}
                {items.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 px-4 py-4 bg-muted/20 rounded-2xl border border-border/50 mt-2">
                    <div className="space-y-0.5 text-center">
                      <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-bold font-barlow">Custo Total</p>
                      <p className="font-oswald text-lg font-bold text-destructive/70">{fmt(totalCusto)}</p>
                    </div>
                    <div className="space-y-0.5 text-center border-x border-border/50">
                      <p className="text-[9px] uppercase tracking-[0.2em] text-emerald-700 font-bold font-barlow">Total Cliente</p>
                      <p className="font-oswald text-lg font-bold text-emerald-600">{fmt(valorCliente)}</p>
                    </div>
                    <div className="space-y-0.5 text-center">
                      <p className="text-[9px] uppercase tracking-[0.2em] text-primary font-bold font-barlow">
                        Lucro · <span className={cn(margemPercentual > 35 ? "text-emerald-600" : margemPercentual > 20 ? "text-orange-500" : "text-destructive")}>
                          {margemPercentual.toFixed(0)}%
                        </span>
                      </p>
                      <p className="font-oswald text-lg font-bold text-primary">{fmt(lucro)}</p>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* ── PASSO 3: Prazos e Pagamento ── */}
              <TabsContent value="prazos" className="m-0 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="pb-4 border-b border-border/50">
                  <h2 className="text-xl font-bold font-oswald uppercase text-primary flex items-center gap-2">
                    <ArrowRight className="h-5 w-5" /> 3. O Acordo: Como e Quando?
                  </h2>
                  <p className="text-sm text-muted-foreground font-barlow italic">Defina as datas e a forma de pagamento. Clareza aqui evita problemas no futuro.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Emissão */}
                  <div className="space-y-1.5">
                    <Label className="uppercase text-[10px] font-bold tracking-widest text-muted-foreground flex items-center gap-1.5">
                      <CalendarIcon className="h-3 w-3" /> Emissão
                    </Label>
                    <input
                      type="date"
                      aria-label="Data de emissão"
                      value={format(form.data_emissao, "yyyy-MM-dd")}
                      onChange={(e) => e.target.value && setForm(prev => ({ ...prev, data_emissao: new Date(e.target.value + "T12:00:00") }))}
                      className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-barlow ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>

                  {/* Validade */}
                  <div className="space-y-1.5">
                    <Label className="uppercase text-[10px] font-bold tracking-widest text-muted-foreground flex items-center gap-1.5">
                      <CalendarIcon className="h-3 w-3" /> Válida Até
                    </Label>
                    <input
                      type="date"
                      aria-label="Data de validade"
                      value={form.validade ? format(form.validade, "yyyy-MM-dd") : ""}
                      onChange={(e) => setForm(prev => ({ ...prev, validade: e.target.value ? new Date(e.target.value + "T12:00:00") : null }))}
                      className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-barlow ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    {/* Atalhos rápidos */}
                    <div className="grid grid-cols-3 gap-2">
                      {[7, 15, 30].map(dias => (
                        <Button key={dias} type="button" variant="outline"
                          className="h-10 flex-1 text-xs font-bold font-oswald"
                          onClick={() => setForm(prev => ({ ...prev, validade: addDays(new Date(), dias) }))}>
                          +{dias}d
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Previsão de início */}
                  <div className="space-y-1.5">
                    <Label className="uppercase text-[10px] font-bold tracking-widest text-muted-foreground flex items-center gap-1.5">
                      <CalendarIcon className="h-3 w-3" /> Início Previsto
                    </Label>
                    <input
                      type="date"
                      aria-label="Previsão de início da obra"
                      value={form.data_prevista_inicio ? format(form.data_prevista_inicio, "yyyy-MM-dd") : ""}
                      onChange={(e) => setForm(prev => ({ ...prev, data_prevista_inicio: e.target.value ? new Date(e.target.value + "T12:00:00") : null }))}
                      className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-barlow ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                </div>

                {/* Condições — Textarea com pills rápidas */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="space-y-2">
                    <Label className="uppercase text-[10px] font-bold tracking-widest text-muted-foreground">Condições de Pagamento</Label>
                    {/* Pills de atalho — toque único no celular */}
                    <div className="flex flex-wrap gap-2">
                      {[
                        "50% na aprovação + 50% na conclusão.",
                        "100% na conclusão.",
                        "30% entrada + 70% na conclusão.",
                        "À vista na conclusão.",
                        "3x iguais mensais.",
                      ].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, condicoes_pagamento: opt }))}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-barlow border transition-all",
                            form.condicoes_pagamento === opt
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-muted border-border text-muted-foreground hover:bg-muted/80"
                          )}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    <Textarea
                      value={form.condicoes_pagamento}
                      onChange={(e) => setForm(prev => ({ ...prev, condicoes_pagamento: e.target.value }))}
                      placeholder="Ou digite livremente..."
                      rows={2}
                      className="font-barlow"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="uppercase text-[10px] font-bold tracking-widest text-muted-foreground">Prazo de Execução</Label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "Aprox. 7 dias úteis.",
                        "Aprox. 15 dias úteis.",
                        "Aprox. 30 dias úteis.",
                        "A combinar após aprovação.",
                      ].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, prazo_execucao: opt }))}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-barlow border transition-all",
                            form.prazo_execucao === opt
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-muted border-border text-muted-foreground hover:bg-muted/80"
                          )}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    <Textarea
                      value={form.prazo_execucao}
                      onChange={(e) => setForm(prev => ({ ...prev, prazo_execucao: e.target.value }))}
                      placeholder="Ou digite livremente..."
                      rows={2}
                      className="font-barlow"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* ── PASSO 4: Cláusulas ── */}
              <TabsContent value="clausulas" className="m-0 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="pb-4 border-b border-border/50">
                  <h2 className="text-xl font-bold font-oswald uppercase text-primary flex items-center gap-2">
                    <Tag className="h-5 w-5" /> 4. A Segurança: Blindagem Vulcano
                  </h2>
                  <p className="text-sm text-muted-foreground font-barlow italic">O que NÃO está incluso e quais as responsabilidades do cliente.</p>
                </div>

                <div className="space-y-3">
                  <details open className="group rounded-xl border border-border/60 overflow-hidden">
                    <summary className="flex items-center justify-between px-4 py-3 cursor-pointer select-none bg-muted/30 hover:bg-muted/50 transition-colors list-none">
                      <span className="uppercase text-[10px] font-bold tracking-widest text-muted-foreground flex items-center gap-1.5">
                        O que NÃO está incluso (Exclusões)
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild><Info className="h-3 w-3 cursor-help text-muted-foreground/50" /></TooltipTrigger>
                            <TooltipContent className="text-xs">Crucial para evitar que o cliente cobre coisas que não foram combinadas.</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </span>
                      <span className="text-[10px] text-muted-foreground font-barlow group-open:hidden">toque para expandir ▾</span>
                      <span className="text-[10px] text-muted-foreground font-barlow hidden group-open:inline">▴</span>
                    </summary>
                    <div className="px-4 py-3 space-y-2">
                      <Textarea
                        value={form.exclusoes}
                        onChange={(e) => setForm(prev => ({ ...prev, exclusoes: e.target.value }))}
                        placeholder="Liste o que o orçamento NÃO cobre (ex: fornecimento de porcelanato, caçamba de entulho...)."
                        rows={3}
                        className="font-barlow"
                      />
                      <p className="text-[10px] text-muted-foreground">Protege a Vulcano contra expectativas irreais do cliente.</p>
                    </div>
                  </details>

                  <details className="group rounded-xl border border-border/60 overflow-hidden">
                    <summary className="flex items-center justify-between px-4 py-3 cursor-pointer select-none bg-muted/30 hover:bg-muted/50 transition-colors list-none">
                      <span className="uppercase text-[10px] font-bold tracking-widest text-muted-foreground">Responsabilidade do Contratante</span>
                      <span className="text-[10px] text-muted-foreground font-barlow group-open:hidden">toque para expandir ▾</span>
                      <span className="text-[10px] text-muted-foreground font-barlow hidden group-open:inline">▴</span>
                    </summary>
                    <div className="px-4 py-3">
                      <Textarea
                        value={form.responsabilidades}
                        onChange={(e) => setForm(prev => ({ ...prev, responsabilidades: e.target.value }))}
                        placeholder="O que o cliente precisa fazer (ex: retirar itens pessoais do local, fornecer material básico, etc)."
                        rows={3}
                        className="font-barlow"
                      />
                    </div>
                  </details>

                  <details className="group rounded-xl border border-orange-200 dark:border-orange-900/40 overflow-hidden">
                    <summary className="flex items-center justify-between px-4 py-3 cursor-pointer select-none bg-orange-50 dark:bg-orange-950/20 hover:bg-orange-100/60 dark:hover:bg-orange-950/30 transition-colors list-none">
                      <span className="uppercase text-[10px] font-bold tracking-widest text-orange-700 dark:text-orange-400">Notas Internas (Apenas para nós)</span>
                      <span className="text-[10px] text-orange-500 font-barlow group-open:hidden">toque para expandir ▾</span>
                      <span className="text-[10px] text-orange-500 font-barlow hidden group-open:inline">▴</span>
                    </summary>
                    <div className="px-4 py-3">
                      <Textarea
                        value={form.observacoes}
                        onChange={(e) => setForm(prev => ({ ...prev, observacoes: e.target.value }))}
                        placeholder="Comentários internos confidenciais... (não aparece no PDF do cliente)"
                        rows={3}
                        className="font-barlow bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-900/40"
                      />
                    </div>
                  </details>
                </div>
              </TabsContent>

              {/* ── PASSO 5: Revisão Final ── */}
              <TabsContent value="revisao" className="m-0 space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="pb-4 border-b border-border/50">
                  <h2 className="text-xl font-bold font-oswald uppercase text-primary flex items-center gap-2">
                    <Save className="h-5 w-5" /> 5. Revisão Final: Tudo Certo?
                  </h2>
                  <p className="text-sm text-muted-foreground font-barlow italic">Confira e ajuste qualquer detalhe antes de gerar a proposta.</p>
                </div>

                {/* Bloco 1: Identidade */}
                <ReviewBlock title="1. Identidade e Local" onEdit={() => setActiveTab("dados")} icon={<User className="h-3 w-3" />}>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    <ReviewRow label="Título" value={form.titulo || "—"} highlight />
                    <ReviewRow label="Endereço da Obra" value={form.endereco_obra || "—"} />
                    {form.clienteId && <ReviewRow label="Cliente" value={clientes.find(c => c.id === form.clienteId)?.nome ?? "—"} />}
                    {form.condominioId && <ReviewRow label="Local" value={locais.find(l => l.id === form.condominioId)?.nome ?? "—"} />}
                    {form.descricao && <ReviewRow label="Descrição" value={form.descricao} wrap className="col-span-2" />}
                  </div>
                </ReviewBlock>

                {/* Bloco 2: Serviços */}
                <ReviewBlock title={`2. Serviços (${items.length} ${items.length === 1 ? "item" : "itens"})`} onEdit={() => setActiveTab("servicos")} icon={<CheckCircle2 className="h-3 w-3" />}>
                  {items.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic font-barlow">Nenhum serviço adicionado.</p>
                  ) : (
                    <div className="space-y-1">
                      {items.map((it, i) => (
                        <div key={it.id || i} className="flex items-center justify-between text-xs font-barlow py-0.5">
                          <span className="font-medium truncate max-w-[60%]">{it.nome || "—"}</span>
                          <span className="text-muted-foreground shrink-0">
                            {it.quantidade} {it.unidade} · <span className="font-bold text-foreground">{fmt((it.valor_unitario || 0) * (it.quantidade || 1))}</span>
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center pt-2 border-t border-border/50 mt-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-barlow">Total</span>
                        <span className="font-oswald font-bold text-base text-primary">{fmt(totalVenda)}</span>
                      </div>
                    </div>
                  )}
                </ReviewBlock>

                {/* Bloco 3: Prazos */}
                <ReviewBlock title="3. Prazos e Pagamento" onEdit={() => setActiveTab("prazos")} icon={<ArrowRight className="h-3 w-3" />}>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    <ReviewRow label="Emissão" value={format(form.data_emissao, "dd/MM/yyyy", { locale: ptBR })} />
                    <ReviewRow label="Validade" value={form.validade ? format(form.validade, "dd/MM/yyyy", { locale: ptBR }) : "—"} />
                    <ReviewRow label="Previsão de Início" value={form.data_prevista_inicio ? format(form.data_prevista_inicio, "dd/MM/yyyy", { locale: ptBR }) : "—"} />
                    <ReviewRow label="Pagamento" value={form.condicoes_pagamento || "—"} wrap />
                    <ReviewRow label="Prazo de Execução" value={form.prazo_execucao || "—"} wrap />
                  </div>
                </ReviewBlock>

                {/* Bloco 4: Blindagem */}
                <ReviewBlock title="4. Blindagem" onEdit={() => setActiveTab("clausulas")} icon={<Tag className="h-3 w-3" />}>
                  <div className="space-y-2">
                    <ReviewRow label="Exclusões" value={form.exclusoes || "—"} wrap />
                    <ReviewRow label="Responsabilidades" value={form.responsabilidades || "—"} wrap />
                    {form.observacoes && <ReviewRow label="Notas Internas" value={form.observacoes} wrap />}
                  </div>
                </ReviewBlock>

                {/* Status — movido para revisão */}
                <div className="bg-muted/30 rounded-xl border border-border p-4">
                  <Label className="uppercase text-[10px] font-bold tracking-widest text-muted-foreground block mb-2">Status da Proposta</Label>
                  <Select value={form.status} onValueChange={(v) => setForm(prev => ({ ...prev, status: v as StatusOrcamento }))}>
                    <SelectTrigger className="font-oswald uppercase"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((s) => (
                        <SelectItem key={s.value} value={s.value} className="font-oswald uppercase">{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Saúde do preço */}
                {items.length > 0 && (
                  <div className={cn(
                    "flex items-center justify-between px-4 py-3 rounded-xl border font-barlow",
                    margemPercentual > 35 ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20" :
                    margemPercentual > 20 ? "bg-orange-50 border-orange-200 dark:bg-orange-950/20" :
                    "bg-destructive/5 border-destructive/20"
                  )}>
                    <span className="text-xs font-bold uppercase tracking-wide">Saúde do Preço</span>
                    <span className={cn("font-oswald font-bold text-lg",
                      margemPercentual > 35 ? "text-emerald-600" :
                      margemPercentual > 20 ? "text-orange-500" : "text-destructive"
                    )}>
                      Margem {margemPercentual.toFixed(0)}% · {fmt(lucro)} de lucro
                    </span>
                  </div>
                )}

                {/* Detalhes Operacionais (Resumo) */}
                {items.length > 0 && (
                  <div className="mt-4 bg-muted/30 rounded-xl p-5 border border-border space-y-4">
                    <h3 className="font-oswald uppercase text-[10px] font-bold text-muted-foreground tracking-widest border-b border-border/50 pb-2 flex items-center gap-2">
                      <Users className="h-3 w-3" /> Planejamento Operacional Sugerido
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground font-barlow">Equipes Necessárias</p>
                        <div className="flex flex-wrap gap-1.5">
                          {Array.from(new Set(items.map(it => {
                            const s = catalogoServicos.find(cs => cs.id === it.servico_id);
                            return s?.equipe_necessaria;
                          }).filter(Boolean))).length > 0 ? (
                            Array.from(new Set(items.map(it => {
                              const s = catalogoServicos.find(cs => cs.id === it.servico_id);
                              return s?.equipe_necessaria;
                            }).filter(Boolean))).map((eq, i) => (
                              <Badge key={i} variant="secondary" className="font-barlow text-[10px] py-0.5 px-2 bg-card border-border italic">
                                {eq}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-[10px] text-muted-foreground italic font-barlow">A definir pelo Mestre Carlos</span>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground font-barlow">Tempos Estimados</p>
                        <div className="space-y-1">
                          {items.filter(it => {
                            const s = catalogoServicos.find(cs => cs.id === it.servico_id);
                            return !!s?.tempo_medio;
                          }).length > 0 ? (
                            items.map((it, i) => {
                              const s = catalogoServicos.find(cs => cs.id === it.servico_id);
                              if (!s?.tempo_medio) return null;
                              return (
                                <div key={i} className="flex justify-between items-center text-[10px] font-barlow border-b border-border/10 pb-1">
                                  <span className="text-muted-foreground truncate max-w-[140px]">{it.nome}</span>
                                  <span className="font-bold text-foreground bg-primary/5 px-1.5 rounded">{s.tempo_medio}</span>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-[10px] text-muted-foreground italic font-barlow">Cálculo manual no cronograma.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

            </div>

            {/* Rodapé de navegação */}
            <div className="px-4 sm:px-6 py-4 border-t border-border bg-background sm:bg-muted/20 shrink-0 flex items-center justify-between gap-3 sticky bottom-0 z-10">
              <div className="shrink-0">
                {activeTab !== "dados" ? (
                  <Button type="button" variant="outline" className="font-oswald font-bold uppercase tracking-widest h-12 px-4 sm:px-6 shadow-sm flex items-center gap-2" onClick={goPrev}>
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Anterior</span>
                  </Button>
                ) : (
                  <Button type="button" variant="ghost" className="h-12 px-4 font-barlow" onClick={onClose} disabled={isSaving}>
                    Cancelar
                  </Button>
                )}
              </div>

              {/* Indicador central no mobile */}
              <div className="flex-1 flex justify-center sm:hidden">
                <div className="flex gap-1.5">
                  {TAB_ORDER.map((tab) => (
                    <div
                      key={tab}
                      className={cn(
                        "h-1.5 rounded-full transition-all",
                        tab === activeTab ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/30"
                      )}
                    />
                  ))}
                </div>
              </div>

              <div className="shrink-0">
                {activeTab !== "revisao" ? (
                  <Button type="button" variant="default" className="font-oswald font-bold uppercase tracking-widest h-12 px-4 sm:px-6 shadow-md flex items-center gap-2 bg-primary text-primary-foreground hover:opacity-90" onClick={goNext}>
                    <span className="hidden sm:inline">Próxima</span>
                    <span className="sm:hidden">Avançar</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="button" onClick={handleSubmit} disabled={isSaving} className="font-oswald font-bold uppercase tracking-widest h-12 px-4 sm:px-6 bg-emerald-600 text-white hover:bg-emerald-700 shadow-md flex items-center gap-2 active:scale-95 transition-all">
                    <Save className="h-4 w-4" />
                    <span className="hidden sm:inline">{isEdit ? "Salvar Proposta" : "Gerar Proposta"}</span>
                    <span className="sm:hidden">{isEdit ? "Salvar" : "Gerar"}</span>
                  </Button>
                )}
              </div>
            </div>
          </Tabs>

        </div>
      </DialogContent>

      <ContatoModal open={newClientModalOpen} onClose={() => setNewClientModalOpen(false)} />
      <LocalModal open={newCondominioModalOpen} onClose={() => setNewCondominioModalOpen(false)} />
    </Dialog>
  );
}

// ─── Componentes auxiliares ────────────────────────────────────────────────

function ReviewBlock({
  title, onEdit, icon, children,
}: {
  title: string;
  onEdit: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 overflow-hidden">
      <button
        type="button"
        onClick={onEdit}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/40 hover:bg-muted/60 transition-colors"
      >
        <span className="text-[10px] font-bold font-oswald uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          {icon} {title}
        </span>
        <span className="text-[10px] text-primary font-barlow underline">editar</span>
      </button>
      <div className="px-4 py-3">{children}</div>
    </div>
  );
}

function ReviewRow({
  label, value, highlight, wrap, className,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  wrap?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("space-y-0.5", className)}>
      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground font-barlow">{label}</p>
      <p className={cn(
        "text-sm font-barlow",
        wrap ? "line-clamp-2" : "truncate",
        highlight ? "font-bold text-foreground" : "text-muted-foreground",
        !value || value === "—" ? "italic opacity-50" : "",
      )}>
        {value || "—"}
      </p>
    </div>
  );
}
