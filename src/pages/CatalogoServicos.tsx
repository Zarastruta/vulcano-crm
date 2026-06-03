import { useState, useMemo } from "react";
import {
  Package, Plus, Pencil, Trash2, Search, ChevronDown, ChevronRight,
  Layers, Droplets, Hammer, ShieldCheck, DoorOpen, Brush, Home,
  Clock, Users, Zap, AlertTriangle
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { CatalogoServico, TipoServico, NivelDificuldade } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

// ─── Taxonomia de Serralheria Metálica ───────────────────────────────────────

const CATEGORIAS: Record<string, { subs: string[]; unidade: string; margem: number; cor: string; icone: string }> = {
  "Estruturas Metálicas": {
    subs: ["Mezanino", "Galpão", "Cobertura", "Passarela", "Plataforma", "Escada Industrial", "Geral"],
    unidade: "kg", margem: 0, cor: "orange", icone: "🏗️"
  },
  "Portões e Cancelas": {
    subs: ["Portão Deslizante", "Portão Basculante", "Portão Pivotante", "Cancela", "Automação", "Geral"],
    unidade: "un", margem: 0, cor: "zinc", icone: "🚪"
  },
  "Escadas e Corrimãos": {
    subs: ["Escada Reta", "Escada Caracol", "Corrimão Externo", "Corrimão Interno", "Guarda-corpo", "Geral"],
    unidade: "m", margem: 0, cor: "slate", icone: "🪜"
  },
  "Grades e Proteções": {
    subs: ["Grade de Janela", "Grade de Porta", "Alambrado", "Tela Soldada", "Proteção Antifurto", "Geral"],
    unidade: "m²", margem: 0, cor: "amber", icone: "🔒"
  },
  "Coberturas Metálicas": {
    subs: ["Telhado Simples", "Telhado com Calha", "Marquise", "Pergolado", "Toldo Metálico", "Geral"],
    unidade: "m²", margem: 0, cor: "blue", icone: "🏠"
  },
  "Serralheria Fina": {
    subs: ["Janela de Ferro", "Basculante", "Treliça Decorativa", "Gradil Ornamental", "Letreiro Metálico", "Geral"],
    unidade: "un", margem: 0, cor: "violet", icone: "✨"
  },
  "Manutenção": {
    subs: ["Soldagem", "Pintura Anticorrosiva", "Substituição de Peças", "Regulagem", "Revisão Geral"],
    unidade: "serv", margem: 0, cor: "green", icone: "🔧"
  },
};

const TODAS_CATEGORIAS = Object.keys(CATEGORIAS);

const UNIDADES = ["un", "m²", "m", "kg", "barra", "ml", "conj", "vb", "serv", "h", "pç"];
const TIPOS_SERVICO: { value: TipoServico; label: string }[] = [
  { value: "fabricacao",  label: "Fabricação" },
  { value: "instalacao",  label: "Instalação" },
  { value: "manutencao",  label: "Manutenção" },
  { value: "reforma",     label: "Reforma" },
  { value: "emergencial", label: "Emergencial" },
];
const DIFICULDADES: { value: NivelDificuldade; label: string }[] = [
  { value: "facil",  label: "Fácil" },
  { value: "medio",  label: "Médio" },
  { value: "dificil",label: "Difícil" },
];

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

const MARGEM_COR = (m: number) => m >= 40 ? "text-emerald-600" : m >= 25 ? "text-amber-600" : "text-destructive";

const BADGE_TIPO: Record<TipoServico, string> = {
  fabricacao:  "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  instalacao:  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  manutencao:  "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  reforma:     "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  emergencial: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};
const BADGE_DIFIC: Record<NivelDificuldade, string> = {
  facil:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  medio:  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  dificil:"bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

// ─── Componente ──────────────────────────────────────────────────────────────

export default function CatalogoServicos() {
  const { catalogoServicos, addCatalogoServico, updateCatalogoServico, deleteCatalogoServico, funcionarios } = useApp();

  const [searchTerm, setSearchTerm]         = useState("");
  const [filterCategoria, setFilterCategoria] = useState<string>("todas");
  const [expandedCats, setExpandedCats]     = useState<Set<string>>(new Set(TODAS_CATEGORIAS));
  const [deleteId, setDeleteId]             = useState<string | null>(null);
  const [modalOpen, setModalOpen]           = useState(false);
  const [editingItem, setEditingItem]       = useState<CatalogoServico | null>(null);
  const [modalTab, setModalTab]             = useState<"classificacao" | "custo" | "operacional">("classificacao");

  const emptyForm = {
    nome: "", unidade_padrao: "un", prestador_padrao_id: "",
    categoria: "", subcategoria: "",
    custo_material: 0, custo_mao_obra: 0, custo_deslocamento: 0,
    custo_galvanizacao: 0, custo_pintura: 0, custo_corte_dobra: 0,
    margem_desejada: 35, valor_base_sugerido: 0, custo_padrao: 0,
    tipo_servico: "" as string, dificuldade: "" as string,
    tempo_medio: "", equipe_necessaria: "",
  };
  const [form, setForm] = useState(emptyForm);

  // Custo total calculado ao vivo
  const custoTotal = form.custo_material + form.custo_mao_obra + form.custo_deslocamento + form.custo_galvanizacao + form.custo_pintura + form.custo_corte_dobra;
  const vendaCalculada = form.margem_desejada < 100
    ? custoTotal / (1 - form.margem_desejada / 100)
    : custoTotal * 2;
  const margemReal = vendaCalculada > 0 ? ((vendaCalculada - custoTotal) / vendaCalculada) * 100 : 0;

  const subcategorias = form.categoria ? (CATEGORIAS[form.categoria]?.subs ?? []) : [];

  const filtered = useMemo(() =>
    catalogoServicos.filter(s => {
      const matchSearch = s.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.subcategoria ?? "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = filterCategoria === "todas" || s.categoria === filterCategoria;
      return matchSearch && matchCat;
    }), [catalogoServicos, searchTerm, filterCategoria]);

  const grouped = useMemo(() => {
    const map: Record<string, Record<string, CatalogoServico[]>> = {};
    for (const s of filtered) {
      const cat = s.categoria || "Sem Categoria";
      const sub = s.subcategoria || "Geral";
      if (!map[cat]) map[cat] = {};
      if (!map[cat][sub]) map[cat][sub] = [];
      map[cat][sub].push(s);
    }
    return map;
  }, [filtered]);

  const handleOpenModal = (item?: CatalogoServico) => {
    setModalTab("classificacao");
    if (item) {
      setEditingItem(item);
      setForm({
        nome: item.nome, unidade_padrao: item.unidade_padrao,
        prestador_padrao_id: item.prestador_padrao_id || "",
        categoria: item.categoria || "", subcategoria: item.subcategoria || "",
        custo_material: item.custo_material, custo_mao_obra: item.custo_mao_obra,
        custo_deslocamento: item.custo_deslocamento,
        custo_galvanizacao: item.custo_galvanizacao, custo_pintura: item.custo_pintura,
        custo_corte_dobra: item.custo_corte_dobra,
        margem_desejada: item.margem_desejada, valor_base_sugerido: item.valor_base_sugerido,
        custo_padrao: item.custo_padrao,
        tipo_servico: item.tipo_servico || "", dificuldade: item.dificuldade || "",
        tempo_medio: item.tempo_medio || "", equipe_necessaria: item.equipe_necessaria || "",
      });
    } else {
      setEditingItem(null);
      setForm(emptyForm);
    }
    setModalOpen(true);
  };

  const handleCategoriaChange = (cat: string) => {
    const catInfo = CATEGORIAS[cat];
    setForm(prev => ({
      ...prev, categoria: cat, subcategoria: "",
      unidade_padrao: catInfo?.unidade ?? "un",
      margem_desejada: catInfo?.margem ?? 35,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      nome: form.nome, unidade_padrao: form.unidade_padrao,
      prestador_padrao_id: form.prestador_padrao_id || null,
      categoria: form.categoria || null, subcategoria: form.subcategoria || null,
      custo_material: form.custo_material, custo_mao_obra: form.custo_mao_obra,
      custo_deslocamento: form.custo_deslocamento,
      custo_galvanizacao: form.custo_galvanizacao, custo_pintura: form.custo_pintura,
      custo_corte_dobra: form.custo_corte_dobra,
      custo_padrao: custoTotal,
      margem_desejada: form.margem_desejada, valor_base_sugerido: parseFloat(vendaCalculada.toFixed(2)),
      tipo_servico: (form.tipo_servico || null) as TipoServico | null,
      dificuldade: (form.dificuldade || null) as NivelDificuldade | null,
      tempo_medio: form.tempo_medio || null, equipe_necessaria: form.equipe_necessaria || null,
    };
    let success = false;
    if (editingItem) {
      success = await updateCatalogoServico(editingItem.id, payload);
    } else {
      const id = await addCatalogoServico(payload);
      success = !!id;
    }
    if (success) setModalOpen(false);
  };

  const toggleCat = (cat: string) =>
    setExpandedCats(prev => { const n = new Set(prev); n.has(cat) ? n.delete(cat) : n.add(cat); return n; });

  return (
    <div className="space-y-6 animate-slide-in pb-10">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-oswald uppercase tracking-tight">Catálogo de Serviços</h1>
          <p className="text-sm text-muted-foreground font-barlow tracking-wider">
            Tabela de Precificação · {filtered.length} {filtered.length === 1 ? "serviço" : "serviços"}
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} className="gap-2 font-oswald font-bold uppercase tracking-widest bg-foreground text-background hover:bg-foreground/90">
          <Plus className="h-4 w-4" /> Cadastrar Serviço
        </Button>
      </div>

      {/* Filtros */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou subcategoria..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 font-barlow h-11" />
        </div>
        <Select value={filterCategoria} onValueChange={setFilterCategoria}>
          <SelectTrigger className="w-full md:w-60 h-11 font-barlow">
            <SelectValue placeholder="Todas as categorias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as categorias</SelectItem>
            {TODAS_CATEGORIAS.map(cat => (
              <SelectItem key={cat} value={cat}>{CATEGORIAS[cat].icone} {cat}</SelectItem>
            ))}
            <SelectItem value="Sem Categoria">⚪ Sem Categoria</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista agrupada */}
      {Object.keys(grouped).length === 0 ? (
        <div className="bg-card rounded-2xl border border-border shadow-sm p-12 text-center">
          <Package className="h-10 w-10 opacity-20 mx-auto mb-3" />
          <p className="text-muted-foreground font-barlow italic">
            {searchTerm || filterCategoria !== "todas" ? "Nenhum serviço encontrado com esses filtros." : "Nenhum serviço cadastrado ainda."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([cat, subcats]) => {
            const isExpanded = expandedCats.has(cat);
            const catTotal = Object.values(subcats).flat().length;
            const catInfo = CATEGORIAS[cat];
            const avgMargem = Object.values(subcats).flat().reduce((acc, s) => acc + s.margem_desejada, 0) / catTotal;

            return (
              <div key={cat} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <button type="button" onClick={() => toggleCat(cat)} className="w-full flex items-center justify-between px-5 py-4 bg-muted/30 hover:bg-muted/50 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{catInfo?.icone ?? "📦"}</span>
                    <span className="font-bold font-oswald uppercase tracking-wider text-base">{cat}</span>
                    <Badge variant="secondary" className="font-oswald text-xs">{catTotal}</Badge>
                    {!isNaN(avgMargem) && (
                      <span className={cn("text-[10px] font-bold font-oswald uppercase tracking-widest", MARGEM_COR(avgMargem))}>
                        ~{avgMargem.toFixed(0)}% marg.
                      </span>
                    )}
                  </div>
                  {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                </button>

                {isExpanded && (
                  <div className="divide-y divide-border/50">
                    {Object.entries(subcats).map(([sub, items]) => (
                      <div key={sub}>
                        <div className="px-5 py-2 bg-muted/10 flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-oswald">{sub}</span>
                          <span className="text-[10px] text-muted-foreground font-barlow">· {items.length}</span>
                        </div>
                        <div className="divide-y divide-border/30">
                          {items.map(s => {
                            const func = funcionarios.find(f => f.id === s.prestador_padrao_id);
                            const margem = s.margem_desejada;
                            return (
                              <div key={s.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/20 transition-colors group">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold font-oswald uppercase tracking-tight text-sm">{s.nome}</span>
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-muted font-bold font-oswald text-[10px] uppercase">{s.unidade_padrao}</span>
                                    {s.tipo_servico && (
                                      <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase", BADGE_TIPO[s.tipo_servico])}>
                                        {s.tipo_servico === "emergencial" && <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />}
                                        {s.tipo_servico}
                                      </span>
                                    )}
                                    {s.dificuldade && (
                                      <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase", BADGE_DIFIC[s.dificuldade])}>
                                        {s.dificuldade}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 mt-0.5 font-barlow">
                                    {s.tempo_medio && (
                                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-2.5 w-2.5" /> {s.tempo_medio}
                                      </span>
                                    )}
                                    {s.equipe_necessaria && (
                                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                        <Users className="h-2.5 w-2.5" /> {s.equipe_necessaria}
                                      </span>
                                    )}
                                    {func && <span className="text-[10px] text-muted-foreground">· {func.nome}</span>}
                                  </div>
                                </div>
                                <div className="hidden sm:flex items-center gap-5 text-right shrink-0">
                                  <div>
                                    <p className="text-[9px] font-oswald uppercase text-muted-foreground tracking-wider">Custo</p>
                                    <p className="font-bold text-sm text-destructive">{formatCurrency(s.custo_padrao)}</p>
                                  </div>
                                  <div>
                                    <p className="text-[9px] font-oswald uppercase text-muted-foreground tracking-wider">Venda</p>
                                    <p className="font-bold text-sm text-emerald-600">{formatCurrency(s.valor_base_sugerido)}</p>
                                  </div>
                                  <div className="flex flex-col items-end">
                                    <p className="text-[9px] font-oswald uppercase text-muted-foreground tracking-wider">Margem</p>
                                    <p className={cn("font-bold text-sm", MARGEM_COR(margem))}>{margem.toFixed(0)}%</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                  <Button type="button" variant="ghost" size="icon" onClick={() => handleOpenModal(s)} className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button type="button" variant="ghost" size="icon" onClick={() => setDeleteId(s.id)} className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Cadastro / Edição */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[560px] rounded-2xl p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b border-border bg-muted/20">
            <DialogTitle className="text-xl font-bold font-oswald uppercase">
              {editingItem ? "Editar Serviço" : "Cadastrar Serviço"}
            </DialogTitle>
          </DialogHeader>

          {/* Tabs internas */}
          <div className="flex border-b border-border bg-card">
            {(["classificacao", "custo", "operacional"] as const).map((tab, i) => (
              <button key={tab} type="button" onClick={() => setModalTab(tab)}
                className={cn("flex-1 py-2.5 text-[10px] font-bold uppercase tracking-widest font-oswald transition-colors",
                  modalTab === tab ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
                )}>
                {i === 0 ? "1. Serviço" : i === 1 ? "2. Custo" : "3. Operação"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="px-6 py-5 space-y-4 min-h-[300px]">

              {/* Tab 1: Classificação */}
              {modalTab === "classificacao" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="uppercase text-[10px] font-bold tracking-widest text-muted-foreground">Categoria *</Label>
                      <Select value={form.categoria} onValueChange={handleCategoriaChange}>
                        <SelectTrigger className="h-11 font-barlow"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                        <SelectContent>
                          {TODAS_CATEGORIAS.map(cat => (
                            <SelectItem key={cat} value={cat}>{CATEGORIAS[cat].icone} {cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="uppercase text-[10px] font-bold tracking-widest text-muted-foreground">Subcategoria</Label>
                      <Select value={form.subcategoria} onValueChange={v => setForm(prev => ({ ...prev, subcategoria: v }))} disabled={!form.categoria}>
                        <SelectTrigger className="h-11 font-barlow"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                        <SelectContent>
                          {subcategorias.map(sub => <SelectItem key={sub} value={sub}>{sub}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 space-y-1.5">
                      <Label className="uppercase text-[10px] font-bold tracking-widest text-muted-foreground">Nome do Serviço *</Label>
                      <Input value={form.nome} onChange={e => setForm(prev => ({ ...prev, nome: e.target.value }))} placeholder="Ex: Assentamento de Porcelanato" required className="font-oswald uppercase h-11" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="uppercase text-[10px] font-bold tracking-widest text-muted-foreground">Unidade</Label>
                      <Select value={form.unidade_padrao} onValueChange={v => setForm(prev => ({ ...prev, unidade_padrao: v }))}>
                        <SelectTrigger className="h-11 font-oswald uppercase"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {UNIDADES.map(u => <SelectItem key={u} value={u} className="font-oswald uppercase">{u}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="uppercase text-[10px] font-bold tracking-widest text-muted-foreground">Tipo de Serviço</Label>
                      <Select value={form.tipo_servico} onValueChange={v => setForm(prev => ({ ...prev, tipo_servico: v }))}>
                        <SelectTrigger className="h-11 font-barlow"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                        <SelectContent>
                          {TIPOS_SERVICO.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="uppercase text-[10px] font-bold tracking-widest text-muted-foreground">Dificuldade</Label>
                      <Select value={form.dificuldade} onValueChange={v => setForm(prev => ({ ...prev, dificuldade: v }))}>
                        <SelectTrigger className="h-11 font-barlow"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                        <SelectContent>
                          {DIFICULDADES.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}

              {/* Tab 2: Custo Granular */}
              {modalTab === "custo" && (
                <>
                  <p className="text-xs text-muted-foreground font-barlow italic">Quebre o custo em partes para uma precificação cirúrgica.</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: "custo_material",     label: "Material (R$)" },
                      { key: "custo_mao_obra",      label: "Mão de Obra (R$)" },
                      { key: "custo_deslocamento",  label: "Deslocamento (R$)" },
                      { key: "custo_galvanizacao",  label: "Galvanização (R$)" },
                      { key: "custo_pintura",       label: "Pintura / Jateamento (R$)" },
                      { key: "custo_corte_dobra",   label: "Corte e Dobra (R$)" },
                    ].map(({ key, label }) => (
                      <div key={key} className="space-y-1.5">
                        <Label className="uppercase text-[10px] font-bold tracking-widest text-muted-foreground">{label}</Label>
                        <Input type="number" step="0.01" min="0"
                          value={(form as any)[key]}
                          onChange={e => setForm(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                          className="font-oswald h-11" />
                      </div>
                    ))}
                  </div>
                  <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between text-sm font-barlow">
                      <span className="text-muted-foreground">Custo Total</span>
                      <span className="font-bold text-destructive">{formatCurrency(custoTotal)}</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <Label className="uppercase text-[10px] font-bold tracking-widest text-muted-foreground">Margem Desejada (%)</Label>
                        <span className="text-xs font-barlow text-muted-foreground">Padrão da categoria</span>
                      </div>
                      <Input type="number" step="1" min="0" max="99"
                        value={form.margem_desejada}
                        onChange={e => setForm(prev => ({ ...prev, margem_desejada: Number(e.target.value) }))}
                        className="font-oswald h-11 text-center text-lg font-bold" />
                    </div>
                    <div className={cn("rounded-lg px-4 py-3 flex items-center justify-between font-oswald",
                      margemReal >= 40 ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400" :
                      margemReal >= 25 ? "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400" :
                      "bg-red-50 dark:bg-red-950/20 text-destructive")}>
                      <div>
                        <p className="text-[9px] uppercase tracking-widest opacity-70">Venda Sugerida</p>
                        <p className="text-2xl font-bold">{formatCurrency(vendaCalculada)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] uppercase tracking-widest opacity-70">Lucro Real</p>
                        <p className="font-bold text-lg">{margemReal.toFixed(0)}%</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Tab 3: Operacional */}
              {modalTab === "operacional" && (
                <>
                  <div className="space-y-1.5">
                    <Label className="uppercase text-[10px] font-bold tracking-widest text-muted-foreground">Tempo Médio de Execução</Label>
                    <Input value={form.tempo_medio} onChange={e => setForm(prev => ({ ...prev, tempo_medio: e.target.value }))}
                      placeholder="Ex: 1 dia / 20m²  ou  3-5h" className="font-barlow h-11" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="uppercase text-[10px] font-bold tracking-widest text-muted-foreground">Equipe Necessária</Label>
                    <Input value={form.equipe_necessaria} onChange={e => setForm(prev => ({ ...prev, equipe_necessaria: e.target.value }))}
                      placeholder="Ex: 1 pedreiro + 1 ajudante" className="font-barlow h-11" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="uppercase text-[10px] font-bold tracking-widest text-muted-foreground">Parceiro / Profissional Padrão</Label>
                    <Select value={form.prestador_padrao_id || "__none__"} onValueChange={v => setForm(prev => ({ ...prev, prestador_padrao_id: v === "__none__" ? "" : v }))}>
                      <SelectTrigger className="h-11 font-barlow"><SelectValue placeholder="Nenhum vínculo" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">-- Nenhum Vínculo --</SelectItem>
                        {funcionarios.map(f => <SelectItem key={f.id} value={f.id}>{f.nome} ({f.tipo})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>

            <div className="px-6 pb-5 flex gap-3">
              <Button type="button" variant="ghost" onClick={() => setModalOpen(false)} className="flex-1 font-barlow font-bold">CANCELAR</Button>
              <Button type="submit" className="flex-1 bg-foreground text-background hover:bg-foreground/90 font-oswald font-bold uppercase tracking-widest">
                {editingItem ? "ATUALIZAR" : "CADASTRAR"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* AlertDialog de Exclusão */}
      <AlertDialog open={!!deleteId} onOpenChange={open => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-oswald uppercase text-xl">Excluir Serviço?</AlertDialogTitle>
            <AlertDialogDescription className="font-barlow">
              Esse serviço será removido do catálogo. Orçamentos existentes não serão afetados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-barlow font-bold">CANCELAR</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) deleteCatalogoServico(deleteId); setDeleteId(null); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-oswald font-bold uppercase tracking-widest">
              EXCLUIR
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
