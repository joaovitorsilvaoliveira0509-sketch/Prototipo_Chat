import { FormEvent, ReactNode, useMemo, useState } from "react";
import {
  Activity, ArrowLeft, ArrowLeftRight, BarChart3, Bell, BellRing, BookOpen,
  Bot, Building2, Check, ChevronDown, ChevronRight, CircleHelp, ClipboardList,
  Clock3, CloudOff, FileClock, FileSearch, FileWarning, Filter, Gauge,
  Headphones, History, House, Inbox, KeyRound, LayoutDashboard, LockKeyhole,
  Menu, MessageCircle, MessagesSquare, MoreHorizontal, Paperclip, Pin, Plus,
  RefreshCw, Search, Send, ServerCrash, Settings2, ShieldAlert, ShieldCheck,
  SlidersHorizontal, Sparkles, Tags, TicketCheck, TriangleAlert, UserCog,
  Users, WifiOff, Workflow,
} from "lucide-react";
import {
  Avatar, Badge, Button, Card, CardContent, CardHeader, Dialog, Input, Label,
  Progress, Select, Separator, Switch, Tabs, Text, Textarea,
} from "./components/ui";

type View =
  | "entrar" | "recuperar" | "perfil"
  | "inicio" | "notificacoes"
  | "abrir" | "minhas" | "fila" | "minha-fila" | "detalhe" | "transferencias" | "historico" | "busca"
  | "salas" | "topico" | "diretas"
  | "supervisao" | "supervisionado" | "resumo-ia" | "indicadores"
  | "pessoas" | "assuntos" | "distribuicao" | "triagem" | "sla" | "config-salas"
  | "auditoria" | "autorizacoes" | "erros";

type TicketStatus = "Aguardando" | "Em atendimento" | "Transferência pendente" | "Encerrado";
type Ticket = {
  id: string; title: string; requester: string; area: string; topic: string;
  status: TicketStatus; priority: "Alta" | "Média" | "Normal"; wait: string;
  assignee?: string; preferredAssignee?: string; preview: string; nextAction?: "Atendente" | "Solicitante";
};
type Availability = "Disponível" | "Indisponível";
type Collaborator = {
  name: string;
  role: "Gerente" | "Atendente" | "Administrador";
  sector: string;
  availability: Availability;
};

const currentUser = "Lucas Martins";
const loadStoredArray = <T,>(key: string, fallback: T[]): T[] => {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return fallback;
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed as T[] : fallback;
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
};
const collaboratorsSeed: Collaborator[] = [
  { name: "Lucas Martins", role: "Atendente", sector: "Tecnologia", availability: "Disponível" },
  { name: "Camila Melo", role: "Gerente", sector: "Tecnologia", availability: "Disponível" },
  { name: "Bruno Reis", role: "Atendente", sector: "Financeiro", availability: "Indisponível" },
  { name: "Julia Ramos", role: "Atendente", sector: "Tecnologia", availability: "Disponível" },
  { name: "Renata Dias", role: "Administrador", sector: "Pessoas", availability: "Disponível" },
  { name: "Rafael Luz", role: "Atendente", sector: "Facilities", availability: "Indisponível" },
];

const ticketsSeed: Ticket[] = [
  { id: "AT-1048", title: "Acesso ao portal de benefícios", requester: "Marina Costa", area: "Pessoas", topic: "Benefícios", status: "Aguardando", priority: "Alta", wait: "há 12 min", preview: "Não consigo acessar o demonstrativo do plano." },
  { id: "AT-1047", title: "Notebook sem acesso à VPN", requester: "Pedro Lima", area: "Tecnologia", topic: "Acessos e VPN", status: "Em atendimento", priority: "Média", wait: "há 28 min", assignee: "Lucas Martins", preview: "A conexão retorna erro de certificado desde hoje cedo." },
  { id: "AT-1046", title: "Dúvida sobre reembolso", requester: "Ana Souza", area: "Financeiro", topic: "Reembolsos", status: "Transferência pendente", priority: "Normal", wait: "há 41 min", assignee: "Bruno Reis", preview: "Preciso confirmar os documentos aceitos para viagem." },
  { id: "AT-1042", title: "Inclusão de dependente", requester: "João Alves", area: "Pessoas", topic: "Benefícios", status: "Encerrado", priority: "Normal", wait: "ontem", assignee: "Camila Melo", preview: "Solicitação concluída e documentação validada." },
  { id: "AT-1051", title: "Alteração do plano corporativo", requester: "Lucas Martins", area: "Pessoas", topic: "Benefícios", status: "Em atendimento", priority: "Normal", wait: "há 18 min", assignee: "Camila Melo", preview: "Gostaria de confirmar as opções disponíveis para alteração do plano.", nextAction: "Atendente" },
  { id: "AT-1049", title: "Liberação de acesso ao CRM", requester: "Lucas Martins", area: "Tecnologia", topic: "Acessos", status: "Aguardando", priority: "Média", wait: "há 36 min", preview: "Solicitei acesso ao painel comercial para acompanhar minha carteira.", nextAction: "Atendente" },
  { id: "AT-1045", title: "Comprovante para reembolso", requester: "Lucas Martins", area: "Financeiro", topic: "Reembolsos", status: "Em atendimento", priority: "Normal", wait: "há 2 h", assignee: "Bruno Reis", preview: "O atendente solicitou o comprovante fiscal da despesa.", nextAction: "Solicitante" },
];

const organizations = [
  { id: "vilhena", city: "Vilhena", type: "Matriz", state: "RO" },
  { id: "ji-parana", city: "Ji-Paraná", type: "Filial", state: "RO" },
  { id: "nova-lacerda", city: "Nova Lacerda", type: "Filial", state: "MT" },
  { id: "conquista-doeste", city: "Conquista d'Oeste", type: "Filial", state: "MT" },
  { id: "pontes-lacerda", city: "Pontes e Lacerda", type: "Filial", state: "MT" },
] as const;

const navGroups: Array<{ label: string; items: Array<{ id: View; label: string; icon: typeof Activity; count?: number }> }> = [
  { label: "Início", items: [
    { id: "inicio", label: "Painel inicial", icon: LayoutDashboard },
    { id: "notificacoes", label: "Notificações", icon: Bell, count: 4 },
    { id: "perfil", label: "Meu perfil e setores", icon: UserCog },
  ] },
  { label: "Atendimentos", items: [
    { id: "abrir", label: "Abrir solicitação", icon: Plus },
    { id: "minhas", label: "Minhas solicitações", icon: TicketCheck, count: 3 },
    { id: "fila", label: "Fila do setor", icon: Inbox, count: 8 },
    { id: "minha-fila", label: "Minha fila", icon: Headphones, count: 3 },
    { id: "transferencias", label: "Transferências", icon: ArrowLeftRight, count: 1 },
    { id: "historico", label: "Histórico e eventos", icon: History },
    { id: "busca", label: "Buscar atendimentos", icon: FileSearch },
  ] },
  { label: "Comunicação", items: [
    { id: "salas", label: "Salas gerais", icon: MessagesSquare, count: 2 },
    { id: "topico", label: "Tópicos paralelos", icon: MessageCircle },
    { id: "diretas", label: "Conversas", icon: LockKeyhole, count: 2 },
  ] },
  { label: "Supervisão", items: [
    { id: "supervisao", label: "Painel gerencial", icon: Activity },
    { id: "supervisionado", label: "Detalhe supervisionado", icon: ClipboardList },
    { id: "resumo-ia", label: "Resumo por IA", icon: Bot },
    { id: "indicadores", label: "Indicadores", icon: BarChart3 },
  ] },
  { label: "Administração", items: [
    { id: "pessoas", label: "Pessoas e permissões", icon: Users },
    { id: "assuntos", label: "Assuntos e fluxos", icon: Tags },
    { id: "distribuicao", label: "Filas e distribuição", icon: Workflow },
    { id: "triagem", label: "Triagem e modelos", icon: BookOpen },
    { id: "sla", label: "SLA e prioridades", icon: Clock3 },
    { id: "config-salas", label: "Salas e comunicados", icon: Settings2 },
  ] },
  { label: "Conformidade", items: [
    { id: "auditoria", label: "Auditoria", icon: ShieldCheck },
    { id: "autorizacoes", label: "Autorizações excepcionais", icon: KeyRound },
    { id: "erros", label: "Estados de erro", icon: TriangleAlert },
  ] },
];

const statusVariant = (status: TicketStatus): "warning" | "success" | "default" | "secondary" =>
  status === "Aguardando" ? "warning" : status === "Em atendimento" ? "success" : status === "Transferência pendente" ? "default" : "secondary";

