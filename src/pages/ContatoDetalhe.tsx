import { formatCurrency, formatDate } from "@/lib/utils";
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2, Phone, Mail, Wrench, Building2, DollarSign, UserCircle } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { TipoContatoBadge, PagamentoBadge } from "@/components/shared/Badges";
import { OrcamentoModal } from "@/components/modals/OrcamentoModal";
import { OrcamentoStatusBadge } from "@/components/shared/Badges";
import { ContatoModal } from "@/components/modals/ContatoModal";

export default function ContatoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { clientes: contatos, locais, trabalhos, orcamentos, funcionarios, deleteCliente: deleteContato } = useApp();
  const [editOpen, setEditOpen] = useState(false);
  const [orcamentoOpen, setOrcamentoOpen] = useState(false);

  const contato = contatos.find((c) => c.id === id);
  if (!contato) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
        <p>Contato não encontrado.</p>
        <Button variant="outline" onClick={() => navigate("/contatos")}>Voltar</Button>
      </div>
    );
  }

  const contatoCondominios = locais.filter((_l) => false);
  const contatoTrabalhos = trabalhos.filter((t) => t.clienteId === id || t.sindicoId === id);
  const contatoOrcamentos = orcamentos.filter((o) => o.clienteId === id || o.sindicoId === id);
  
  const totalValorZ = contatoTrabalhos.reduce((s, t) => s + t.valor, 0);

  const handleDelete = () => {
    if (confirm("Excluir este contato?")) {
      deleteContato(contato.id);
      navigate("/contatos");
    }
  };

  return (
    <div className="space-y-5 animate-slide-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/contatos")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{contato.nome}</h1>
            <TipoContatoBadge tipo={contato.tipo} />
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)} className="gap-1.5">
          <Pencil className="h-3.5 w-3.5" /> Editar
        </Button>
        <Button variant="outline" size="sm" onClick={handleDelete} className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/5">
          <Trash2 className="h-3.5 w-3.5" /> Excluir
        </Button>
      </div>

      {/* Info */}
      <div className="bg-card rounded-xl border border-border p-5 shadow-card">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {contato.telefone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{contato.telefone}</span>
            </div>
          )}
          {contato.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{contato.email}</span>
            </div>
          )}
          {contato.cpf_cnpj && (
            <div>
              <p className="text-xs text-muted-foreground">CPF/CNPJ</p>
              <p className="text-sm">{contato.cpf_cnpj}</p>
            </div>
          )}
          {contato.responsavel_id && (
            <div className="flex items-center gap-2 text-sm">
              <UserCircle className="h-4 w-4 text-muted-foreground" />
              <span>
                <span className="text-muted-foreground">Responsável: </span>
                {funcionarios.find((f) => f.id === contato.responsavel_id)?.nome ?? "—"}
              </span>
            </div>
          )}
          {contato.observacoes && (
            <div className="col-span-full">
              <p className="text-xs text-muted-foreground mb-1">Observações</p>
              <p className="text-sm">{contato.observacoes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Condominios */}
      {contatoCondominios.length > 0 && (
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Condomínios ({contatoCondominios.length})</h2>
          </div>
          <ul className="divide-y divide-border">
            {contatoCondominios.map((c) => (
              <li
                key={c.id}
                onClick={() => navigate(`/locais/${c.id}`)}
                className="flex items-center gap-3 px-5 py-3 hover:bg-muted/40 cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{c.nome}</p>
                  <p className="text-xs text-muted-foreground">{c.endereco}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Trabalhos */}
      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
          <Wrench className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold text-sm">Trabalhos ({contatoTrabalhos.length})</h2>
        </div>
        {contatoTrabalhos.length === 0 ? (
          <p className="text-sm text-muted-foreground p-5">Nenhum trabalho relacionado.</p>
        ) : (
          <ul className="divide-y divide-border">
            {contatoTrabalhos.map((t) => (
              <li
                key={t.id}
                onClick={() => navigate(`/os/${t.id}`)}
                className="flex items-center gap-3 px-5 py-3 hover:bg-muted/40 cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.titulo}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(t.data)}</p>
                </div>
                <span className="text-sm font-semibold">{formatCurrency(t.valor)}</span>
                <PagamentoBadge status={t.status_pagamento} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Orcamentos */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden mb-6">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-emerald-500/5">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-600" />
            <h2 className="font-bold font-oswald uppercase text-emerald-700 tracking-wide">Orçamentos &amp; Propostas ({contatoOrcamentos.length})</h2>
          </div>
          <Button size="sm" onClick={() => setOrcamentoOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-oswald font-bold uppercase tracking-widest text-[10px]">
             + Gerar Proposta
          </Button>
        </div>
        {contatoOrcamentos.length === 0 ? (
          <p className="text-sm font-barlow italic text-muted-foreground p-6 text-center">Nenhuma proposta gerada ainda.</p>
        ) : (
          <ul className="divide-y divide-border">
            {contatoOrcamentos.map((o) => (
              <li
                key={o.id}
                onClick={() => navigate(`/orcamentos/${o.id}`)}
                className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 cursor-pointer transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold font-oswald uppercase truncate group-hover:text-primary transition-colors">{o.titulo}</p>
                  <p className="text-[10px] text-muted-foreground font-barlow">{formatDate(o.data_emissao)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold font-oswald text-emerald-600">{formatCurrency(o.valor)}</p>
                  <div className="mt-1">
                    <OrcamentoStatusBadge status={o.status} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ContatoModal open={editOpen} onClose={() => setEditOpen(false)} contato={contato} />
      <OrcamentoModal open={orcamentoOpen} onClose={() => setOrcamentoOpen(false)} initialClienteId={contato.id} />
    </div>
  );
}
