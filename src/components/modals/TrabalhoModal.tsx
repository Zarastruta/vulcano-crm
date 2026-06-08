import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Upload, ListTodo, DollarSign } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Trabalho, OS_STATUSES, StatusObra } from "@/types";
import { supabase } from "@/integrations/supabase/client";
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
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  trabalho?: Trabalho;
  defaultCondominioId?: string;
}

const PRIORIDADES: Trabalho["prioridade"][] = ["Baixa", "Média", "Alta", "Crítica"];

const STATUS_ICONS: Record<StatusObra, string> = {
  "Novo": "🆕", "Medição": "📐", "Projeto": "📋", "Compras": "🛒",
  "Fabricação": "🔨", "Galvanização": "⚙️", "Pintura": "🎨",
  "Instalação": "🔩", "Finalizado": "✅",
};

export function TrabalhoModal({ open, onClose, trabalho, defaultCondominioId }: Props) {
  const { addTrabalho, updateTrabalho, locais, clientes, user } = useApp();
  const isEdit = !!trabalho;

  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    data: new Date() as Date,
    prazo: null as Date | null,
    valor: 0,
    status_pagamento: "nao_pago" as Trabalho["status_pagamento"],
    status_pagamento_detalhado: "pendente" as Trabalho["status_pagamento_detalhado"],
    valor_pago: 0,
    status_obra: "Novo" as StatusObra,
    prioridade: "Média" as Trabalho["prioridade"],
    compras_pendentes: false,
    nota_fiscal: "",
    nota_fiscal_data: null as Date | null,
    nota_fiscal_hora: "",
    data_pagamento: null as Date | null,
    condominioId: defaultCondominioId ?? null as string | null,
    clienteId: null as string | null,
    sindicoId: null as string | null,
    responsavel_id: null as string | null,
    endereco_obra: "",
    observacoes: "",
    conclusao_percentual: 0,
    etapa_atual: "",
    custo_estimado: 0,
  });

  const [nfFotoPath, setNfFotoPath] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (trabalho) {
      setForm({
        titulo: trabalho.titulo,
        descricao: trabalho.descricao,
        data: trabalho.data ? new Date(trabalho.data + "T12:00:00") : new Date(),
        prazo: trabalho.prazo ? new Date(trabalho.prazo + "T12:00:00") : null,
        valor: trabalho.valor,
        status_pagamento: trabalho.status_pagamento,
        status_pagamento_detalhado: trabalho.status_pagamento_detalhado ?? "pendente",
        valor_pago: trabalho.valor_pago ?? 0,
        status_obra: trabalho.status_obra ?? "Novo",
        prioridade: trabalho.prioridade ?? "Média",
        compras_pendentes: trabalho.compras_pendentes ?? false,
        nota_fiscal: trabalho.nota_fiscal,
        nota_fiscal_data: trabalho.nota_fiscal_data ? new Date(trabalho.nota_fiscal_data + "T12:00:00") : null,
        nota_fiscal_hora: trabalho.nota_fiscal_hora ?? "",
        data_pagamento: trabalho.data_pagamento ? new Date(trabalho.data_pagamento + "T12:00:00") : null,
        condominioId: trabalho.condominioId,
        clienteId: trabalho.clienteId,
        sindicoId: trabalho.sindicoId,
        responsavel_id: trabalho.responsavel_id ?? null,
        endereco_obra: trabalho.endereco_obra,
        observacoes: trabalho.observacoes,
        conclusao_percentual: trabalho.conclusao_percentual || 0,
        etapa_atual: trabalho.etapa_atual || "",
        custo_estimado: trabalho.custo_estimado || 0,
      });
      setNfFotoPath(trabalho.nota_fiscal_foto_path ?? "");
    } else {
      setForm({
        titulo: "", descricao: "", data: new Date(), prazo: null, valor: 0,
        status_pagamento: "nao_pago", status_pagamento_detalhado: "pendente", valor_pago: 0,
        status_obra: "Novo", prioridade: "Média", compras_pendentes: false,
        nota_fiscal: "", nota_fiscal_data: null, nota_fiscal_hora: "", data_pagamento: null,
        condominioId: defaultCondominioId ?? null,
        clienteId: null, sindicoId: null, responsavel_id: null,
        endereco_obra: "", observacoes: "",
        conclusao_percentual: 0, etapa_atual: "", custo_estimado: 0,
      });
      setNfFotoPath("");
    }
  }, [trabalho, open, defaultCondominioId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) { toast.error("Formato não suportado."); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Arquivo muito grande."); return; }
    setUploading(true);
    const MIME_TO_EXT: Record<string, string> = {
      "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf",
    };
    const ext = MIME_TO_EXT[file.type] ?? "bin";
    const path = `nf-${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("notas-fiscais").upload(path, file);
    if (error) { toast.error("Erro ao enviar: " + error.message); setUploading(false); return; }
    setNfFotoPath(path);
    setUploading(false);
    toast.success("Arquivo enviado!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving || uploading) return;
    setIsSaving(true);
    try {
      // 7.2 — Gerar código OS automático na criação
      let codigo = trabalho?.codigo ?? "";
      if (!isEdit && user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: codeData } = await (supabase as any).rpc("next_os_code", { p_user_id: user.id });
        codigo = (codeData as string | null) ?? `OS-${Date.now()}`;
      }

      const payload = {
        ...form,
        codigo,
        data: format(form.data, "yyyy-MM-dd"),
        prazo: form.prazo ? format(form.prazo, "yyyy-MM-dd") : null,
        nota_fiscal_data: form.nota_fiscal_data ? format(form.nota_fiscal_data, "yyyy-MM-dd") : null,
        data_pagamento: form.data_pagamento ? format(form.data_pagamento, "yyyy-MM-dd") : null,
        nota_fiscal_foto_path: nfFotoPath,
      };

      let success = false;
      if (isEdit && trabalho) {
        success = await updateTrabalho(trabalho.id, payload);
      } else {
        const id = await addTrabalho(payload);
        success = !!id;
      }
      if (success) onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent onInteractOutside={(e) => e.preventDefault()} className="max-w-2xl max-h-[95vh] overflow-y-auto p-0 border-none shadow-2xl bg-background rounded-2xl">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl font-bold font-oswald uppercase tracking-tight">
            {isEdit ? `Editar OS ${trabalho.codigo ?? ""}` : "Nova Ordem de Serviço"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground font-barlow">Preencha os dados operacionais e financeiros.</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 pb-8 space-y-6">

          {/* Dados básicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label className="uppercase text-[10px] font-bold tracking-widest text-muted-foreground">Título da OS</Label>
              <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ex: Portão Deslizante — Rua das Flores" required className="font-oswald uppercase" />
            </div>

            <div className="space-y-2">
              <Label className="uppercase text-[10px] font-bold tracking-widest text-muted-foreground">Etapa</Label>
              <Select value={form.status_obra} onValueChange={(v) => setForm({ ...form, status_obra: v as StatusObra })}>
                <SelectTrigger className="font-barlow h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {OS_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_ICONS[s]} {s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="uppercase text-[10px] font-bold tracking-widest text-muted-foreground">Prioridade</Label>
              <Select value={form.prioridade} onValueChange={(v) => setForm({ ...form, prioridade: v as Trabalho["prioridade"] })}>
                <SelectTrigger className="font-barlow h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORIDADES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="uppercase text-[10px] font-bold tracking-widest text-muted-foreground">Data Prevista</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" className="w-full justify-start text-left font-barlow h-10 border-border/60">
                    <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                    {format(form.data, "dd 'de' MMMM, yyyy", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={form.data} onSelect={(d) => d && setForm({ ...form, data: d })} initialFocus className="p-3" />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="uppercase text-[10px] font-bold tracking-widest text-muted-foreground">Prazo de Entrega</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" className={cn("w-full justify-start text-left font-barlow h-10 border-border/60", !form.prazo && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                    {form.prazo ? format(form.prazo, "dd/MM/yyyy", { locale: ptBR }) : "Sem prazo"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={form.prazo ?? undefined} onSelect={(d) => setForm({ ...form, prazo: d ?? null })} initialFocus className="p-3" />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Monitoramento */}
          <div className="bg-muted/30 p-5 rounded-2xl border border-border/60 space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <ListTodo className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-xs font-bold font-oswald uppercase tracking-widest">Execução</h3>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Progresso</Label>
                <span className="text-sm font-bold font-oswald text-primary">{form.conclusao_percentual}%</span>
              </div>
              <Slider
                value={[form.conclusao_percentual]}
                onValueChange={(val) => setForm({ ...form, conclusao_percentual: val[0] })}
                max={100} step={5} className="py-2"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="compras_pendentes"
                checked={form.compras_pendentes}
                onChange={(e) => setForm({ ...form, compras_pendentes: e.target.checked })}
                className="h-4 w-4 accent-orange-500"
              />
              <Label htmlFor="compras_pendentes" className="text-xs font-bold uppercase text-muted-foreground cursor-pointer">
                Compras Pendentes
              </Label>
            </div>
          </div>

          {/* Financeiro */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-3 w-3 text-emerald-600" />
                <Label className="uppercase text-[10px] font-bold tracking-widest text-muted-foreground">Valor Contrato</Label>
              </div>
              <CurrencyInput value={form.valor} onChange={(v) => setForm({ ...form, valor: v })} className="font-oswald text-lg" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-3 w-3 text-destructive" />
                <Label className="uppercase text-[10px] font-bold tracking-widest text-muted-foreground">Custo Estimado</Label>
              </div>
              <CurrencyInput value={form.custo_estimado} onChange={(v) => setForm({ ...form, custo_estimado: v })} className="font-oswald text-lg text-destructive" />
            </div>
            <div className="space-y-2">
              <Label className="uppercase text-[10px] font-bold tracking-widest text-muted-foreground">Status Pagamento</Label>
              <Select value={form.status_pagamento_detalhado} onValueChange={(v) => setForm({ ...form, status_pagamento_detalhado: v as Trabalho["status_pagamento_detalhado"] })}>
                <SelectTrigger className="font-barlow h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="parcial">Parcial</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-3 w-3 text-sky-600" />
                <Label className="uppercase text-[10px] font-bold tracking-widest text-muted-foreground">Valor Pago</Label>
              </div>
              <CurrencyInput value={form.valor_pago} onChange={(v) => setForm({ ...form, valor_pago: v })} className="font-oswald text-lg text-sky-600" />
            </div>
          </div>

          {/* Vínculos */}
          <div className="space-y-4 pt-4 border-t border-border/60">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-barlow">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Local</Label>
                <Select value={form.condominioId ?? "_none"} onValueChange={(v) => setForm({ ...form, condominioId: v === "_none" ? null : v })}>
                  <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Cliente Direto</SelectItem>
                    {locais.map((l) => <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Cliente / Contato</Label>
                <Select value={form.clienteId ?? "_none"} onValueChange={(v) => setForm({ ...form, clienteId: v === "_none" ? null : v })}>
                  <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Selecione...</SelectItem>
                    {clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Endereço da Obra</Label>
              <Input value={form.endereco_obra} onChange={(e) => setForm({ ...form, endereco_obra: e.target.value })} placeholder="Local da prestação de serviço..." className="text-xs" />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Escopo / Diário de Campo</Label>
              <Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Descreva os serviços e notas técnicas..." rows={4} className="text-xs leading-relaxed" />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Observações</Label>
              <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} placeholder="Notas internas..." rows={2} className="text-xs" />
            </div>

            {/* Upload NF */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Nota Fiscal (foto/PDF)</Label>
              <label className="flex items-center gap-2 cursor-pointer border border-dashed border-border rounded-lg p-3 hover:bg-muted/40 transition-colors">
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-barlow">
                  {nfFotoPath ? `Arquivo: ${nfFotoPath.split("/").pop()}` : "Clique para anexar"}
                </span>
                <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileUpload} disabled={uploading} />
              </label>
            </div>
          </div>

          <div className="flex gap-4 pt-6 sticky bottom-0 bg-background py-4 border-t border-border">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1 font-barlow font-bold" disabled={isSaving || uploading}>CANCELAR</Button>
            <Button type="submit" className="flex-1 bg-foreground text-background hover:bg-foreground/90 font-oswald font-bold uppercase tracking-widest px-8" disabled={isSaving || uploading}>
              {isSaving || uploading ? "Aguarde..." : (isEdit ? "Salvar OS" : "Criar Ordem de Serviço")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