const errorCases = [
  { id: "sessao", code: "401", title: "Sua sessão expirou", description: "Por segurança, sua sessão foi encerrada. Entre novamente para continuar sem perder o contexto.", guidance: "Nenhum conteúdo protegido permanece visível após a expiração.", icon: KeyRound, action: "Entrar novamente" },
  { id: "permissao", code: "403", title: "Acesso não autorizado", description: "Seu perfil não possui permissão para consultar este conteúdo ou executar esta ação.", guidance: "Solicite acesso ao responsável pelo setor caso considere necessário.", icon: ShieldAlert, action: "Voltar ao meu escopo" },
  { id: "nao-encontrado", code: "404", title: "Conteúdo não encontrado", description: "O atendimento, sala ou página pode ter sido removido, encerrado ou não estar disponível para você.", guidance: "Confira o endereço ou retorne ao painel inicial.", icon: FileSearch, action: "Ir para o início" },
  { id: "conflito", code: "409", title: "Solicitação já assumida", description: "Outro colaborador assumiu esta solicitação antes da sua confirmação.", guidance: "A fila será atualizada com o responsável e o estado atuais.", icon: ArrowLeftRight, action: "Atualizar fila" },
  { id: "validacao", code: "422", title: "Revise os dados informados", description: "Alguns campos obrigatórios estão ausentes ou possuem informações inválidas.", guidance: "Os campos com erro serão destacados sem apagar os dados já preenchidos.", icon: FileWarning, action: "Revisar formulário" },
  { id: "anexo", code: "413", title: "Não foi possível anexar o arquivo", description: "O formato não é permitido, o arquivo excede o limite ou não passou pela validação de segurança.", guidance: "O arquivo não foi publicado nem compartilhado com os participantes.", icon: Paperclip, action: "Escolher outro arquivo" },
  { id: "limite", code: "429", title: "Muitas tentativas em pouco tempo", description: "Aguarde alguns instantes antes de tentar esta ação novamente.", guidance: "Esse bloqueio temporário protege a Central contra uso indevido.", icon: Clock3, action: "Tentar novamente" },
  { id: "offline", code: "OFFLINE", title: "Você está sem conexão", description: "Não foi possível acessar a Central. Verifique sua internet e tente novamente.", guidance: "Mensagens não confirmadas permanecem como não enviadas.", icon: WifiOff, action: "Verificar conexão" },
  { id: "sincronizacao", code: "SYNC", title: "Falha ao sincronizar", description: "As informações mais recentes ainda não puderam ser carregadas neste dispositivo.", guidance: "O histórico confirmado permanece preservado no servidor.", icon: CloudOff, action: "Sincronizar novamente" },
  { id: "mensagem", code: "MSG", title: "Mensagem não enviada", description: "A mensagem não foi confirmada e não será exibida como entregue.", guidance: "O texto continua disponível para uma nova tentativa.", icon: Send, action: "Reenviar mensagem" },
  { id: "notificacao", code: "NOTIFY", title: "Notificação não entregue", description: "O aviso externo falhou, mas a solicitação continua disponível normalmente na Central.", guidance: "A falha de notificação não altera o estado do atendimento.", icon: BellRing, action: "Tentar notificar" },
  { id: "ia", code: "IA", title: "Resumo indisponível", description: "A IA não conseguiu gerar uma síntese segura para o período solicitado.", guidance: "Consulte o histórico original; nenhum resumo incompleto será apresentado.", icon: Bot, action: "Tentar novamente" },
  { id: "servidor", code: "500", title: "Algo não saiu como esperado", description: "Ocorreu um erro interno. A equipe técnica foi informada e os dados confirmados permanecem protegidos.", guidance: "Use o código de referência ERR-CT-500 ao solicitar suporte.", icon: ServerCrash, action: "Tentar novamente" },
] as const;

function App() {
  const [view, setView] = useState<View>("inicio");
  const [tickets, setTickets] = useState<Ticket[]>(() => {
    const parsed = loadStoredArray<Ticket>("comunicaon-tickets", ticketsSeed);
    const normalized = parsed.map((ticket) =>
      ticket.requester === currentUser && !ticket.nextAction
        ? { ...ticket, nextAction: ticket.status === "Encerrado" ? "Solicitante" as const : "Atendente" as const }
        : ticket,
    );
    const hasWaitingRequesterTicket = normalized.some((ticket) => ticket.requester === currentUser && ticket.nextAction === "Atendente" && ticket.status !== "Encerrado");
    return hasWaitingRequesterTicket ? normalized : [...normalized, ...ticketsSeed.filter((ticket) => ticket.requester === currentUser)];
  });
  const [collaborators, setCollaborators] = useState<Collaborator[]>(() => loadStoredArray("connect-collaborators", collaboratorsSeed));
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [navigationHistory, setNavigationHistory] = useState<View[]>([]);
  const [mobileNav, setMobileNav] = useState(false);
  const [organizationOpen, setOrganizationOpen] = useState(false);
  const [organizationId, setOrganizationId] = useState(() => localStorage.getItem("connect-organization") ?? "vilhena");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [toast, setToast] = useState("");
  const activeOrganization = organizations.find((organization) => organization.id === organizationId) ?? organizations[0];
  const activeCollaborator = collaborators.find((collaborator) => collaborator.name === currentUser) ?? collaboratorsSeed[0];

  const navigate = (next: View) => {
    if (next !== view) {
      setNavigationHistory((current) => [...current, view].slice(-20));
    }
    setView(next);
    setSelected(null);
    setMobileNav(false);
    setOrganizationOpen(false);
  };
  const goBack = () => {
    if (selected) {
      setSelected(null);
      return;
    }
    setNavigationHistory((current) => {
      const nextHistory = [...current];
      const previous = nextHistory.pop() ?? "inicio";
      setView(previous);
      setMobileNav(false);
      setOrganizationOpen(false);
      return nextHistory;
    });
  };
  const selectOrganization = (id: string) => {
    const organization = organizations.find((item) => item.id === id);
    if (!organization) return;
    setOrganizationId(id);
    localStorage.setItem("connect-organization", id);
    setOrganizationOpen(false);
    notify(`Unidade ${organization.city} selecionada.`);
  };
  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };
  const persist = (next: Ticket[]) => {
    setTickets(next);
    localStorage.setItem("comunicaon-tickets", JSON.stringify(next));
  };
  const updateAvailability = (name: string, availability: Availability) => {
    const next = collaborators.map((collaborator) => collaborator.name === name ? { ...collaborator, availability } : collaborator);
    setCollaborators(next);
    localStorage.setItem("connect-collaborators", JSON.stringify(next));
    notify(`${name} agora está ${availability.toLowerCase()}.`);
  };
  const takeTicket = (ticket: Ticket) => {
    if (activeCollaborator.availability !== "Disponível") {
      notify("Altere seu status para Disponível antes de assumir um atendimento.");
      return;
    }
    if (ticket.requester === currentUser) {
      notify("Você não pode assumir uma solicitação aberta por você.");
      return;
    }
    const updated: Ticket = { ...ticket, status: "Em atendimento", assignee: currentUser, nextAction: "Solicitante" };
    persist(tickets.map((item) => item.id === ticket.id ? updated : item));
    setSelected(updated);
    notify(`${ticket.id} atribuído a você.`);
  };
  const updateTicket = (ticket: Ticket) => {
    persist(tickets.map((item) => item.id === ticket.id ? ticket : item));
    setSelected(ticket);
  };

  if (view === "entrar" || view === "recuperar") {
    return <AuthScreen recovery={view === "recuperar"} onNavigate={navigate} />;
  }

  return <div className="app-shell">
    <aside className={`app-sidebar ${mobileNav ? "is-open" : ""}`}>
      <div className="brand-lockup"><img src="/brand/connect-telecom-transparent.svg" alt="Connect Telecom" /></div>
      <div className="organization-switcher">
        <Button variant="outline" className="workspace-switcher" onClick={() => setOrganizationOpen(!organizationOpen)} aria-expanded={organizationOpen} aria-haspopup="listbox">
          <span className="workspace-avatar"><Building2 /></span>
          <span><small>{activeOrganization.type} · {activeOrganization.state}</small><strong>{activeOrganization.city}</strong></span>
          <ChevronDown className={organizationOpen ? "is-open" : ""} />
        </Button>
        {organizationOpen && <Card className="organization-menu" role="listbox" aria-label="Organizações Connect Telecom">
          <CardHeader><div><Text as="h2">Organizações</Text><Text>Selecione a unidade de trabalho</Text></div></CardHeader>
          <CardContent>{organizations.map((organization) => <Button key={organization.id} variant="ghost" className={organization.id === activeOrganization.id ? "is-active" : ""} onClick={() => selectOrganization(organization.id)} role="option" aria-selected={organization.id === activeOrganization.id}>
            <span className="organization-icon"><Building2 /></span>
            <span><strong>{organization.city}</strong><small>Connect Telecom · {organization.state}</small></span>
            <Badge variant={organization.type === "Matriz" ? "default" : "secondary"}>{organization.type}</Badge>
            {organization.id === activeOrganization.id && <Check />}
          </Button>)}</CardContent>
        </Card>}
      </div>
      <div className="sidebar-scroll">
        {navGroups.map((group) => <div className="nav-group" key={group.label}>
          <Text as="small" className="nav-label">{group.label}</Text>
          {group.items.map((item) => {
            const Icon = item.icon;
            const dynamicCount = item.id === "minhas"
              ? tickets.filter((ticket) => ticket.requester === currentUser && ticket.nextAction === "Atendente" && ticket.status !== "Encerrado").length
              : item.id === "minha-fila"
                ? tickets.filter((ticket) => ticket.assignee === currentUser && ticket.status !== "Encerrado").length
                : item.id === "fila"
                  ? tickets.filter((ticket) => ticket.area === activeCollaborator.sector && ticket.status === "Aguardando").length
                  : item.count;
            return <Button key={item.id} variant="ghost" className={`nav-item ${view === item.id ? "is-active" : ""}`} onClick={() => navigate(item.id)}>
              <Icon /><span>{item.label}</span>{dynamicCount !== undefined && <Badge variant="secondary">{dynamicCount}</Badge>}
            </Button>;
          })}
        </div>)}
      </div>
      <div className="sidebar-footer">
        <Button variant="ghost" className="nav-item"><CircleHelp /><span>Ajuda e documentação</span></Button>
        <Separator />
        <Button variant="ghost" className="account-button" onClick={() => navigate("perfil")}><span className="availability-avatar"><Avatar name={currentUser} /><i className={activeCollaborator.availability === "Disponível" ? "is-available" : "is-unavailable"} /></span><span><strong>{currentUser}</strong><small>{activeCollaborator.availability} · Tecnologia</small></span><MoreHorizontal /></Button>
      </div>
    </aside>
    {mobileNav && <Button variant="ghost" className="mobile-overlay" aria-label="Fechar menu" onClick={() => setMobileNav(false)} />}

    <main className="app-main">
      <header className="app-header">
        <Button variant="outline" size="icon" className="mobile-trigger" onClick={() => setMobileNav(true)} aria-label="Abrir menu"><Menu /></Button>
        {(selected || view !== "inicio") && <Button variant="outline" className="header-back" onClick={goBack} aria-label="Voltar para a tela anterior"><ArrowLeft /><span>Voltar</span></Button>}
        <div className="command-search"><Search /><Input placeholder="Buscar em toda a Central..." aria-label="Busca global" /><kbd>⌘ K</kbd></div>
        <Button variant="outline" size="icon" className="notification-trigger" onClick={() => setNotificationsOpen(true)} aria-label="Notificações"><Bell /><span /></Button>
        <Button onClick={() => navigate("abrir")}><Plus /> Nova solicitação</Button>
      </header>
      <div className="app-content">
        {selected
          ? <TicketDetail ticket={selected} onBack={goBack} onUpdate={updateTicket} notify={notify} supervised={view === "supervisionado"} />
          : <ScreenRouter view={view} tickets={tickets} collaborators={collaborators} onAvailabilityChange={updateAvailability} onTake={takeTicket} onNavigate={navigate} onOpen={setSelected} onCreate={(ticket) => { persist([ticket, ...tickets]); navigate("minhas"); notify(`${ticket.id} criada com sucesso.`); }} notify={notify} />}
      </div>
    </main>

    <Dialog open={notificationsOpen} title="Central de notificações" description="Atualizações do seu escopo e das suas conversas." onClose={() => setNotificationsOpen(false)}>
      <NotificationList onOpen={(ticket) => { setNotificationsOpen(false); setSelected(ticket); }} tickets={tickets} />
    </Dialog>
    {toast && <div className="toast"><Check />{toast}</div>}
  </div>;
}

