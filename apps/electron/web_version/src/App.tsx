import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Sobre from "./pages/Sobre";
import Funcionalidades from "./pages/Funcionalidades";
import Demo from "./pages/Demo";
import CasosSucesso from "./pages/CasosSucesso";
import Precos from "./pages/Precos";
import Cameras from "./pages/Cameras";
import FAQ from "./pages/FAQ";
import Contato from "./pages/Contato";
import Arquitetura from "./pages/Arquitetura";
import Seguranca from "./pages/Seguranca";
import Implantacao from "./pages/Implantacao";
import API from "./pages/API";
import TemplatesPanel from "./pages/Admin/TemplatesPanel";
import ContactsAdmin from "./pages/Admin/ContactsAdmin";
import CoordinationDashboard from "./pages/admin/CoordinationDashboard";
import StudentPortfolio from "./pages/admin/StudentPortfolio";
import LgpdCompliance from "./pages/admin/LgpdCompliance";
import Vendas from "./pages/Vendas";
import ExecutiveDashboard from "./pages/admin/ExecutiveDashboard";
import AnalyticsDashboard from "./pages/admin/AnalyticsDashboard";
import PortalPais from "./pages/PortalPais";
import MobileApp from "./pages/MobileApp";
import Checkout from "./pages/Checkout";
import PortalLogin from "./pages/portal/PortalLogin";
import PortalCadastro from "./pages/portal/PortalCadastro";
import PortalDashboard from "./pages/portal/PortalDashboard";
import PortalResetSenha from "./pages/portal/PortalResetSenha";
import TermoLGPD from "./pages/portal/TermoLGPD";
import PortalLGPD from "./pages/portal/PortalLGPD";
import QuotesAdmin from "./pages/admin/QuotesAdmin";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/sobre" component={Sobre} />
      <Route path="/funcionalidades" component={Funcionalidades} />
      <Route path="/demo" component={Demo} />
      <Route path="/casos-sucesso" component={CasosSucesso} />
      <Route path="/precos" component={Precos} />
      <Route path="/cameras" component={Cameras} />
      <Route path="/faq" component={FAQ} />
      <Route path="/contato" component={Contato} />
      <Route path="/arquitetura" component={Arquitetura} />
      <Route path="/seguranca" component={Seguranca} />
      <Route path="/implantacao" component={Implantacao} />
      <Route path="/api" component={API} />
      <Route path="/vendas" component={Vendas} />
      <Route path="/admin/executive" component={ExecutiveDashboard} />
      <Route path="/admin/analytics" component={AnalyticsDashboard} />
      <Route path="/portal-pais" component={PortalPais} />
      <Route path="/portal-pais/login" component={PortalLogin} />
      <Route path="/portal-pais/cadastro" component={PortalCadastro} />
      <Route path="/portal-pais/dashboard" component={PortalDashboard} />
      <Route path="/portal-pais/reset-senha" component={PortalResetSenha} />
      <Route path="/portal-pais/termo-lgpd" component={TermoLGPD} />
      <Route path="/portal-pais/lgpd" component={PortalLGPD} />
      <Route path="/mobile-app" component={MobileApp} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/admin/templates" component={TemplatesPanel} />
      <Route path="/admin/contatos" component={ContactsAdmin} />
      <Route path="/admin/coordination" component={CoordinationDashboard} />
      <Route path="/admin/portfolio/:studentId/:periodId" component={StudentPortfolio} />
      <Route path="/admin/lgpd-compliance" component={LgpdCompliance} />
      <Route path="/admin/orcamentos" component={QuotesAdmin} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
