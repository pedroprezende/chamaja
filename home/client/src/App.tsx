import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import ConhecerApp from "./pages/ConhecerApp";
import Parceiros from "./pages/Parceiros";
import Parceiro from "./pages/Parceiro";
import Busca from "./pages/Busca";
import Perfil from "./pages/Perfil";
import IndiqueGanhe from "./pages/IndiqueGanhe";
import PublicarNecessidade from "./pages/PublicarNecessidade";
import DetalheNecessidade from "./pages/DetalheNecessidade";
import Oportunidades from "./pages/Oportunidades";
import MinhasNecessidades from "./pages/MinhasNecessidades";
import DisponibilidadeProfissional from "./pages/DisponibilidadeProfissional";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/como-funciona"} component={ConhecerApp} />
      <Route path={"/cadastro"} component={Home} />
      <Route path={"/busca"} component={Busca} />
      <Route path={"/oportunidades"} component={Oportunidades} />
      <Route path={"/encontrar-oportunidades"} component={Oportunidades} />
      <Route path={"/needs"} component={Oportunidades} />
      <Route path={"/minhas-necessidades"} component={MinhasNecessidades} />
      <Route path={"/minhas-oportunidades"} component={MinhasNecessidades} />
      <Route path={"/minhas-publicacoes"} component={MinhasNecessidades} />
      <Route path={"/disponibilidade"} component={DisponibilidadeProfissional} />
      <Route path={"/minha-disponibilidade"} component={DisponibilidadeProfissional} />
      <Route path={"/parceiro/disponibilidade"} component={DisponibilidadeProfissional} />
      <Route path={"/preciso-de-alguem"} component={PublicarNecessidade} />
      <Route path={"/publicar-necessidade"} component={PublicarNecessidade} />
      <Route path={"/necessidade/:id"} component={DetalheNecessidade} />
      <Route path={"/needs/:id"} component={DetalheNecessidade} />
      <Route path={"/perfil/:id"} component={Perfil} />
      <Route path={"/prestador/:id"} component={Perfil} />
      <Route path={"/professional/:id"} component={Perfil} />
      <Route path={"/comercio/:id"} component={Perfil} />
      <Route path={"/parceiros"} component={Parceiro} />
      <Route path={"/parceiros/dashboard"} component={Parceiro} />
      <Route path={"/parceiro"} component={Parceiro} />
      <Route path={"/parceiro/dashboard"} component={Parceiro} />
      <Route path={"/indique"} component={Parceiro} />
      <Route path={"/indique-e-ganhe"} component={IndiqueGanhe} />
      <Route path={"/indicacoes"} component={Parceiro} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