function ScreenRouter({ view, tickets, collaborators, onAvailabilityChange, onTake, onNavigate, onOpen, onCreate, notify }: {
  view: View; tickets: Ticket[]; collaborators: Collaborator[]; onAvailabilityChange: (name: string, availability: Availability) => void;
  onTake: (ticket: Ticket) => void; onNavigate: (view: View) => void; onOpen: (ticket: Ticket) => void; onCreate: (ticket: Ticket) => void; notify: (message: string) => void;
}) {
  if (view === "inicio") return <Dashboard tickets={tickets} collaborators={collaborators} onNavigate={onNavigate} onOpen={onOpen} />;
  if (view === "notificacoes") return <Page title="Central de notificações" description="Mensagens, atribuições e mudanças de estado sem exposição de conteúdo sensível."><Card><NotificationList tickets={tickets} onOpen={onOpen} /></Card></Page>;
  if (view === "perfil") return <ProfileScreen availability={collaborators.find((collaborator) => collaborator.name === currentUser)?.availability ?? "Indisponível"} onAvailabilityChange={(availability) => onAvailabilityChange(currentUser, availability)} notify={notify} onNavigate={onNavigate} />;
  if (view === "abrir") return <NewRequest collaborators={collaborators} onCreate={onCreate} />;
  if (["minhas", "fila", "minha-fila"].includes(view)) {
    const filtered = view === "minhas"
      ? tickets.filter((ticket) => ticket.requester === currentUser && ticket.nextAction === "Atendente" && ticket.status !== "Encerrado")
      : view === "minha-fila"
        ? tickets.filter((ticket) => ticket.assignee === currentUser && ticket.status !== "Encerrado")
        : tickets.filter((ticket) => ticket.area === (collaborators.find((collaborator) => collaborator.name === currentUser)?.sector ?? "Tecnologia") && ticket.status !== "Encerrado");
    const title = view === "minhas" ? "Minhas solicitações" : view === "minha-fila" ? "Minha fila de atendimento" : "Fila do setor";
    const description = view === "minhas"
      ? "Solicitações iniciadas por você que aguardam resposta do colaborador responsável."
      : "Prioridades, estados e responsáveis dentro do seu escopo.";
    return <TicketQueue title={title} description={description} tickets={filtered} onOpen={onOpen} onTake={view === "fila" ? onTake : undefined} />;
  }
  if (view === "transferencias") return <Transfers tickets={tickets} onOpen={onOpen} notify={notify} />;
  if (view === "historico") return <EventHistory tickets={tickets} />;
  if (view === "busca") return <SearchScreen tickets={tickets} onOpen={onOpen} />;
  if (view === "salas") return <Rooms mode="room" notify={notify} />;
  if (view === "topico") return <Rooms mode="thread" notify={notify} />;
  if (view === "diretas") return <DirectMessages notify={notify} />;
  if (view === "supervisao") return <Supervision tickets={tickets} onOpen={onOpen} onNavigate={onNavigate} />;
  if (view === "supervisionado") return <SupervisedDetail ticket={tickets[1]} onOpen={onOpen} />;
  if (view === "resumo-ia") return <AISummary notify={notify} />;
  if (view === "indicadores") return <Indicators />;
  if (["pessoas", "assuntos", "distribuicao", "triagem", "sla", "config-salas"].includes(view)) return <AdminScreen type={view as "pessoas" | "assuntos" | "distribuicao" | "triagem" | "sla" | "config-salas"} collaborators={collaborators} onAvailabilityChange={onAvailabilityChange} notify={notify} />;
  if (view === "auditoria") return <Audit />;
  if (view === "erros") return <ErrorStates onNavigate={onNavigate} notify={notify} />;
  return <ExceptionalAccess notify={notify} />;
}

function Page({ title, description, eyebrow, actions, children }: { title: string; description: string; eyebrow?: string; actions?: ReactNode; children: ReactNode }) {
  return <>
    <div className="page-heading">
      <div>{eyebrow && <Text as="small" className="eyebrow">{eyebrow}</Text>}<Text as="h1">{title}</Text><Text>{description}</Text></div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
    {children}
  </>;
}

