import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";
import { Cliente } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onClose: () => void;
  contato?: Cliente;
}

export function ContatoModal({ open, onClose, contato }: Props) {
  const { addCliente, updateCliente, funcionarios } = useApp();
  const isEdit = !!contato;
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    tipo: "pessoa_fisica" as Cliente["tipo"],
    cpf_cnpj: "",
    telefone: "",
    email: "",
    observacoes: "",
    responsavel_id: "",
  });

  useEffect(() => {
    if (contato) {
      setForm({
        nome: contato.nome, tipo: contato.tipo, cpf_cnpj: contato.cpf_cnpj,
        telefone: contato.telefone, email: contato.email, observacoes: contato.observacoes,
        responsavel_id: contato.responsavel_id ?? "",
      });
    } else {
      setForm({ nome: "", tipo: "pessoa_fisica", cpf_cnpj: "", telefone: "", email: "", observacoes: "", responsavel_id: "" });
    }
  }, [contato, open]);

  // Mostra membros ativos da equipe; mantém o atual mesmo se inativo.
  const equipe = funcionarios.filter((f) => f.ativo || f.id === form.responsavel_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    try {
      const payload = { ...form, responsavel_id: form.responsavel_id || null };
      let success = false;
      if (isEdit && contato) {
        success = await updateCliente(contato.id, payload);
      } else {
        const id = await addCliente(payload);
        success = !!id;
      }
      if (success) onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro inesperado ao salvar.";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent onInteractOutside={(e) => e.preventDefault()} className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Contato" : "Novo Contato"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nome *</Label>
            <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome completo ou razão social" required />
          </div>

          <div className="space-y-1.5">
            <Label>Tipo *</Label>
            <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v as Cliente["tipo"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sindico">Síndico</SelectItem>
                <SelectItem value="pessoa_fisica">Pessoa Física</SelectItem>
                <SelectItem value="empresa">Empresa</SelectItem>
                <SelectItem value="administradora">Administradora</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Responsável</Label>
            <Select
              value={form.responsavel_id || "none"}
              onValueChange={(v) => setForm({ ...form, responsavel_id: v === "none" ? "" : v })}
            >
              <SelectTrigger><SelectValue placeholder="Sem responsável" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Sem responsável —</SelectItem>
                {equipe.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>CPF/CNPJ</Label>
            <Input value={form.cpf_cnpj} onChange={(e) => setForm({ ...form, cpf_cnpj: e.target.value })} placeholder="000.000.000-00" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(11) 99999-9999" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Observações</Label>
            <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} placeholder="Informações adicionais..." rows={3} />
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Salvando..." : (isEdit ? "Salvar" : "Criar Contato")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
