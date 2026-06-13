import { useInView } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Armchair,
  Bell,
  ChartColumn,
  ClipboardCheck,
  ListTodo,
  ReceiptText,
  Home,
  LockKeyhole,
  LogIn,
  Trash2,
  X,
} from "lucide-react";

import {
  ADMIN_AUTH_EVENT,
  ADMIN_PASSWORD,
  ADMIN_SESSION_KEY,
} from "../constants/admin";
import AdminPendingChangesActions from "../components/admin/AdminPendingChangesActions";
import UnsavedChangesDialog from "../components/admin/UnsavedChangesDialog";
import AnimatedInfoCard from "../components/ui/AnimatedInfoCard";
import HeaderSection from "../components/ui/HeaderSection";
import IconButton from "../components/ui/IconButton";
import Spinner from "../components/ui/Spinner";
import CinematicPage from "../components/cinematic/CinematicPage";
import CinematicSection from "../components/cinematic/CinematicSection";
import CinematicStaggeredRevealItem from "../components/cinematic/CinematicStaggeredRevealItem";
import {
  FieldError,
  FormCard,
  inputClassName,
  Label,
} from "../components/rsvp/FormPrimitives";
import { siteContent } from "../constants/siteContent";
import { adminContent } from "../constants/adminContent";
import {
  discardAdminPendingChanges,
  getAdminPendingChangesSummary,
  hasAdminPendingChanges,
  loadAdminDataOnce,
  saveAdminPendingChanges,
} from "../services/adminDataStore";
import useIsMobileView from "../hooks/useIsMobileView";
import useUnsavedChangesNavigation from "../hooks/useUnsavedChangesNavigation";

const adminCardIcons = {
  armchair: Armchair,
  bell: Bell,
  "chart-column": ChartColumn,
  "clipboard-check": ClipboardCheck,
  "list-todo": ListTodo,
  "receipt-text": ReceiptText,
};

const getAdminCard = (card) => {
  const Icon = adminCardIcons[card.icon];

  if (!Icon) return card;

  return {
    ...card,
    backgroundIcon: <Icon size={72} strokeWidth={1.5} />,
    icon: <Icon size={22} strokeWidth={1.8} />,
  };
};

export default function Admin() {
  const adminRef = useRef(null);
  const adminInView = useInView(adminRef, {
    once: true,
    amount: 0.12,
  });
  const isMobileView = useIsMobileView();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return window.sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
  });

  const canSubmit = useMemo(() => password.trim().length > 0, [password]);

  useEffect(() => {
    const syncAuthState = () => {
      setIsAuthenticated(
        window.sessionStorage.getItem(ADMIN_SESSION_KEY) === "true",
      );
    };

    window.addEventListener(ADMIN_AUTH_EVENT, syncAuthState);

    return () => {
      window.removeEventListener(ADMIN_AUTH_EVENT, syncAuthState);
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (password === ADMIN_PASSWORD) {
      try {
        setLoading(true);
        await loadAdminDataOnce({ password: ADMIN_PASSWORD });
        window.sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
        window.dispatchEvent(new Event(ADMIN_AUTH_EVENT));
        setIsAuthenticated(true);
        setError("");
        setPassword("");
      } catch (error) {
        console.error(error);
        setError(adminContent.auth.error);
      } finally {
        setLoading(false);
      }
      return;
    }

    setError(adminContent.auth.error);
  };

  return (
    <CinematicPage>
      {loading && <Spinner text={adminContent.auth.loading} />}
      <CinematicSection
        className="surface-soft admin-section"
        innerClassName="max-w-7xl py-6"
        reveal={false}
      >
        <div ref={adminRef}>
          <CinematicStaggeredRevealItem index={0} isVisible={adminInView}>
            <HeaderSection
              eyebrow={adminContent.auth.eyebrow}
              isMobileView={isMobileView}
              text={adminContent.auth.headerText}
              title={siteContent.coupleName}
            />
          </CinematicStaggeredRevealItem>

          <CinematicStaggeredRevealItem index={1} isVisible={adminInView}>
            {isAuthenticated ? (
              <AdminDashboard />
            ) : (
              <AdminLogin
                canSubmit={canSubmit}
                error={error}
                loading={loading}
                onPasswordChange={setPassword}
                onSubmit={handleSubmit}
                password={password}
              />
            )}
          </CinematicStaggeredRevealItem>
        </div>
      </CinematicSection>
    </CinematicPage>
  );
}

function AdminLogin({
  canSubmit,
  error,
  loading,
  onPasswordChange,
  onSubmit,
  password,
}) {
  return (
    <FormCard className="mx-auto w-full max-w-md">
      <form onSubmit={onSubmit}>
        <div className="mb-6 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-strong)] bg-white/60 text-[var(--color-accent-dark)]">
            <LockKeyhole size={20} strokeWidth={1.7} />
          </div>

          <div>
            <h2 className="font-serif text-3xl leading-none text-[var(--color-accent-dark)]">
              Acceso admin
            </h2>

            <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted)]">
              {adminContent.auth.loginText}
            </p>
          </div>
        </div>

        <Label>{adminContent.auth.passwordLabel}</Label>

        <input
          autoComplete="current-password"
          autoFocus
          className={inputClassName}
          disabled={loading}
          onChange={(event) => {
            onPasswordChange(event.target.value);
          }}
          placeholder={adminContent.auth.passwordPlaceholder}
          type="password"
          value={password}
        />

        <FieldError>{error}</FieldError>

        <div className="mt-6 flex flex-col gap-3">
          <IconButton
            disabled={!canSubmit || loading}
            icon={<LogIn size={16} strokeWidth={1.8} />}
            showText="always"
            tone="primary"
            type="submit"
          >
            Entrar
          </IconButton>

          <IconButton
            disabled={loading}
            icon={<Home size={16} strokeWidth={1.8} />}
            showText="always"
            to="/"
            tone="terciary"
          >
            Volver al inicio
          </IconButton>
        </div>
      </form>
    </FormCard>
  );
}

