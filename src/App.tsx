import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useApp } from "@/context/AppContext";
import { Layout } from "@/components/Layout";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Lazy loaded components
const Login = lazy(() => import("@/pages/Login"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Trabalhos = lazy(() => import("@/pages/Trabalhos"));
const TrabalhoDetalhe = lazy(() => import("@/pages/TrabalhoDetalhe"));
const Orcamentos = lazy(() => import("@/pages/Orcamentos"));
const OrcamentoDetalhe = lazy(() => import("@/pages/OrcamentoDetalhe"));
const Locais = lazy(() => import("@/pages/Locais"));
const LocalDetalhe = lazy(() => import("@/pages/LocalDetalhe"));
const Clientes = lazy(() => import("@/pages/Clientes"));
const ClienteDetalhe = lazy(() => import("@/pages/ContatoDetalhe"));
const Financeiro = lazy(() => import("@/pages/Financeiro"));
const Equipe = lazy(() => import("@/pages/Equipe"));
const Ferramentas = lazy(() => import("@/pages/Ferramentas"));
const CatalogoServicos = lazy(() => import("./pages/CatalogoServicos"));
const ControleDiario = lazy(() => import("@/pages/ControleDiario"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient();

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useApp();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function LoginGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useApp();
  if (loading) return <PageLoader />;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<LoginGuard><Login /></LoginGuard>} />
        <Route element={<AuthGuard><Layout /></AuthGuard>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/os" element={<Trabalhos />} />
          <Route path="/os/:id" element={<TrabalhoDetalhe />} />
          <Route path="/orcamentos" element={<Orcamentos />} />
          <Route path="/orcamentos/:id" element={<OrcamentoDetalhe />} />
          <Route path="/locais" element={<Locais />} />
          <Route path="/locais/:id" element={<LocalDetalhe />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/clientes/:id" element={<ClienteDetalhe />} />
          <Route path="/financeiro" element={<Financeiro />} />
          <Route path="/equipe" element={<Equipe />} />
          <Route path="/ferramentas" element={<Ferramentas />} />
          <Route path="/catalogo" element={<CatalogoServicos />} />
          <Route path="/ponto" element={<ControleDiario />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ErrorBoundary>
        <AppProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AppProvider>
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
