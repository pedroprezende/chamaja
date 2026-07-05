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

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/como-funciona"} component={ConhecerApp} />
      <Route path={"/cadastro"} component={ConhecerApp} />
      <Route path={"/busca"} component={Busca} />
      <Route path={"/perfil/:id"} component={Perfil} />
      <Route path={"/parceiros"} component={Parceiro} />
      <Route path={"/parceiros/dashboard"} component={Parceiro} />
      <Route path={"/parceiro"} component={Parceiro} />
      <Route path={"/parceiro/dashboard"} component={Parceiro} />
      <Route path={"/indique"} component={Parceiro} />
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