function AdminDashboard() {
  const [hasPendingChanges, setHasPendingChanges] = useState(
    hasAdminPendingChanges,
  );
  const [saving, setSaving] = useState(false);
  const blocker = useUnsavedChangesNavigation(hasPendingChanges);
  const refreshPendingChanges = () =>
    setHasPendingChanges(hasAdminPendingChanges());
  const handleDiscard = () => {
    discardAdminPendingChanges();
    refreshPendingChanges();
  };
  const handleSave = async () => {
    if (!hasPendingChanges || saving) return;

    setSaving(true);

    try {
      await saveAdminPendingChanges({ password: ADMIN_PASSWORD });
      refreshPendingChanges();
    } finally {
      setSaving(false);
    }
  };
  const handleCancelNavigation = () => {
    blocker.reset?.();
  };
  const handleConfirmNavigation = () => {
    blocker.proceed?.();
  };

  useEffect(() => {
    const intervalId = window.setInterval(refreshPendingChanges, 500);

    return () => window.clearInterval(intervalId);
  }, []);

  const pendingChanges = getAdminPendingChangesSummary();

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      {saving && <Spinner text={adminContent.guests.spinner.saveChanges} />}

      {blocker.state === "blocked" && (
        <UnsavedChangesDialog
          actions={[
            {
              icon: <Trash2 size={16} strokeWidth={1.8} />,
              label: adminContent.tables.dialogs.exitWithoutSaving,
              onClick: handleConfirmNavigation,
              tone: "danger",
            },
            {
              icon: <X size={16} strokeWidth={1.8} />,
              label: adminContent.tables.dialogs.keepEditing,
              onClick: handleCancelNavigation,
              tone: "terciary",
            },
          ]}
          changes={pendingChanges}
          labels={{
            eyebrow: adminContent.tables.dialogs.unsavedEyebrow,
            text: "Tienes cambios pendientes en memoria. Si sales ahora, se perderan.",
            title: adminContent.tables.dialogs.unsavedTitle,
          }}
          titleId="admin-dashboard-pending-changes-title"
        />
      )}

      <AdminPendingChangesActions
        changes={pendingChanges}
        discardDialogText="Se desharan los cambios pendientes de invitados, mesas y proveedores."
        discardDialogTitle="Deshacer cambios de admin"
        hasPendingChanges={hasPendingChanges}
        onDiscard={handleDiscard}
        onSave={handleSave}
        saveDialogText="Puedes deshacer todos los cambios pendientes, guardarlos en Apps Script o seguir editando."
        saveDialogTitle="Guardar cambios de admin"
        saving={saving}
        showText="always"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {siteContent.admin.cards.map((card, index) => (
          <AnimatedInfoCard
            key={card.title}
            card={getAdminCard(card)}
            index={Math.min(index, 2)}
          />
        ))}
      </div>
    </div>
  );
}
