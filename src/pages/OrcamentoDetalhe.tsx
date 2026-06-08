import { formatCurrency, formatDate } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Pencil, Trash2, Building2, User, Calendar,
  MapPin, FileText, ArrowRight, Download, CreditCard, Clock,
  ShieldAlert, ClipboardList, Package
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { OrcamentoStatusBadge } from "@/components/shared/Badges";
import { OrcamentoModal } from "@/components/modals/OrcamentoModal";
import { printOrcamento } from "@/services/OrcamentoPrint";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { OrcamentoItem } from "@/types";


export default function OrcamentoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { orcamentos, locais, clientes, deleteOrcamento, updateOrcamento, addTrabalho, refreshAll } = useApp();
  const [editOpen, setEditOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [items, setItems] = useState<OrcamentoItem[]>([]);
  const [ocultarUnitarios, setOcultarUnitarios] = useState(false);

  const orcamento = orcamentos.find((o) => o.id === id);

  useEffect(() => {
    const fetchItems = async () => {
      if (!orcamento) return;
      const { data } = await supabase.from("orcamento_itens").select("*").eq("orcamento_id", orcamento.id).order("criado_em", { ascending: true });
      if (data) setItems(data as unknown as OrcamentoItem[]);
    };
    fetchItems();
  }, [orcamento]);

  if (!orcamento) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3 font-barlow">
        <FileText className="h-10 w-10 opacity-20" />
        <p>Orçamento não encontrado.</p>
        <Button variant="outline" onClick={() => navigate("/orcamentos")}>Voltar para lista</Button>
      </div>
    );
  }

  const cond = orcamento.condominioId ? locais.find((l) => l.id === orcamento.condominioId) : undefined;
  const cliente = orcamento.clienteId ? clientes.find((c) => c.id === orcamento.clienteId) : undefined;
  const sindico = orcamento.sindicoId ? clientes.find((c) => c.id === orcamento.sindicoId) : undefined;

  const totalVenda = items.reduce((acc, it) => acc + (it.valor_unitario * it.quantidade), 0);

  const handleExportPdf = async () => {
    try {
      toast.info("Abrindo documento Vulcano para impressão / PDF...");
      // Busca os itens frescos do banco no momento da geração — evita
      // documento sem itens caso o estado ainda não tenha carregado.
      let itensDoc = items;
      const { data } = await supabase
        .from("orcamento_itens").select("*")
        .eq("orcamento_id", orcamento.id)
        .order("criado_em", { ascending: true });
      if (data && data.length) itensDoc = data as unknown as OrcamentoItem[];
      printOrcamento(orcamento, itensDoc, cliente, cond, ocultarUnitarios);
      toast.success("Use 'Salvar como PDF' no diálogo de impressão.");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Erro ao gerar documento.");
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      deleteOrcamento(orcamento.id);
      navigate("/orcamentos");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleConvert = async () => {
    if (isConverting) return;
    setIsConverting(true);
    try {
      // Calcula custo real a partir dos itens carregados
      const custoEstimado = items.reduce((acc, it) => acc + ((it.custo_unitario || 0) * (it.quantidade || 1)), 0);

      // Gera código OS sequencial (ex: OS-2026-001) com fallback
      const { data: { user: authUser } } = await supabase.auth.getUser();
      let codigo = `OS-${Date.now()}`;
      if (authUser) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: codeData } = await (supabase as any).rpc("next_os_code", { p_user_id: authUser.id });
        codigo = (codeData as string | null) ?? codigo;
      }

      const novoTrabalhoId = await addTrabalho({
        titulo: orcamento.titulo,
        descricao: orcamento.descricao,
        data: new Date().toISOString().split("T")[0],
        valor: orcamento.valor,
        status_pagamento: "nao_pago",
        status_obra: "Novo",
        codigo,
        prioridade: "Média",
        prazo: null,
        responsavel_id: null,
        status_pagamento_detalhado: "pendente",
        valor_pago: 0,
        compras_pendentes: false,
        nota_fiscal: "",
        nota_fiscal_data: null,
        nota_fiscal_hora: null,
        data_pagamento: null,
        nota_fiscal_foto_path: "",
        condominioId: orcamento.condominioId,
        clienteId: orcamento.clienteId,
        sindicoId: orcamento.sindicoId,
        endereco_obra: orcamento.endereco_obra,
        observacoes: orcamento.observacoes,
        conclusao_percentual: 0,
        etapa_atual: "Início / Mobilização",
        custo_estimado: custoEstimado,
      });

      // Copia os itens do orçamento para a OS gerada
      if (novoTrabalhoId && items.length > 0) {
        const itensPayload = items.map(it => ({
          trabalho_id: novoTrabalhoId,
          servico_id: it.servico_id ?? null,
          nome: it.nome,
          unidade: it.unidade,
          quantidade: it.quantidade,
          valor_unitario: it.valor_unitario,
          custo_unitario: it.custo_unitario ?? 0,
          funcionario_id: it.funcionario_id ?? null,
        }));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: insError } = await (supabase as any).from("trabalho_itens").insert(itensPayload);
        if (insError) {
          // Tabela pode não existir — conversão segue normalmente
          console.warn("Itens não copiados (tabela trabalho_itens pode não existir):", insError.message);
        }
      }


      await refreshAll();
      await updateOrcamento(orcamento.id, { status: "convertido" });
      toast.success(`Orçamento convertido! ${items.length} itens copiados para a OS.`);
      setConvertDialogOpen(false);
    } catch {
      toast.error("Erro ao converter orçamento.");
    } finally {
      setIsConverting(false);
    }
  };

  const canConvert = orcamento.status === "aprovado";

  return (
    <div className="space-y-6 animate-slide-in pb-10">
      {/* Action Header */}
      <div className="flex items-center gap-4 flex-wrap border-b border-border pb-5">
        <Button variant="ghost" size="icon" onClick={() => navigate("/orcamentos")} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold uppercase tracking-wider">Proposta #{orcamento.numero || orcamento.id.slice(0,5)}</span>
            <OrcamentoStatusBadge status={orcamento.status} />
          </div>
          <h1 className="text-2xl font-bold font-oswald uppercase truncate tracking-tight">{orcamento.titulo}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleExportPdf} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-oswald font-bold uppercase text-xs">
            <Download className="h-4 w-4" /> Exportar PDF
          </Button>

          {canConvert && (
            <Button size="sm" onClick={() => setConvertDialogOpen(true)} className="gap-2 font-oswald font-bold uppercase text-xs">
              <ArrowRight className="h-4 w-4" /> Converter p/ Obra
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)} className="h-9 w-9 p-0">
            <Pencil className="h-4 w-4" />
          </Button>

          <Button variant="ghost" size="sm" onClick={() => setDeleteDialogOpen(true)} className="text-destructive h-9 w-9 p-0">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">

          {/* Informações da Proposta */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <h2 className="text-sm font-bold font-oswald uppercase text-muted-foreground mb-4 tracking-wide border-b border-border pb-2">Informações da Proposta</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {cond && (
                  <InfoRow icon={Building2} label="Local/Condomínio">
                    <button onClick={() => navigate(`/locais/${cond.id}`)} className="text-primary font-bold hover:underline text-sm font-barlow">
                      {cond.nome}
                    </button>
                  </InfoRow>
                )}
                {cliente && (
                  <InfoRow icon={User} label="Cliente">
                    <button onClick={() => navigate(`/clientes/${cliente.id}`)} className="text-primary font-bold hover:underline text-sm font-barlow">
                      {cliente.nome}
                    </button>
                  </InfoRow>
                )}
                {sindico && (
                  <InfoRow icon={User} label="Síndico">
                    <button onClick={() => navigate(`/clientes/${sindico.id}`)} className="text-primary font-bold hover:underline text-sm font-barlow">
                      {sindico.nome}
                    </button>
                  </InfoRow>
                )}
                <InfoRow icon={MapPin} label="Endereço da Obra">
                  <span className="text-sm font-barlow text-muted-foreground">{orcamento.endereco_obra || "Endereço não especificado"}</span>
                </InfoRow>
              </div>

              <div className="space-y-4">
                <InfoRow icon={Calendar} label="Data de Emissão">
                  <span className="text-sm font-barlow font-bold">{formatDate(orcamento.data_emissao)}</span>
                </InfoRow>
                {orcamento.validade && (
                  <InfoRow icon={Calendar} label="Validade Proposta">
                    <span className="text-sm font-barlow font-bold text-orange-600">{formatDate(orcamento.validade)}</span>
                  </InfoRow>
                )}
                {orcamento.data_prevista_inicio && (
                  <InfoRow icon={Calendar} label="Previsão de Início">
                    <span className="text-sm font-barlow font-bold">{formatDate(orcamento.data_prevista_inicio)}</span>
                  </InfoRow>
                )}
                {orcamento.trabalhoId && (
                  <InfoRow icon={FileText} label="Ordem de Serviço vinculada">
                    <button onClick={() => navigate(`/trabalhos/${orcamento.trabalhoId}`)} className="text-emerald-600 font-bold hover:underline text-xs uppercase font-oswald flex items-center gap-1">
                      Visualizar OS <ArrowRight className="h-3 w-3" />
                    </button>
                  </InfoRow>
                )}
              </div>
            </div>
          </div>

          {/* Escopo Técnico */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <h2 className="text-sm font-bold font-oswald uppercase text-muted-foreground mb-3 tracking-wide">Escopo Técnico</h2>
            <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
              <p className="text-sm font-barlow leading-relaxed whitespace-pre-wrap">{orcamento.descricao || "Nenhum detalhe técnico informado."}</p>
            </div>
          </div>

          {/* Tabela de Serviços */}
          {items.length > 0 && (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
                <h2 className="text-sm font-bold font-oswald uppercase text-muted-foreground tracking-wide flex items-center gap-2">
                  <Package className="h-4 w-4" /> Serviços / Itens ({items.length})
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm font-barlow">
                  <thead>
                    <tr className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border">
                      <th className="text-left pb-2 pr-4">Serviço</th>
                      <th className="text-center pb-2 px-2 w-16">Un</th>
                      <th className="text-center pb-2 px-2 w-16">Qtd</th>
                      {!ocultarUnitarios && (
                        <th className="text-right pb-2 px-3 w-32">Valor Unit.</th>
                      )}
                      <th className="text-right pb-2 pl-3 w-32">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {items.map((it) => (
                      <tr key={it.id} className="hover:bg-muted/20">
                        <td className="py-2.5 pr-4 font-medium">{it.nome}</td>
                        <td className="py-2.5 px-2 text-center text-muted-foreground text-xs uppercase">{it.unidade}</td>
                        <td className="py-2.5 px-2 text-center">{it.quantidade}</td>
                        {!ocultarUnitarios && (
                          <td className="py-2.5 px-3 text-right text-muted-foreground">{formatCurrency(it.valor_unitario)}</td>
                        )}
                        <td className="py-2.5 pl-3 text-right font-bold font-oswald">{formatCurrency(it.valor_unitario * it.quantidade)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-border">
                      <td colSpan={ocultarUnitarios ? 3 : 4} className="pt-3 text-right text-xs font-bold uppercase tracking-widest text-muted-foreground font-barlow pr-3">
                        Total da Proposta
                      </td>
                      <td className="pt-3 pl-3 text-right font-oswald font-bold text-lg text-primary">
                        {formatCurrency(totalVenda)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Condições Comerciais */}
          {(orcamento.condicoes_pagamento || orcamento.prazo_execucao) && (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <h2 className="text-sm font-bold font-oswald uppercase text-muted-foreground mb-4 tracking-wide border-b border-border pb-2 flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> Condições Comerciais
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {orcamento.condicoes_pagamento && (
                  <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-1 font-barlow">
                      <CreditCard className="h-3 w-3" /> Pagamento
                    </p>
                    <p className="text-sm font-barlow leading-relaxed">{orcamento.condicoes_pagamento}</p>
                  </div>
                )}
                {orcamento.prazo_execucao && (
                  <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-1 font-barlow">
                      <Clock className="h-3 w-3" /> Prazo de Execução
                    </p>
                    <p className="text-sm font-barlow leading-relaxed">{orcamento.prazo_execucao}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Cláusulas de Proteção */}
          {(orcamento.exclusoes || orcamento.responsabilidades) && (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <h2 className="text-sm font-bold font-oswald uppercase text-muted-foreground mb-4 tracking-wide border-b border-border pb-2 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" /> Cláusulas de Proteção
              </h2>
              <div className="space-y-4">
                {orcamento.exclusoes && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-destructive/70 mb-1.5 font-barlow flex items-center gap-1">
                      <ShieldAlert className="h-3 w-3" /> O que NÃO está incluso
                    </p>
                    <div className="bg-destructive/5 border border-destructive/15 p-4 rounded-xl">
                      <p className="text-sm font-barlow leading-relaxed whitespace-pre-wrap">{orcamento.exclusoes}</p>
                    </div>
                  </div>
                )}
                {orcamento.responsabilidades && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70 mb-1.5 font-barlow flex items-center gap-1">
                      <ClipboardList className="h-3 w-3" /> Responsabilidades do Contratante
                    </p>
                    <div className="bg-primary/5 border border-primary/15 p-4 rounded-xl">
                      <p className="text-sm font-barlow leading-relaxed whitespace-pre-wrap">{orcamento.responsabilidades}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notas Internas */}
          {orcamento.observacoes && (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <h2 className="text-sm font-bold font-oswald uppercase text-muted-foreground mb-2 tracking-wide">Notas Internas</h2>
              <p className="text-xs font-barlow italic text-muted-foreground">{orcamento.observacoes}</p>
            </div>
          )}
        </div>

        {/* Sidebar direita */}
        <div className="space-y-6">
          <div className="bg-card rounded-3xl border border-border p-8 shadow-lg border-l-4 border-l-primary flex flex-col items-center text-center">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 font-barlow">Investimento Total</p>
            <h2 className="text-4xl font-bold font-oswald text-primary mb-4">{formatCurrency(orcamento.valor)}</h2>
            <div className="w-full h-px bg-border mb-6" />
            <div className="w-full">
               <OrcamentoStatusBadge status={orcamento.status} />
            </div>
            {orcamento.status === "enviado" && (
               <p className="text-[10px] text-muted-foreground mt-4 font-barlow uppercase">Aguardando Aprovação do Cliente</p>
            )}
          </div>

          <div className="bg-muted/40 p-6 rounded-2xl border border-dashed border-border text-center">
             <FileText className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
             <p className="text-xs font-bold font-oswald uppercase text-muted-foreground mb-4">Documentação Profissional</p>
             <div className="flex items-center justify-between bg-background p-3 rounded mb-3 border border-border">
               <label htmlFor="ocultar-valores" className="text-[10px] font-barlow font-bold uppercase text-muted-foreground cursor-pointer select-none">
                 Ocultar Preços Unitários
               </label>
               <button
                 id="ocultar-valores"
                 type="button"
                 role="switch"
                 aria-checked={ocultarUnitarios}
                 onClick={() => setOcultarUnitarios(!ocultarUnitarios)}
                 className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${ocultarUnitarios ? "bg-primary" : "bg-input"}`}
               >
                 <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${ocultarUnitarios ? "translate-x-4" : "translate-x-0.5"}`} />
               </button>
             </div>
             <Button onClick={handleExportPdf} variant="outline" className="w-full font-oswald font-bold uppercase text-[10px] h-8 bg-background hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200">
                Baixar Proposta Oficial PDF
             </Button>
          </div>
        </div>
      </div>

      <OrcamentoModal open={editOpen} onClose={() => setEditOpen(false)} orcamento={orcamento} />

      {/* Dialog: Converter em Obra */}
      <AlertDialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-oswald uppercase">Gerar Ordem de Serviço?</AlertDialogTitle>
            <AlertDialogDescription className="font-barlow">
              Isso criará automaticamente uma OS em "Trabalhos" com os dados desta proposta. Deseja prosseguir com a mobilização da equipe?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isConverting} className="font-barlow">Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={isConverting} onClick={handleConvert} className="font-oswald uppercase bg-primary text-primary-foreground">
               {isConverting ? "Convertendo..." : "Confirmar Mobilização"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog: Excluir Orçamento */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-oswald uppercase text-destructive">Excluir Orçamento?</AlertDialogTitle>
            <AlertDialogDescription className="font-barlow">
              Esta ação é irreversível. O orçamento <strong>#{orcamento.numero} — {orcamento.titulo}</strong> e todos os seus itens serão excluídos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="font-barlow">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={handleDelete}
              className="font-oswald uppercase bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Excluindo..." : "Excluir Permanentemente"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function InfoRow({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-barlow">{label}</p>
        <div className="truncate">{children}</div>
      </div>
    </div>
  );
}