function SectionTitle({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <CardHeader><div><Text as="h2">{title}</Text>{description && <Text>{description}</Text>}</div>{action}</CardHeader>;
}

function Dashboard({ tickets, collaborators, onNavigate, onOpen }: { tickets: Ticket[]; collaborators: Collaborator[]; onNavigate: (view: View) => void; onOpen: (ticket: Ticket) => void }) {
  const metrics = [
    { label: "Aguardando no setor", value: "8", meta: "3 com prioridade alta", icon: Inbox },
    { label: "Em atendimento", value: "12", meta: "3 atribuídos a você", icon: Headphones },
    { label: "Prazo próximo", value: "4", meta: "Nas próximas 2 horas", icon: Clock3 },
    { label: "Resolvidos hoje", value: "19", meta: "12% acima de ontem", icon: Check },
  ];
  return <Page eyebrow="TERÇA-FEIRA, 27 DE OUTUBRO" title="Bom dia, Lucas" description="Aqui está o que precisa da sua atenção hoje." actions={<Button variant="outline"><SlidersHorizontal /> Personalizar</Button>}>
    <div className="metric-grid">{metrics.map(({ label, value, meta, icon: Icon }) => <Card className="metric-card" key={label}><CardContent><div className="metric-label"><Icon /><Text as="span">{label}</Text></div><Text as="strong">{value}</Text><Text as="small">{meta}</Text></CardContent></Card>)}</div>
    <div className="dashboard-grid">
      <Card>
        <SectionTitle title="Precisa da sua atenção" description="Ordenado por prioridade e prazo." action={<Button variant="ghost" size="sm" onClick={() => onNavigate("fila")}>Ver fila <ChevronRight /></Button>} />
        <div className="ticket-list">{tickets.slice(0, 3).map((ticket) => <TicketRow key={ticket.id} ticket={ticket} onOpen={() => onOpen(ticket)} />)}</div>
      </Card>
      <div className="side-stack">
        <Card><SectionTitle title="Comunicado fixado" description="Sala Tecnologia" /><CardContent className="announcement"><Badge variant="default"><Pin /> Importante</Badge><Text as="h3">Manutenção programada da VPN</Text><Text>A indisponibilidade está prevista para hoje, das 20h às 22h.</Text><Button variant="ghost" className="text-link" onClick={() => onNavigate("salas")}>Abrir sala <ChevronRight /></Button></CardContent></Card>
        <Card><SectionTitle title="Equipe agora" description={`${collaborators.filter((collaborator) => collaborator.availability === "Disponível").length} pessoas disponíveis`} /><CardContent className="people-list">{collaborators.slice(1, 4).map((collaborator) => <div className="person-row" key={collaborator.name}><span className="availability-avatar"><Avatar name={collaborator.name} /><i className={collaborator.availability === "Disponível" ? "is-available" : "is-unavailable"} /></span><div><Text as="strong">{collaborator.name}</Text><Text as="small">{collaborator.role} · {collaborator.sector}</Text></div><Badge variant={collaborator.availability === "Disponível" ? "success" : "secondary"}>{collaborator.availability}</Badge></div>)}</CardContent></Card>
      </div>
    </div>
  </Page>;
}

function TicketRow({ ticket, onOpen, action }: { ticket: Ticket; onOpen: () => void; action?: ReactNode }) {
  return <div className="ticket-row" role="button" tabIndex={0} onClick={onOpen} onKeyDown={(event) => event.key === "Enter" && onOpen()}>
    <span className={`priority priority-${ticket.priority.toLowerCase()}`} />
    <div className="ticket-copy">
      <div><Badge variant={statusVariant(ticket.status)}>{ticket.status}</Badge><Text as="small">{ticket.id}</Text></div>
      <Text as="h3">{ticket.title}</Text><Text>{ticket.preview}</Text>
      <div className="ticket-meta"><span><Avatar name={ticket.requester} size="sm" />{ticket.requester}</span><span><Tags />{ticket.topic}</span><span><Clock3 />{ticket.wait}</span></div>
    </div>
    <div className="ticket-action">{action}{ticket.assignee && <Badge variant="outline">{ticket.assignee}</Badge>}<ChevronRight /></div>
  </div>;
}

function TicketQueue({ title, description, tickets, onOpen, onTake }: { title: string; description: string; tickets: Ticket[]; onOpen: (ticket: Ticket) => void; onTake?: (ticket: Ticket) => void }) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("todos");
  const visible = tickets.filter((ticket) => {
    const matchQuery = `${ticket.id} ${ticket.title} ${ticket.requester}`.toLowerCase().includes(query.toLowerCase());
    const matchTab = tab === "todos" || (tab === "aguardando" ? ticket.status === "Aguardando" : tab === "andamento" ? ticket.status === "Em atendimento" : ticket.status === "Encerrado");
    return matchQuery && matchTab;
  });
  return <Page title={title} description={description} actions={<Button variant="outline"><Filter /> Filtros</Button>}>
    <Card><div className="table-toolbar"><Tabs active={tab} onChange={setTab} items={[{ id: "todos", label: "Todos", count: tickets.length }, { id: "aguardando", label: "Aguardando" }, { id: "andamento", label: "Em atendimento" }, { id: "encerrado", label: "Encerrados" }]} /><div className="inline-search"><Search /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filtrar lista..." /></div></div>
      <div className="ticket-list">{visible.map((ticket) => <TicketRow key={ticket.id} ticket={ticket} onOpen={() => onOpen(ticket)} action={onTake && ticket.status === "Aguardando" && ticket.requester !== currentUser ? <Button size="sm" onClick={(event) => { event.stopPropagation(); onTake(ticket); }}>Assumir</Button> : undefined} />)}{visible.length === 0 && <EmptyState icon={<Search />} title="Nenhum atendimento encontrado" text="Ajuste os filtros ou tente outro termo." />}</div>
    </Card>
  </Page>;
}

function NewRequest({ collaborators, onCreate }: { collaborators: Collaborator[]; onCreate: (ticket: Ticket) => void }) {
  const [step, setStep] = useState(1);
  const [area, setArea] = useState("Tecnologia");
  const [topic, setTopic] = useState("Acessos e VPN");
  const [customTopic, setCustomTopic] = useState("");
  const [preferredAssignee, setPreferredAssignee] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const id = useMemo(() => `AT-${1050 + Math.floor(Math.random() * 40)}`, []);
  const resolvedTopic = topic === "Outros" ? customTopic.trim() : topic;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (step === 1 && !resolvedTopic) return;
    if (step < 3) { setStep(step + 1); return; }
    onCreate({ id, title: title || "Nova solicitação", requester: currentUser, area, topic: resolvedTopic, status: "Aguardando", priority: "Normal", wait: "agora", preview: description, nextAction: "Atendente", preferredAssignee: preferredAssignee || undefined });
  };
  return <Page title="Abrir solicitação" description="O assunto define a fila responsável; revise os dados antes de enviar.">
    <div className="form-layout">
      <Card className="step-card"><CardContent>{["Assunto e destino", "Detalhes e triagem", "Revisar e enviar"].map((label, index) => <div className={`step-item ${step === index + 1 ? "is-active" : ""} ${step > index + 1 ? "is-done" : ""}`} key={label}><span>{step > index + 1 ? <Check /> : index + 1}</span><div><Text as="strong">{label}</Text><Text as="small">{index === 0 ? "Selecione o fluxo" : index === 1 ? "Descreva a necessidade" : "Confirme as informações"}</Text></div></div>)}</CardContent></Card>
      <Card><SectionTitle title={step === 1 ? "Para onde devemos encaminhar?" : step === 2 ? "Conte o que aconteceu" : "Revise sua solicitação"} description={`Etapa ${step} de 3`} />
        <CardContent>
          <form className="form-stack" onSubmit={submit}>
            {step === 1 && <><div className="form-field"><Label>Setor responsável</Label><Select value={area} onChange={(event) => setArea(event.target.value)}><option>Tecnologia</option><option>Pessoas</option><option>Financeiro</option><option>Facilities</option></Select></div><div className="form-field"><Label>Assunto</Label><Select value={topic} onChange={(event) => setTopic(event.target.value)}><option>Acessos e VPN</option><option>Equipamentos</option><option>Benefícios</option><option>Reembolsos</option><option>Outros</option></Select></div>{topic === "Outros" && <div className="form-field"><Label hint="Obrigatório">Qual é o assunto?</Label><Input value={customTopic} onChange={(event) => setCustomTopic(event.target.value)} placeholder="Informe o assunto da solicitação" required autoFocus /></div>}<div className="callout"><Workflow /><div><Text as="strong">Encaminhamento automático</Text><Text>O assunto será enviado à fila de {area} sem expor decisões internas.</Text></div></div></>}
            {step === 2 && <><div className="form-field"><Label>Título</Label><Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Resuma sua necessidade" required /></div><div className="form-field"><Label hint="Mínimo de 10 caracteres">Descrição</Label><Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Inclua contexto, tentativas e resultado esperado..." required minLength={10} /></div><div className="form-field"><Label hint="Opcional · somente disponíveis">Atendente preferencial</Label><Select value={preferredAssignee} onChange={(event) => setPreferredAssignee(event.target.value)}><option value="">Sem preferência — fila geral</option>{collaborators.filter((collaborator) => collaborator.role === "Atendente" && collaborator.availability === "Disponível" && collaborator.name !== currentUser).map((collaborator) => <option key={collaborator.name} value={collaborator.name}>{collaborator.name} · {collaborator.sector}</option>)}</Select></div></>}
            {step === 3 && <div className="review-list">{[["Identificador", id], ["Setor", area], ["Assunto", resolvedTopic], ["Título", title], ["Descrição", description], ["Atendente preferencial", preferredAssignee || "Sem preferência"]].map(([label, value]) => <div key={label}><Text as="small">{label}</Text><Text as="strong">{value || "Não informado"}</Text></div>)}</div>}
            <div className="form-actions">{step > 1 && <Button type="button" variant="outline" onClick={() => setStep(step - 1)}><ArrowLeft /> Voltar</Button>}<span /><Button>{step === 3 ? "Criar solicitação" : "Continuar"} <ChevronRight /></Button></div>
          </form>
        </CardContent>
      </Card>
    </div>
  </Page>;
}

