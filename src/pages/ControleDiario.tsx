import { useState, useMemo } from "react";
import {
  ChevronLeft, ChevronRight, Plus, Trash2, Pencil,
  CalendarDays, Users, DollarSign, Briefcase,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { PontoDiario } from "@/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const toISO = (d: Date) => d.toISOString().slice(0, 10);
const todayISO = () => toISO(new Date());

function ptBRDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function addDays(iso: string, n: number) {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + n);
  return toISO(d);
}

// ─── Componente ─────────────────────────────────────────────────────────────

export default function ControleDiario() {
  const {
    funcionarios, trabalhos,
    pontoDiario, addPontoDiario, updatePontoDiario, deletePontoDiario,
  } = useApp();

  const [dataSel, setDataSel] = useState(todayISO());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PontoDiario | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const emptyForm = {
    funcionario_id: "",
    trabalho_id: "",
    tipo_dia: "completo" as "completo" | "meio",
    valor_diaria: 0,
    observacoes: "",
  };
  const [form, setForm] = useState(emptyForm);

  // Custo calculado no modal
  const custoModal = form.tipo_dia === "meio" ? form.valor_diaria / 2 : form.valor_diaria;

  // Pontos do dia selecionado
  const pontosDia = useMemo(
    () => pontoDiario.filter((p) => p.data === dataSel),
    [pontoDiario, dataSel]
  );

  // Totais do dia
  const totalDia = pontosDia.reduce((s, p) => s + p.custo_total, 0);
  const totalPessoas = pontosDia.length;

  // Agrupado por obra (para o resumo financeiro)
  const porObra = useMemo(() => {
    const map: Record<string, { nome: string; custo: number; pessoas: number }> = {};
    for (const p of pontosDia) {
      const key = p.trabalho_id ?? "__sem_obra__";
      const trab = trabalhos.find((t) => t.id === p.trabalho_id);
      if (!map[key]) map[key] = { nome: trab?.titulo ?? "Sem obra vinculada", custo: 0, pessoas: 0 };
      map[key].custo += p.custo_total;
      map[key].pessoas += 1;
    }
    return Object.values(map);
  }, [pontosDia, trabalhos]);

  // ── Modal ──
  const openModal = (item?: PontoDiario) => {
    if (item) {
      setEditingItem(item);
      setForm({
        funcionario_id: item.funcionario_id,
        trabalho_id: item.trabalho_id ?? "",
        tipo_dia: item.tipo_dia,
        valor_diaria: item.valor_diaria,
        observacoes: item.observacoes,
      });
    } else {
      setEditingItem(null);
      setForm(emptyForm);
    }
    setModalOpen(true);
  };

  const handleFuncChange = (id: string) => {
    const func = funcionarios.find((f) => f.id === id);
    setForm((prev) => ({ ...prev, funcionario_id: id, valor_diaria: func?.valor_diaria ?? 0 }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.funcionario_id) return;
    const custo = form.tipo_dia === "meio" ? form.valor_diaria / 2 : form.valor_diaria;
    const payload = {
      funcionario_id: form.funcionario_id,
      trabalho_id: form.trabalho_id || null,
      data: dataSel,
      tipo_dia: form.tipo_dia,
      valor_diaria: form.valor_diaria,
      custo_total: custo,
      observacoes: form.observacoes,
    };
    if (editingItem) {
      updatePontoDiario(editingItem.id, payload);
    } else {
      addPontoDiario(payload);
    }
    setModalOpen(false);
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-slide-in pb-10">

      {/* Header com navegação de data */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-oswald uppercase tracking-tight">Controle Diário</h1>
          <p className="text-sm text-muted-foreground font-barlow tracking-wider">
            Registro de presença e custo de mão de obra
          </p>
        </div>
        <Button
          onClick={() => openModal()}
          className="gap-2 font-oswald font-bold uppercase tracking-widest bg-foreground text-background hover:bg-foreground/90"
        >
          <Plus className="h-4 w-4" /> Registrar Ponto
        </Button>
      </div>

      {/* Navegação de data */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-4 flex items-center gap-3">
        <Button type="button" variant="ghost" size="icon" onClick={() => setDataSel(addDays(dataSel, -1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 flex items-center justify-center gap-3">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <input
            type="date"
            value={dataSel}
            onChange={(e) => setDataSel(e.target.value)}
            className="font-oswald font-bold text-lg bg-transparent border-none outline-none text-center"
          />
          <span className="text-sm text-muted-foreground font-barlow">
            ({ptBRDate(dataSel)})
          </span>
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={() => setDataSel(addDays(dataSel, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        {dataSel !== todayISO() && (
          <Button type="button" variant="outline" size="sm" onClick={() => setDataSel(todayISO())} className="font-barlow text-xs">
            Hoje
          </Button>
        )}
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl border border-border shadow-sm p-4 flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-xl">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-oswald">Presenças</p>
            <p className="text-2xl font-bold font-oswald">{totalPessoas}</p>
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-border shadow-sm p-4 flex items-center gap-3">
          <div className="p-2.5 bg-destructive/10 rounded-xl">
            <DollarSign className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-oswald">Custo MO</p>
            <p className="text-2xl font-bold font-oswald text-destructive">{fmt(totalDia)}</p>
          </div>
        </div>
        {porObra.length > 0 && (
          <div className="col-span-2 md:col-span-1 bg-card rounded-2xl border border-border shadow-sm p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-oswald mb-2">Por Obra</p>
            <div className="space-y-1.5">
              {porObra.map((o, i) => (
                <div key={i} className="flex items-center justify-between text-xs font-barlow">
                  <span className="truncate max-w-[120px]" title={o.nome}>{o.nome}</span>
                  <span className="font-bold text-destructive shrink-0">{fmt(o.custo)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lista de pontos do dia */}
      {pontosDia.length === 0 ? (
        <div className="bg-card rounded-2xl border border-dashed border-border shadow-sm p-12 text-center">
          <Users className="h-10 w-10 opacity-20 mx-auto mb-3" />
          <p className="text-muted-foreground font-barlow italic">Nenhum ponto registrado para este dia.</p>
          <Button type="button" variant="outline" onClick={() => openModal()} className="mt-4 font-barlow gap-2">
            <Plus className="h-4 w-4" /> Registrar agora
          </Button>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-muted/20">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-oswald">
              Registros do dia — {ptBRDate(dataSel)}
            </p>
          </div>
          <div className="divide-y divide-border/50">
            {pontosDia.map((p) => {
              const func = funcionarios.find((f) => f.id === p.funcionario_id);
              const trab = trabalhos.find((t) => t.id === p.trabalho_id);
              return (
                <div key={p.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/20 transition-colors group">
                  {/* Avatar inicial */}
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="font-bold font-oswald text-primary text-sm">
                      {func?.nome?.charAt(0).toUpperCase() ?? "?"}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold font-oswald uppercase tracking-tight text-sm">
                      {func?.nome ?? "Colaborador removido"}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      {trab ? (
                        <span className="text-[10px] font-barlow text-muted-foreground flex items-center gap-1">
                          <Briefcase className="h-3 w-3" /> {trab.titulo}
                        </span>
                      ) : (
                        <span className="text-[10px] font-barlow text-muted-foreground italic">Sem obra vinculada</span>
                      )}
                      {p.observacoes && (
                        <span className="text-[10px] font-barlow text-muted-foreground">· {p.observacoes}</span>
                      )}
                    </div>
                  </div>

                  {/* Badges + custo */}
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge
                      variant="secondary"
                      className={p.tipo_dia === "meio"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-oswald text-[10px]"
                        : "font-oswald text-[10px]"}
                    >
                      {p.tipo_dia === "meio" ? "½ Diária" : "Diária"}
                    </Badge>
                    <div className="text-right">
                      <p className="font-bold text-sm text-destructive font-oswald">{fmt(p.custo_total)}</p>
                      {p.tipo_dia === "meio" && (
                        <p className="text-[10px] text-muted-foreground font-barlow">{fmt(p.valor_diaria)}/dia</p>
                      )}
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button type="button" variant="ghost" size="icon" onClick={() => openModal(p)} className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => setDeleteId(p.id)} className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rodapé com total */}
          <div className="px-5 py-3 border-t border-border bg-muted/10 flex items-center justify-between">
            <span className="text-xs font-barlow text-muted-foreground">{totalPessoas} {totalPessoas === 1 ? "pessoa" : "pessoas"}</span>
            <span className="font-bold font-oswald text-destructive">{fmt(totalDia)}</span>
          </div>
        </div>
      )}

      {/* Modal de registro */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[440px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-oswald uppercase">
              {editingItem ? "Editar Ponto" : "Registrar Ponto"}
              <span className="ml-2 text-sm font-barlow font-normal text-muted-foreground normal-case">
                {ptBRDate(dataSel)}
              </span>
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">

            {/* Colaborador */}
            <div className="space-y-1.5">
              <Label className="uppercase text-[10px] font-bold tracking-widest text-muted-foreground">Colaborador</Label>
              <Select value={form.funcionario_id} onValueChange={handleFuncChange} required>
                <SelectTrigger className="h-11 font-barlow">
                  <SelectValue placeholder="Selecionar colaborador..." />
                </SelectTrigger>
                <SelectContent>
                  {funcionarios.filter((f) => f.ativo).map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.nome} <span className="text-muted-foreground ml-1 text-xs">({fmt(f.valor_diaria)}/dia)</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Obra */}
            <div className="space-y-1.5">
              <Label className="uppercase text-[10px] font-bold tracking-widest text-muted-foreground">Obra / Trabalho</Label>
              <Select
                value={form.trabalho_id || "__nenhuma__"}
                onValueChange={(v) => setForm((prev) => ({ ...prev, trabalho_id: v === "__nenhuma__" ? "" : v }))}
              >
                <SelectTrigger className="h-11 font-barlow">
                  <SelectValue placeholder="Sem obra vinculada" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__nenhuma__">-- Sem obra vinculada --</SelectItem>
                  {trabalhos
                    .filter((t) => t.status_obra !== "Finalizado")
                    .map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.titulo}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de dia + valor */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="uppercase text-[10px] font-bold tracking-widest text-muted-foreground">Tipo de Dia</Label>
                <Select
                  value={form.tipo_dia}
                  onValueChange={(v) => setForm((prev) => ({ ...prev, tipo_dia: v as "completo" | "meio" }))}
                >
                  <SelectTrigger className="h-11 font-barlow">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completo">Diária Completa</SelectItem>
                    <SelectItem value="meio">Meia Diária</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="uppercase text-[10px] font-bold tracking-widest text-muted-foreground">Valor Diária (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.valor_diaria}
                  onChange={(e) => setForm((prev) => ({ ...prev, valor_diaria: Number(e.target.value) }))}
                  className="font-oswald h-11"
                />
              </div>
            </div>

            {/* Preview custo */}
            {form.valor_diaria > 0 && (
              <div className="rounded-lg bg-destructive/5 border border-destructive/20 px-3 py-2 flex items-center justify-between text-xs font-bold font-oswald text-destructive">
                <span>CUSTO DESTA PRESENÇA</span>
                <span>{fmt(custoModal)}</span>
              </div>
            )}

            {/* Observações */}
            <div className="space-y-1.5">
              <Label className="uppercase text-[10px] font-bold tracking-widest text-muted-foreground">Observações</Label>
              <Textarea
                value={form.observacoes}
                onChange={(e) => setForm((prev) => ({ ...prev, observacoes: e.target.value }))}
                placeholder="Ex: Saiu mais cedo, hora extra..."
                className="font-barlow resize-none h-20"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setModalOpen(false)} className="flex-1 font-barlow font-bold">
                CANCELAR
              </Button>
              <Button
                type="submit"
                disabled={!form.funcionario_id}
                className="flex-1 bg-foreground text-background hover:bg-foreground/90 font-oswald font-bold uppercase tracking-widest"
              >
                {editingItem ? "ATUALIZAR" : "REGISTRAR"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* AlertDialog exclusão */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-oswald uppercase text-xl">Remover Ponto?</AlertDialogTitle>
            <AlertDialogDescription className="font-barlow">
              O registro de presença será excluído. Isso afeta o custo calculado da obra.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-barlow font-bold">CANCELAR</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deleteId) deletePontoDiario(deleteId); setDeleteId(null); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-oswald font-bold uppercase"
            >
              REMOVER
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
