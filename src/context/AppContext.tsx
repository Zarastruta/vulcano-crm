import { useState, useEffect, useCallback, ReactNode } from "react";
import {
  Cliente, Local, Trabalho, Orcamento, Funcionario, Ferramenta, CatalogoServico
} from "@/types";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import {
  AppContext, useApp,
  mapCliente, mapLocal, mapTrabalho, mapOrcamento, mapFuncionario, mapFerramenta, mapCatalogoServico, mapPontoDiario
} from "./AppContextTypes";
// eslint-disable-next-line react-refresh/only-export-components
export { useApp };
import { ExtendedDatabase } from "@/integrations/supabase/extended-types";

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [locais, setLocais] = useState<Local[]>([]);
  const [trabalhos, setTrabalhos] = useState<Trabalho[]>([]);
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [ferramentas, setFerramentas] = useState<Ferramenta[]>([]);
  const [catalogoServicos, setCatalogoServicos] = useState<CatalogoServico[]>([]);
  const [pontoDiario, setPontoDiario] = useState<import("@/types").PontoDiario[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  const isLoggedIn = !!user;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchClientes = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from("clientes").select("*").eq("user_id", user.id).order("criado_em", { ascending: false });
    if (!error && data) setClientes(data.map(mapCliente));
  }, [user]);

  const fetchLocais = useCallback(async () => {
    if (!user) return;
    // Tabela ainda é "condominios" no DB — renomear via SQL migration quando pronto
    const { data, error } = await supabase.from("condominios").select("*").eq("user_id", user.id).order("criado_em", { ascending: false });
    if (!error && data) setLocais(data.map(mapLocal));
  }, [user]);

  const fetchTrabalhos = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from("trabalhos").select("*").eq("user_id", user.id).order("data", { ascending: false });
    if (!error && data) setTrabalhos(data.map(mapTrabalho));
  }, [user]);

  const fetchOrcamentos = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from("orcamentos").select("*").eq("user_id", user.id).order("criado_em", { ascending: false });
    if (!error && data) setOrcamentos(data.map(mapOrcamento));
  }, [user]);

  const fetchFuncionarios = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from("funcionarios").select("*").eq("user_id", user.id).order("nome", { ascending: true });
    if (!error && data) setFuncionarios(data.map(mapFuncionario));
  }, [user]);

  const fetchFerramentas = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from("ferramentas").select("*").eq("user_id", user.id).order("nome", { ascending: true });
    if (!error && data) {
      setFerramentas(data.map(mapFerramenta));
    } else if (error?.code === "42P01") {
      console.warn("Tabela 'ferramentas' não encontrada.");
    }
  }, [user]);

  const fetchCatalogoServicos = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from("catalogo_servicos").select("*").eq("user_id", user.id).order("nome", { ascending: true });
    if (!error && data) {
      setCatalogoServicos(data.map(mapCatalogoServico));
    } else if (error?.code === "42P01") {
      console.warn("Tabela 'catalogo_servicos' não encontrada.");
    }
  }, [user]);

  const fetchPontoDiario = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from("ponto_diario").select("*").eq("user_id", user.id).order("data", { ascending: false });
    if (!error && data) {
      setPontoDiario(data.map(mapPontoDiario));
    } else if (error?.code === "42P01") {
      console.warn("Tabela 'ponto_diario' não encontrada.");
    }
  }, [user]);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);
    try {
      await Promise.all([
        fetchClientes(),
        fetchLocais(),
        fetchTrabalhos(),
        fetchOrcamentos(),
        fetchFuncionarios(),
        fetchFerramentas(),
        fetchCatalogoServicos(),
        fetchPontoDiario(),
      ]);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setDataLoading(false);
    }
  }, [user, fetchClientes, fetchLocais, fetchTrabalhos, fetchOrcamentos, fetchFuncionarios, fetchFerramentas, fetchCatalogoServicos, fetchPontoDiario]);

  useEffect(() => {
    if (user) fetchAll();
  }, [user, fetchAll]);

  const login = async (email: string, senha: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    return error ? error.message : null;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setClientes([]);
    setLocais([]);
    setTrabalhos([]);
    setOrcamentos([]);
    setFuncionarios([]);
    setFerramentas([]);
    setCatalogoServicos([]);
    setPontoDiario([]);
  };

  type TableName = keyof ExtendedDatabase["public"]["Tables"];

  const handleAdd = async <T extends TableName>(
    table: T,
    payload: ExtendedDatabase["public"]["Tables"][T]["Insert"],
    successMsg: string,
    refetch: () => Promise<void>
  ): Promise<string | false> => {
    if (!user) {
      toast.error("Sessão expirada. Faça login novamente.");
      return false;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enrichedPayload = { ...(payload as any), user_id: user.id };
    const { data, error } = await supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from(table as any)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert([enrichedPayload as any])
      .select("id")
      .single();
    if (error) {
      toast.error(error.message);
      return false;
    }
    toast.success(successMsg);
    refetch();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any)?.id;
  };

  const handleUpdate = async <T extends TableName>(
    table: T,
    id: string,
    payload: ExtendedDatabase["public"]["Tables"][T]["Update"],
    successMsg: string,
    refetch: () => Promise<void>
  ): Promise<boolean> => {
    if (!user) { toast.error("Sessão expirada. Faça login novamente."); return false; }
    const { error } = await supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from(table as any)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update(payload as any)
      .eq("id", id);
    if (error) { toast.error(error.message); return false; }
    toast.success(successMsg); refetch(); return true; 
  };

  const handleDelete = async (table: TableName, id: string, successMsg: string, refetch: () => Promise<void>): Promise<boolean> => {
    if (!user) { toast.error("Sessão expirada. Faça login novamente."); return false; }
    const { error } = await supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from(table as any)
      .delete()
      .eq("id", id);
    if (error) { toast.error(error.message); return false; }
    toast.success(successMsg); refetch(); return true;
  };

  return (
    <AppContext.Provider
      value={{
        isLoggedIn, user, loading, dataLoading, login, logout,
        clientes, 
        addCliente: (c) => handleAdd("clientes", c, "Cliente criado!", fetchClientes),
        updateCliente: (id, c) => handleUpdate("clientes", id, c, "Cliente atualizado!", fetchClientes),
        deleteCliente: (id) => handleDelete("clientes", id, "Cliente excluído!", fetchClientes),
        refreshClientes: fetchClientes,

        locais,
        addLocal: (c) => handleAdd("condominios", c, "Local criado!", fetchLocais),
        updateLocal: (id, c) => handleUpdate("condominios", id, c, "Local atualizado!", fetchLocais),
        deleteLocal: (id) => handleDelete("condominios", id, "Local excluído!", fetchLocais),
        refreshLocais: fetchLocais,

        trabalhos, 
        addTrabalho: ({ condominioId, clienteId, sindicoId, ...t }) => handleAdd("trabalhos", { ...t, condominio_id: condominioId, cliente_id: clienteId, sindico_id: sindicoId }, "Trabalho criado!", fetchTrabalhos),
        updateTrabalho: (id, { condominioId, clienteId, sindicoId, ...t }) => handleUpdate("trabalhos", id, { 
          ...t, 
          ...(condominioId !== undefined && { condominio_id: condominioId }),
          ...(clienteId !== undefined && { cliente_id: clienteId }),
          ...(sindicoId !== undefined && { sindico_id: sindicoId })
        }, "Trabalho atualizado!", fetchTrabalhos),
        deleteTrabalho: (id) => handleDelete("trabalhos", id, "Trabalho excluído!", fetchTrabalhos),
        refreshTrabalhos: fetchTrabalhos,

        orcamentos, 
        addOrcamento: ({ condominioId, clienteId, sindicoId, trabalhoId, ...o }) => handleAdd("orcamentos", { ...o, condominio_id: condominioId, cliente_id: clienteId, sindico_id: sindicoId, trabalho_id: trabalhoId }, "Orçamento criado!", fetchOrcamentos),
        updateOrcamento: (id, { condominioId, clienteId, sindicoId, trabalhoId, ...o }) => handleUpdate("orcamentos", id, { 
          ...o,
          ...(condominioId !== undefined && { condominio_id: condominioId }),
          ...(clienteId !== undefined && { cliente_id: clienteId }),
        ...(sindicoId !== undefined && { sindico_id: sindicoId }),
          ...(trabalhoId !== undefined && { trabalho_id: trabalhoId })
        }, "Orçamento atualizado!", fetchOrcamentos),
        batchUpdateOrcamentosStatus: async (ids, status) => {
          if (!ids.length) return;
          const { error } = await supabase
            .from("orcamentos")
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .update({ status: status as any })
            .in("id", ids);
          if (error) { toast.error(error.message); }
          else { fetchOrcamentos(); }
        },
        deleteOrcamento: (id) => handleDelete("orcamentos", id, "Orçamento excluído!", fetchOrcamentos),
        refreshOrcamentos: fetchOrcamentos,

        funcionarios, 
        addFuncionario: (f) => handleAdd("funcionarios", f, "Funcionário criado!", fetchFuncionarios),
        updateFuncionario: (id, f) => handleUpdate("funcionarios", id, f, "Funcionário atualizado!", fetchFuncionarios),
        deleteFuncionario: (id) => handleDelete("funcionarios", id, "Funcionário excluído!", fetchFuncionarios),
        refreshFuncionarios: fetchFuncionarios,

        ferramentas,
        addFerramenta: (f) => handleAdd("ferramentas", f, "Ferramenta cadastrada!", fetchFerramentas),
        updateFerramenta: (id, f) => handleUpdate("ferramentas", id, f, "Ferramenta atualizada!", fetchFerramentas),
        deleteFerramenta: (id) => handleDelete("ferramentas", id, "Ferramenta excluída!", fetchFerramentas),
        refreshFerramentas: fetchFerramentas,

        catalogoServicos,
        addCatalogoServico: (s) => handleAdd("catalogo_servicos", s, "Serviço adicionado ao catálogo!", fetchCatalogoServicos),
        updateCatalogoServico: (id, s) => handleUpdate("catalogo_servicos", id, s, "Catálogo atualizado!", fetchCatalogoServicos),
        deleteCatalogoServico: (id) => handleDelete("catalogo_servicos", id, "Serviço removido do catálogo!", fetchCatalogoServicos),
        refreshCatalogoServicos: fetchCatalogoServicos,

        pontoDiario,
        addPontoDiario: (p) => handleAdd("ponto_diario", p, "Ponto registrado!", fetchPontoDiario),
        updatePontoDiario: (id, p) => handleUpdate("ponto_diario", id, p, "Ponto atualizado!", fetchPontoDiario),
        deletePontoDiario: (id) => handleDelete("ponto_diario", id, "Ponto removido!", fetchPontoDiario),
        refreshPontoDiario: fetchPontoDiario,

        refreshAll: fetchAll,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