function TicketDetail({ ticket, onBack, onUpdate, notify, supervised = false }: { ticket: Ticket; onBack: () => void; onUpdate: (ticket: Ticket) => void; notify: (message: string) => void; supervised?: boolean }) {
  const [tab, setTab] = useState("conversa");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([{ author: ticket.requester, text: ticket.preview, mine: false, time: "09:42" }, { author: "Lucas Martins", text: "Olá! Vou verificar o seu caso e retorno nesta conversa.", mine: true, time: "09:47" }]);
  const send = (event: FormEvent) => {
    event.preventDefault();
    if (!message.trim()) return;
    setMessages([...messages, { author: currentUser, text: message, mine: true, time: "agora" }]);
    onUpdate({ ...ticket, nextAction: ticket.requester === currentUser ? "Atendente" : "Solicitante" });
    setMessage("");
  };
  return <Page eyebrow={supervised ? "VISUALIZAÇÃO SUPERVISIONADA" : ticket.id} title={ticket.title} description={`Solicitante: ${ticket.requester} · ${ticket.area} / ${ticket.topic}`} actions={<><Button variant="outline" className="detail-back" onClick={onBack}><ArrowLeft /> Voltar</Button>{!supervised && <Button variant="outline" onClick={() => { onUpdate({ ...ticket, status: "Transferência pendente" }); notify("Transferência registrada."); }}><ArrowLeftRight /> Transferir</Button>} {!supervised && <Button onClick={() => { onUpdate({ ...ticket, status: "Encerrado" }); notify("Atendimento encerrado."); }}><Check /> Encerrar</Button>}</>}>
    {supervised && <div className="callout"><ShieldCheck /><div><Text as="strong">Acesso gerencial autorizado</Text><Text>Consulta restrita ao escopo Tecnologia; esta abertura será auditada.</Text></div></div>}
    <div className="detail-layout">
      <Card className="conversation-card">
        <Tabs active={tab} onChange={setTab} items={[{ id: "conversa", label: "Conversa" }, { id: "notas", label: "Notas internas", count: 1 }, { id: "eventos", label: "Histórico" }]} />
        {tab === "conversa" && <><div className="messages">{messages.map((item, index) => <div className={`message ${item.mine ? "is-mine" : ""}`} key={index}>{!item.mine && <Avatar name={item.author} size="sm" />}<div><Text as="small">{item.author} · {item.time}</Text><Text>{item.text}</Text>{item.mine && <Text as="small" className="delivered"><Check /> Entregue</Text>}</div></div>)}</div>{!supervised && <form className="composer" onSubmit={send}><Textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Escreva uma mensagem..." /><div><Button type="button" variant="ghost"><Paperclip /> Anexar</Button><Button><Send /> Enviar</Button></div></form>}</>}
        {tab === "notas" && <CardContent><div className="callout warning"><LockKeyhole /><div><Text as="strong">Somente equipe autorizada</Text><Text>Estas notas nunca são exibidas ao solicitante.</Text></div></div><div className="note-card"><Avatar name="Lucas Martins" /><div><Text as="strong">Lucas Martins · 09:50</Text><Text>Validar o certificado no diretório antes da reinstalação.</Text></div></div>{!supervised && <div className="form-stack"><Textarea placeholder="Adicionar contexto interno..." /><Button>Adicionar nota</Button></div>}</CardContent>}
        {tab === "eventos" && <CardContent><Timeline /></CardContent>}
      </Card>
      <div className="side-stack">
        <Card><SectionTitle title="Sobre o atendimento" /><CardContent className="definition-list">{[["Status", <Badge variant={statusVariant(ticket.status)}>{ticket.status}</Badge>], ["Prioridade", ticket.priority], ["Responsável", ticket.assignee || "Não atribuído"], ["Preferência", ticket.preferredAssignee || "Sem preferência"], ["Setor", ticket.area], ["Assunto", ticket.topic], ["Prazo", "Hoje, 14:30"]].map(([key, value]) => <div key={String(key)}><Text as="small">{key}</Text><span>{value}</span></div>)}</CardContent></Card>
        <Card className="ai-card"><CardContent><Badge variant="default"><Sparkles /> Assistido por IA</Badge><Text as="h3">Resumo do atendimento</Text><Text>Falha de acesso em redes distintas. Próximo passo sugerido: validar certificado.</Text><Text as="small">Período: 09:42–09:51. O histórico original permanece disponível.</Text><Button variant="outline"><Bot /> Atualizar resumo</Button></CardContent></Card>
      </div>
    </div>
  </Page>;
}

function Transfers({ tickets, onOpen, notify }: { tickets: Ticket[]; onOpen: (ticket: Ticket) => void; notify: (message: string) => void }) {
  const item = tickets[2];
  return <Page title="Transferências e redirecionamentos" description="O responsável atual permanece identificado até o aceite do destino." actions={<Button variant="outline"><Filter /> Filtrar</Button>}>
    <Card><SectionTitle title="Pendentes de decisão" description="1 transferência aguardando aceite" /><CardContent><div className="transfer-card"><div><Badge variant="warning">Aceite pendente</Badge><Text as="h3">{item.id} · {item.title}</Text><Text>{item.area} → Tecnologia · solicitada por Bruno Reis</Text></div><div className="transfer-flow"><Avatar name="Bruno Reis" /><ArrowLeftRight /><Avatar name="Julia Ramos" /></div><div><Button variant="outline" onClick={() => notify("Transferência recusada; contingência acionada.")}>Recusar</Button><Button onClick={() => notify("Transferência aceita; histórico preservado.")}>Aceitar</Button><Button variant="ghost" size="icon" onClick={() => onOpen(item)}><ChevronRight /></Button></div></div></CardContent></Card>
  </Page>;
}

function EventHistory({ tickets }: { tickets: Ticket[] }) {
  return <Page title="Histórico e eventos" description="Mensagens, estados, transferências e autoria em ordem cronológica." actions={<Button variant="outline"><Filter /> Período e tipo</Button>}>
    <Card><div className="table-toolbar"><div className="inline-search"><Search /><Input placeholder="Buscar identificador ou evento..." /></div><Badge variant="outline"><LockKeyhole /> Histórico íntegro</Badge></div><CardContent><Timeline extended /><Separator /><Text as="small" className="muted-block">{tickets.length} atendimentos autorizados no escopo atual.</Text></CardContent></Card>
  </Page>;
}

function SearchScreen({ tickets, onOpen }: { tickets: Ticket[]; onOpen: (ticket: Ticket) => void }) {
  const [query, setQuery] = useState("");
  const visible = tickets.filter((ticket) => `${ticket.id} ${ticket.title} ${ticket.requester} ${ticket.area}`.toLowerCase().includes(query.toLowerCase()));
  return <Page title="Busca de atendimentos" description="Resultados e sugestões respeitam seu perfil e escopo de acesso.">
    <Card><CardContent className="search-hero"><div className="search-large"><Search /><Input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Identificador, solicitante, assunto ou responsável" /><Button>Pesquisar</Button></div><div className="filter-grid"><Select><option>Todos os setores</option><option>Tecnologia</option><option>Pessoas</option></Select><Select><option>Todos os estados</option><option>Aguardando</option><option>Em atendimento</option></Select><Select><option>Qualquer período</option><option>Hoje</option><option>Últimos 7 dias</option></Select></div></CardContent></Card>
    <Card className="results-card"><SectionTitle title={`${visible.length} resultados autorizados`} description="Nenhum conteúdo fora do seu escopo é exibido." />{visible.map((ticket) => <TicketRow key={ticket.id} ticket={ticket} onOpen={() => onOpen(ticket)} />)}</Card>
  </Page>;
}

function Rooms({ mode, notify }: { mode: "room" | "thread"; notify: (message: string) => void }) {
  const [message, setMessage] = useState("");
  const [posts, setPosts] = useState([{ name: "Camila Melo", text: "A manutenção da VPN foi confirmada para hoje, das 20h às 22h.", time: "10:14" }, { name: "Bruno Reis", text: "Atualizei o guia de configuração de novos notebooks.", time: "10:32" }]);
  const post = (event: FormEvent) => { event.preventDefault(); if (!message.trim()) return; setPosts([...posts, { name: "Lucas Martins", text: message, time: "agora" }]); setMessage(""); };
  return <Page title={mode === "room" ? "Sala geral · Tecnologia" : "Tópico · Guia de configuração"} description={mode === "room" ? "Espaço coletivo separado de atendimentos privados." : "Conversa paralela ligada à mensagem original, sem poluir o fluxo principal."} actions={<Button variant="outline"><Users /> 18 participantes</Button>}>
    <div className="rooms-layout">
      <Card className="room-card">{mode === "thread" && <div className="callout"><MessageCircle /><div><Text as="strong">Mensagem de origem · Bruno Reis</Text><Text>Atualizei o guia de configuração de novos notebooks.</Text></div></div>}<div className="room-feed">{posts.map((postItem, index) => <div className="room-post" key={index}><Avatar name={postItem.name} /><div><div><Text as="strong">{postItem.name}</Text><Text as="small">{postItem.time}</Text>{index === 0 && mode === "room" && <Badge variant="default"><Pin /> Fixado</Badge>}</div><Text>{postItem.text}</Text><Button variant="ghost" size="sm" onClick={() => notify("Tópico aberto em contexto separado.")}><MessageCircle /> {index ? 4 : 12} respostas</Button></div></div>)}</div><form className="composer" onSubmit={post}><Textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder={mode === "room" ? "Publique na sala..." : "Responda ao tópico..."} /><div><Button type="button" variant="ghost"><Paperclip /> Anexar</Button><Button><Send /> Publicar</Button></div></form></Card>
      <Card><SectionTitle title="Canais" /><CardContent className="channel-list">{["# Geral", "# Incidentes", "# Projetos", "# Base de conhecimento"].map((channel, index) => <Button key={channel} variant={index === 0 ? "secondary" : "ghost"}>{channel}{index === 1 && <Badge>3</Badge>}</Button>)}<Separator /><Text as="small" className="nav-label">Mensagens diretas</Text>{["Camila Melo", "Julia Ramos", "Pedro Lima"].map((name) => <Button key={name} variant="ghost"><Avatar name={name} size="sm" />{name}</Button>)}</CardContent></Card>
    </div>
  </Page>;
}

function DirectMessages({ notify }: { notify: (message: string) => void }) {
  const [message, setMessage] = useState("");
  return <Page title="Conversas particulares" description="Somente os dois participantes podem localizar e consultar esta conversa.">
    <div className="dm-layout"><Card><CardContent className="dm-list"><div className="inline-search"><Search /><Input placeholder="Buscar colaborador..." /></div>{["Camila Melo", "Julia Ramos", "Pedro Lima"].map((name, index) => <Button key={name} variant={index === 0 ? "secondary" : "ghost"}><Avatar name={name} /><span><strong>{name}</strong><small>{index === 0 ? "Você: combinado, obrigada!" : "Clique para abrir a conversa"}</small></span>{index === 1 && <Badge>2</Badge>}</Button>)}</CardContent></Card>
      <Card className="conversation-card"><SectionTitle title="Camila Melo" description="Gerente · Tecnologia · Disponível" action={<Badge variant="outline"><LockKeyhole /> Privada</Badge>} /><div className="messages"><div className="message"><Avatar name="Camila Melo" size="sm" /><div><Text as="small">Camila · 10:41</Text><Text>Você consegue acompanhar a manutenção da VPN hoje?</Text></div></div><div className="message is-mine"><div><Text as="small">Você · 10:43</Text><Text>Sim, já deixei o checklist preparado.</Text></div></div></div><form className="composer" onSubmit={(event) => { event.preventDefault(); if (message.trim()) { notify("Mensagem privada enviada e registrada."); setMessage(""); } }}><Textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Mensagem privada para Camila..." /><div><Button type="button" variant="ghost"><Paperclip /> Mídia</Button><Button><Send /> Enviar</Button></div></form></Card></div>
  </Page>;
}

function Supervision({ tickets, onOpen, onNavigate }: { tickets: Ticket[]; onOpen: (ticket: Ticket) => void; onNavigate: (view: View) => void }) {
  return <Page eyebrow="ESCOPO · TECNOLOGIA E PESSOAS" title="Painel gerencial" description="Acompanhamento dentro dos setores sob sua responsabilidade." actions={<Button variant="outline"><Filter /> Últimos 7 dias</Button>}>
    <div className="metric-grid">{[["Recebidos", "126", "+8% no período"], ["1ª resposta", "11 min", "Meta: 15 min"], ["Em aberto", "18", "2 próximos do prazo"], ["Resolvidos", "94%", "119 no período"]].map(([label, value, meta]) => <Card className="metric-card" key={label}><CardContent><Text as="span">{label}</Text><Text as="strong">{value}</Text><Text as="small">{meta}</Text></CardContent></Card>)}</div>
    <div className="dashboard-grid"><Card><SectionTitle title="Volume de atendimentos" description="Recebidos por dia" action={<Button variant="ghost" onClick={() => onNavigate("indicadores")}>Detalhar <ChevronRight /></Button>} /><CardContent><BarChart values={[52, 68, 47, 82, 74, 91, 63]} /></CardContent></Card><Card><SectionTitle title="Carga da equipe" description="Atendimentos ativos" /><CardContent className="workload">{[["Lucas Martins", 55, "3"], ["Julia Ramos", 82, "5"], ["Bruno Reis", 67, "4"], ["Camila Melo", 36, "2"]].map(([name, value, count]) => <div key={String(name)}><Avatar name={String(name)} size="sm" /><div><Text as="strong">{name}</Text><Progress value={Number(value)} /></div><Badge variant="outline">{count}</Badge></div>)}</CardContent></Card></div>
    <Card className="results-card"><SectionTitle title="Atendimentos do escopo" description="Aberturas de conteúdo são auditadas." />{tickets.slice(0, 3).map((ticket) => <TicketRow ticket={ticket} key={ticket.id} onOpen={() => onOpen(ticket)} />)}</Card>
  </Page>;
}

function SupervisedDetail({ ticket, onOpen }: { ticket: Ticket; onOpen: (ticket: Ticket) => void }) {
  return <Page title="Detalhe supervisionado" description="Selecione um atendimento do escopo para consulta gerencial."><Card><CardContent className="supervised-hero"><ShieldCheck /><div><Text as="h2">Consulta protegida por escopo</Text><Text>O acesso ao conteúdo individual exige justificativa e é registrado na auditoria.</Text></div><Button onClick={() => onOpen(ticket)}>Abrir {ticket.id}</Button></CardContent></Card><Card className="results-card"><SectionTitle title="Atendimentos disponíveis" />{ticketsSeed.slice(0, 3).map((item) => <TicketRow key={item.id} ticket={item} onOpen={() => onOpen(item)} />)}</Card></Page>;
}

function AISummary({ notify }: { notify: (message: string) => void }) {
  const [generated, setGenerated] = useState(false);
  return <Page title="Resumo de atendimento por IA" description="Síntese identificada, delimitada por período e sem substituir o histórico original." actions={<Badge variant="outline"><ShieldCheck /> Conteúdo autorizado</Badge>}>
    <div className="ai-layout"><Card><SectionTitle title="Configurar resumo" description="Escolha atendimento e período." /><CardContent className="form-stack"><div className="form-field"><Label>Atendimento</Label><Select><option>AT-1047 · Notebook sem acesso à VPN</option><option>AT-1048 · Portal de benefícios</option></Select></div><div className="form-grid"><div className="form-field"><Label>Data inicial</Label><Input type="date" defaultValue="2026-10-27" /></div><div className="form-field"><Label>Data final</Label><Input type="date" defaultValue="2026-10-27" /></div></div><Button onClick={() => { setGenerated(true); notify("Resumo gerado a partir do conteúdo autorizado."); }}><Sparkles /> Gerar resumo</Button></CardContent></Card>
      <Card className="ai-output"><SectionTitle title="Resultado" description="Gerado por IA · 27/10/2026, 09:42–10:15" />{generated ? <CardContent><Badge variant="default"><Bot /> Resumo assistido por IA</Badge><Text as="h3">Acesso à VPN em investigação</Text><Text>O solicitante reportou falha de certificado em redes distintas. A equipe confirmou que o equipamento está ativo no diretório e iniciou validação do certificado local.</Text><Text as="strong">Pendências</Text><ul><li>Validar data de expiração do certificado.</li><li>Confirmar acesso após nova emissão.</li></ul><div className="callout warning"><Sparkles /><div><Text as="strong">Limite do resumo</Text><Text>Confira o histórico original antes de tomar decisões.</Text></div></div></CardContent> : <EmptyState icon={<Bot />} title="Nenhum resumo gerado" text="Configure o período e solicite uma síntese." />}</Card>
    </div>
  </Page>;
}

function Indicators() {
  return <Page title="Indicadores operacionais" description="Métricas agregadas com período e definições transparentes." actions={<><Select className="compact-select"><option>Últimos 30 dias</option><option>Últimos 7 dias</option></Select><Button variant="outline">Exportar</Button></>}>
    <div className="metric-grid">{[["Volume recebido", "486", "+6,2%"], ["Tempo até 1ª resposta", "12m 18s", "-1m 42s"], ["Fora do prazo", "3,1%", "-0,8 p.p."], ["Reabertos", "14", "2,9% do total"]].map(([label, value, meta]) => <Card className="metric-card" key={label}><CardContent><Text as="span">{label}</Text><Text as="strong">{value}</Text><Badge variant="success">{meta}</Badge></CardContent></Card>)}</div>
    <div className="dashboard-grid"><Card><SectionTitle title="Volume por período" description="Recebidos e encerrados" /><CardContent><BarChart values={[42, 57, 63, 51, 78, 69, 86, 73, 91, 82]} /></CardContent></Card><Card><SectionTitle title="Por setor" description="Participação no volume" /><CardContent className="sector-progress">{[["Tecnologia", 42], ["Pessoas", 28], ["Financeiro", 18], ["Facilities", 12]].map(([name, value]) => <div key={String(name)}><div><Text as="strong">{name}</Text><Text as="small">{value}%</Text></div><Progress value={Number(value)} /></div>)}</CardContent></Card></div>
  </Page>;
}

const adminConfigs = {
  pessoas: { title: "Pessoas, setores e permissões", description: "Associações e papéis com preservação do histórico.", icon: Users, columns: ["Colaborador", "Setores", "Papel", "Estado"], rows: [["Camila Melo", "Tecnologia, Pessoas", "Gerente", "Ativo"], ["Lucas Martins", "Tecnologia", "Atendente", "Ativo"], ["Bruno Reis", "Financeiro", "Atendente", "Ativo"]] },
  assuntos: { title: "Assuntos, fluxos e setores", description: "Classificação e roteamento de novas solicitações.", icon: Tags, columns: ["Assunto", "Setor responsável", "Triagem", "Estado"], rows: [["Acessos e VPN", "Tecnologia", "3 perguntas", "Ativo"], ["Benefícios", "Pessoas", "2 perguntas", "Ativo"], ["Reembolsos", "Financeiro", "4 perguntas", "Ativo"]] },
  distribuicao: { title: "Elegibilidade, filas e distribuição", description: "Preferências, aceite, contingência e fila individual.", icon: Workflow, columns: ["Fila", "Elegíveis", "Preferência", "Contingência"], rows: [["Tecnologia geral", "12 pessoas", "30 min", "Fila geral"], ["Benefícios", "6 pessoas", "20 min", "Gerente"], ["Financeiro", "8 pessoas", "30 min", "Fila geral"]] },
  triagem: { title: "Triagem e respostas modelo", description: "Perguntas e modelos versionados para novos usos.", icon: BookOpen, columns: ["Modelo", "Contexto", "Versão", "Estado"], rows: [["Falha de acesso", "Acessos e VPN", "v4", "Publicado"], ["Documentos pendentes", "Reembolsos", "v2", "Publicado"], ["Prazo de análise", "Benefícios", "v3", "Rascunho"]] },
  sla: { title: "Regras de SLA, prazos e prioridades", description: "Parâmetros operacionais sem promessas não configuradas.", icon: Clock3, columns: ["Regra", "Prioridade", "1ª resposta", "Resolução"], rows: [["Incidente crítico", "Alta", "15 min", "4 horas"], ["Solicitação padrão", "Normal", "2 horas", "2 dias"], ["Dúvida geral", "Normal", "4 horas", "3 dias"]] },
  "config-salas": { title: "Configurações de salas e comunicados", description: "Acesso setorial, fixação e criação de tópicos.", icon: MessagesSquare, columns: ["Sala", "Participantes", "Quem publica", "Estado"], rows: [["Tecnologia", "18", "Membros", "Ativa"], ["Pessoas", "12", "Membros", "Ativa"], ["Lideranças", "8", "Gerentes", "Restrita"]] },
};

function AdminScreen({ type, collaborators, onAvailabilityChange, notify }: { type: keyof typeof adminConfigs; collaborators: Collaborator[]; onAvailabilityChange: (name: string, availability: Availability) => void; notify: (message: string) => void }) {
  const config = adminConfigs[type];
  const Icon = config.icon;
  const [dialog, setDialog] = useState(false);
  const [enabled, setEnabled] = useState(true);
  return <Page title={config.title} description={config.description} actions={<Button onClick={() => setDialog(true)}><Plus /> Adicionar</Button>}>
    <div className="admin-summary"><Card><CardContent><Icon /><div><Text as="small">{type === "pessoas" ? "Colaboradores" : "Configurações ativas"}</Text><Text as="strong">{type === "pessoas" ? collaborators.length : config.rows.length}</Text></div></CardContent></Card><Card><CardContent><ShieldCheck /><div><Text as="small">Alterações auditadas</Text><Text as="strong">100%</Text></div></CardContent></Card><Card><CardContent><FileClock /><div><Text as="small">Última alteração</Text><Text as="strong">Hoje, 09:18</Text></div></CardContent></Card></div>
    <Card><div className="table-toolbar"><div className="inline-search"><Search /><Input placeholder={type === "pessoas" ? "Buscar colaborador..." : "Buscar configuração..."} /></div><Button variant="outline"><Filter /> Filtrar</Button></div>{type === "pessoas" ? <CollaboratorStatusTable collaborators={collaborators} onAvailabilityChange={onAvailabilityChange} /> : <DataTable columns={config.columns} rows={config.rows} />}</Card>
    <Dialog open={dialog} onClose={() => setDialog(false)} title={`Adicionar em ${config.title}`} description="Novas configurações valem para usos futuros e geram auditoria." footer={<><Button variant="outline" onClick={() => setDialog(false)}>Cancelar</Button><Button onClick={() => { setDialog(false); notify("Configuração salva e registrada na auditoria."); }}>Salvar configuração</Button></>}>
      <div className="form-stack"><div className="form-field"><Label>Nome</Label><Input placeholder="Nome da configuração" /></div><div className="form-field"><Label>Descrição</Label><Textarea placeholder="Objetivo e regras aplicáveis" /></div><Switch checked={enabled} onChange={setEnabled} label="Ativo para novos usos" /></div>
    </Dialog>
  </Page>;
}

function Audit() {
  const rows = [["AT-1048", "Solicitação criada", "Marina Costa", "Hoje, 10:42"], ["AT-1047", "Nota interna adicionada", "Lucas Martins", "Hoje, 10:18"], ["AT-1046", "Transferência solicitada", "Bruno Reis", "Hoje, 09:56"], ["SLA-04", "Regra de SLA atualizada", "Camila Melo", "Ontem, 17:21"], ["AT-1042", "Atendimento encerrado", "Camila Melo", "Ontem, 16:48"]];
  return <Page title="Consulta de auditoria" description="Trilha imutável de ações operacionais, administrativas e acessos." actions={<Button variant="outline"><Filter /> Período e evento</Button>}><Card><div className="table-toolbar"><div className="inline-search"><Search /><Input placeholder="Objeto, ação ou autor..." /></div><Badge variant="outline"><LockKeyhole /> Somente leitura</Badge></div><DataTable columns={["Objeto", "Evento", "Autor", "Data e hora"]} rows={rows} /></Card></Page>;
}

function ExceptionalAccess({ notify }: { notify: (message: string) => void }) {
  return <Page title="Autorizações excepcionais e escopos" description="Concessões explícitas, delimitadas, temporárias e integralmente auditadas." actions={<Button onClick={() => notify("Fluxo de nova autorização iniciado.")}><Plus /> Nova autorização</Button>}>
    <div className="callout warning"><KeyRound /><div><Text as="strong">Negação por padrão</Text><Text>Uma autorização excepcional não substitui as permissões normais e deve ter justificativa, escopo e validade.</Text></div></div>
    <Card><DataTable columns={["Pessoa", "Escopo concedido", "Validade", "Aprovador"]} rows={[["Renata Dias", "Tecnologia · leitura", "29/10/2026", "Diretoria de Operações"], ["Rafael Luz", "AT-1038 · consulta", "Hoje, 18:00", "Camila Melo"], ["Marina Costa", "Pessoas · indicadores", "31/10/2026", "Diretoria de Pessoas"]]} /></Card>
  </Page>;
}

function ErrorStates({ onNavigate, notify }: { onNavigate: (view: View) => void; notify: (message: string) => void }) {
  const [selectedError, setSelectedError] = useState<(typeof errorCases)[number]["id"]>("servidor");
  const activeError = errorCases.find((error) => error.id === selectedError) ?? errorCases[0];
  const Icon = activeError.icon;
  const runPrimaryAction = () => {
    if (activeError.id === "sessao") {
      onNavigate("entrar");
      return;
    }
    if (activeError.id === "nao-encontrado") {
      onNavigate("inicio");
      return;
    }
    notify(`${activeError.action}: ação simulada com segurança.`);
  };
  return <Page title="Estados e telas de erro" description="Padrões de recuperação para falhas previstas nos fluxos da Central." actions={<Badge variant="outline"><ShieldCheck /> 13 cenários cobertos</Badge>}>
    <div className="error-states-layout">
      <Card className="error-catalog">
        <SectionTitle title="Cenários" description="Selecione para visualizar" />
        <CardContent>{errorCases.map((error) => {
          const ErrorIcon = error.icon;
          return <Button key={error.id} variant="ghost" className={selectedError === error.id ? "is-active" : ""} onClick={() => setSelectedError(error.id)}>
            <span className="error-list-icon"><ErrorIcon /></span>
            <span><strong>{error.title}</strong><small>{error.code}</small></span>
            <ChevronRight />
          </Button>;
        })}</CardContent>
      </Card>
      <Card className="error-preview" aria-live="polite">
        <CardContent>
          <Badge variant="destructive">{activeError.code}</Badge>
          <span className="error-hero-icon"><Icon /></span>
          <Text as="h2">{activeError.title}</Text>
          <Text>{activeError.description}</Text>
          <div className="error-guidance"><TriangleAlert /><Text>{activeError.guidance}</Text></div>
          <div className="error-actions">
            <Button onClick={runPrimaryAction}><RefreshCw /> {activeError.action}</Button>
            <Button variant="outline" onClick={() => onNavigate("inicio")}><House /> Ir para o início</Button>
          </div>
          <Separator />
          <Text as="small" className="error-reference">Se o problema persistir, entre em contato com o suporte e informe o código exibido acima.</Text>
        </CardContent>
      </Card>
    </div>
  </Page>;
}

function ProfileScreen({ availability, onAvailabilityChange, notify, onNavigate }: { availability: Availability; onAvailabilityChange: (availability: Availability) => void; notify: (message: string) => void; onNavigate: (view: View) => void }) {
  const [email, setEmail] = useState(true);
  const [browser, setBrowser] = useState(true);
  return <Page title="Meu perfil e setores" description="Sua identidade, associações vigentes e preferências pessoais." actions={<Button variant="outline" onClick={() => onNavigate("entrar")}>Encerrar sessão</Button>}>
    <div className="profile-layout"><Card><CardContent className="profile-hero"><Avatar name="Lucas Martins" size="lg" /><div><Text as="h2">Lucas Martins</Text><Text>lucas.martins@connecttelecom.com.br</Text><div><Badge variant="success">Ativo</Badge><Badge variant="outline">Atendente</Badge></div></div><Button variant="outline">Alterar foto</Button></CardContent><Separator /><CardContent className="form-grid"><div className="form-field"><Label>Nome completo</Label><Input defaultValue="Lucas Martins" /></div><div className="form-field"><Label>E-mail corporativo</Label><Input defaultValue="lucas.martins@connecttelecom.com.br" disabled /></div></CardContent></Card>
      <div className="side-stack"><Card><SectionTitle title="Minha disponibilidade" description="Este status é visível para toda a equipe." /><CardContent className="availability-control"><div><span className="availability-indicator"><i className={availability === "Disponível" ? "is-available" : "is-unavailable"} /></span><div><Text as="strong">{availability}</Text><Text as="small">{availability === "Disponível" ? "Você pode receber novos atendimentos." : "Novos atendimentos não serão direcionados a você."}</Text></div></div><Switch checked={availability === "Disponível"} onChange={(checked) => onAvailabilityChange(checked ? "Disponível" : "Indisponível")} label={availability === "Disponível" ? "Disponível para atender" : "Indisponível para atender"} /></CardContent></Card><Card><SectionTitle title="Setores associados" description="Alterações exigem perfil administrativo." /><CardContent><div className="membership"><Building2 /><div><Text as="strong">Tecnologia</Text><Text as="small">Atendente elegível · nível 2</Text></div><Badge variant="success">Principal</Badge></div></CardContent></Card><Card><SectionTitle title="Notificações" /><CardContent><Switch checked={browser} onChange={setBrowser} label="Alertas no navegador" /><Switch checked={email} onChange={setEmail} label="Resumo por e-mail" /><Button onClick={() => notify("Preferências salvas.")}>Salvar preferências</Button></CardContent></Card></div>
    </div>
  </Page>;
}

function NotificationList({ tickets, onOpen }: { tickets: Ticket[]; onOpen: (ticket: Ticket) => void }) {
  const notifications = [
    { icon: Inbox, title: "Nova solicitação na fila", text: `${tickets[0].id} · ${tickets[0].topic}`, time: "há 12 min", ticket: tickets[0] },
    { icon: ArrowLeftRight, title: "Transferência aguardando aceite", text: `${tickets[2].id} · destino Tecnologia`, time: "há 18 min", ticket: tickets[2] },
    { icon: MessageCircle, title: "Nova mensagem em atendimento", text: `${tickets[1].id} · estado atual: em atendimento`, time: "há 28 min", ticket: tickets[1] },
  ];
  return <div className="notification-list">{notifications.map(({ icon: Icon, title, text, time, ticket }) => <Button variant="ghost" key={title} onClick={() => onOpen(ticket)}><span className="notification-icon"><Icon /></span><span><strong>{title}</strong><small>{text}</small></span><small>{time}</small><ChevronRight /></Button>)}</div>;
}

function AuthScreen({ recovery, onNavigate }: { recovery: boolean; onNavigate: (view: View) => void }) {
  const [sent, setSent] = useState(false);
  return <div className="auth-shell"><div className="auth-brand"><img src="/brand/connect-telecom-transparent.svg" alt="Connect Telecom" /></div><Card className="auth-card"><CardContent><div className="auth-icon">{recovery ? <KeyRound /> : <LockKeyhole />}</div><Text as="h1">{recovery ? "Recuperar acesso" : "Entrar na Central Connect"}</Text><Text>{recovery ? "Enviaremos instruções seguras para seu e-mail corporativo." : "Use suas credenciais corporativas para continuar."}</Text>{sent ? <div className="callout"><Check /><div><Text as="strong">Instruções enviadas</Text><Text>Verifique sua caixa de entrada e a pasta de spam.</Text></div></div> : <form className="form-stack" onSubmit={(event) => { event.preventDefault(); recovery ? setSent(true) : onNavigate("inicio"); }}><div className="form-field"><Label>E-mail corporativo</Label><Input type="email" placeholder="nome@connecttelecom.com.br" defaultValue={recovery ? "" : "lucas.martins@connecttelecom.com.br"} required /></div>{!recovery && <div className="form-field"><Label>Senha</Label><Input type="password" defaultValue="prototipo" required /></div>}<Button>{recovery ? "Enviar instruções" : "Entrar"}</Button></form>}<Button variant="ghost" className="auth-link" onClick={() => onNavigate(recovery ? "entrar" : "recuperar")}>{recovery && <ArrowLeft />}{recovery ? "Voltar para entrar" : "Esqueci minha senha"}</Button></CardContent></Card><Text as="small" className="auth-footer">Connect Telecom · ambiente interno monitorado e auditado</Text></div>;
}

function EmptyState({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return <div className="empty-state"><span>{icon}</span><Text as="h3">{title}</Text><Text>{text}</Text></div>;
}

function Timeline({ extended = false }: { extended?: boolean }) {
  const items = ["Solicitação criada e encaminhada para Tecnologia", "Prioridade definida como Média", "Atendimento assumido por Lucas Martins", "Nota interna adicionada", "Mensagem entregue ao solicitante"];
  return <div className="timeline">{items.slice(0, extended ? 5 : 3).map((item, index) => <div key={item}><span /><div><Text as="strong">{item}</Text><Text as="small">Hoje · {`09:${42 + index * 4}`}</Text></div></div>)}</div>;
}

function CollaboratorStatusTable({ collaborators, onAvailabilityChange }: { collaborators: Collaborator[]; onAvailabilityChange: (name: string, availability: Availability) => void }) {
  return <div className="collaborator-table">
    <div className="collaborator-row collaborator-head"><Text as="small">Colaborador</Text><Text as="small">Setor e papel</Text><Text as="small">Status obrigatório</Text></div>
    {collaborators.map((collaborator) => <div className="collaborator-row" key={collaborator.name}>
      <div><span className="availability-avatar"><Avatar name={collaborator.name} /><i className={collaborator.availability === "Disponível" ? "is-available" : "is-unavailable"} /></span><Text as="strong">{collaborator.name}</Text></div>
      <div><Text as="strong">{collaborator.sector}</Text><Text as="small">{collaborator.role}</Text></div>
      <div><Badge variant={collaborator.availability === "Disponível" ? "success" : "secondary"}>{collaborator.availability}</Badge><Switch checked={collaborator.availability === "Disponível"} onChange={(checked) => onAvailabilityChange(collaborator.name, checked ? "Disponível" : "Indisponível")} label={collaborator.availability === "Disponível" ? "Disponível" : "Indisponível"} /></div>
    </div>)}
  </div>;
}

function DataTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return <div className="data-table"><div className="data-row data-head">{columns.map((column) => <Text as="small" key={column}>{column}</Text>)}</div>{rows.map((row, rowIndex) => <div className="data-row" key={rowIndex}>{row.map((cell, index) => index === row.length - 1 ? <Badge key={index} variant={cell === "Ativo" || cell === "Ativa" || cell === "Publicado" ? "success" : "outline"}>{cell}</Badge> : <Text as={index === 0 ? "strong" : "span"} key={index}>{cell}</Text>)}<Button variant="ghost" size="icon"><MoreHorizontal /></Button></div>)}</div>;
}

function BarChart({ values }: { values: number[] }) {
  return <div className="bar-chart">{values.map((value, index) => <div key={index}><span><i style={{ height: `${value}%` }} /></span><Text as="small">{["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom", "Seg", "Ter", "Qua"][index]}</Text></div>)}</div>;
}

export default App;
