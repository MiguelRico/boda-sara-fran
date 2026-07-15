import { useInView } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Armchair,
  Bell,
  ChartColumn,
  ClipboardCheck,
  Info,
  ListTodo,
  ReceiptText,
  Home,
  LockKeyhole,
  LogIn,
  X,
} from "lucide-react";

import { ADMIN_PASSWORD } from "../constants/admin";
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
import { siteContent } from "../config/siteContent";
import { adminContent } from "../constants/adminContent";
import { storageKeys } from "../config/storageKeys";
import useIsMobileView from "../hooks/useIsMobileView";
import { loadAdminDataOnce } from "../services/adminDataStore";
import {
  isAdminSessionAuthenticated,
  setAdminSessionAuthenticated,
  subscribeAdminAuthChange,
} from "../utils/adminSession";
import {
  getLocalStorageValue,
  setLocalStorageValue,
} from "../utils/browserStorage";

const adminCardIcons = {
  armchair: Armchair,
  bell: Bell,
  "chart-column": ChartColumn,
  "clipboard-check": ClipboardCheck,
  "list-todo": ListTodo,
  "receipt-text": ReceiptText,
};

const ADMIN_MEMORY_NOTICE_DISMISSED_KEY =
  storageKeys.adminMemoryNoticeDismissed;

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
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return isAdminSessionAuthenticated();
  });

  const canSubmit = useMemo(() => password.trim().length > 0, [password]);

  useEffect(() => {
    const syncAuthState = () => {
      setIsAuthenticated(isAdminSessionAuthenticated());
    };

    const unsubscribeAdminAuthChange = subscribeAdminAuthChange(syncAuthState);

    return () => {
      unsubscribeAdminAuthChange();
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const normalizedPassword = password.trim();

    if (normalizedPassword === ADMIN_PASSWORD) {
      try {
        setLoading(true);
        await loadAdminDataOnce({ password: normalizedPassword });
        setAdminSessionAuthenticated();
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
        innerClassName="max-w-md md:max-w-none py-6"
        reveal={false}
      >
        <div ref={adminRef}>
          <CinematicStaggeredRevealItem index={0} isVisible={adminInView}>
            <HeaderSection
              eyebrow={adminContent.auth.eyebrow}
              text={adminContent.auth.headerText}
              title={siteContent.coupleName}
              showTitleAndTextOnMobile
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
        <div className="flex items-start gap-4 mb-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-strong)] bg-white/60 text-[var(--color-accent-dark)]">
            <LockKeyhole size={20} strokeWidth={1.7} />
          </div>

          <div className="min-w-0 flex-1 text-center">
            <h2 className="font-serif text-3xl leading-none text-[var(--color-accent-dark)]">
              {adminContent.auth.loginTitle}
            </h2>

            <p className="mt-4 text-sm leading-relaxed text-[var(--color-muted)]">
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

        <div className="mt-4 flex flex-col gap-3">
          <IconButton
            disabled={!canSubmit || loading}
            icon={<LogIn size={16} strokeWidth={1.8} />}
            showText="always"
            tone="primary"
            type="submit"
          >
            {adminContent.auth.submit}
          </IconButton>

          <IconButton
            disabled={loading}
            icon={<Home size={16} strokeWidth={1.8} />}
            showText="always"
            to="/"
            tone="terciary"
          >
            {adminContent.auth.backHome}
          </IconButton>
        </div>
      </form>
    </FormCard>
  );
}

function AdminDashboard() {
  const isMobileView = useIsMobileView();
  const cardsGridClassName = isMobileView
    ? "grid gap-4"
    : "grid grid-cols-3 gap-5";

  return (
    <div className="mx-auto w-full max-w-none space-y-5">
      <AdminMemoryNotice />
      <div className={cardsGridClassName}>
        {siteContent.admin.cards.map((card, index) => (
          <AnimatedInfoCard
            key={card.title}
            card={{
              ...getAdminCard(card),
              showAction: isMobileView,
            }}
            index={Math.min(index, 2)}
          />
        ))}
      </div>
    </div>
  );
}

function AdminMemoryNotice() {
  const [hideForever, setHideForever] = useState(false);
  const [visible, setVisible] = useState(() => {
    return getLocalStorageValue(ADMIN_MEMORY_NOTICE_DISMISSED_KEY) !== "true";
  });

  const handleClose = () => {
    if (hideForever) {
      setLocalStorageValue(ADMIN_MEMORY_NOTICE_DISMISSED_KEY, "true");
    }

    setVisible(false);
  };

  if (!visible) return null;

  return (
    <section className="rounded-[1.5rem] border border-[var(--color-border)] bg-white/45 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-strong)] bg-white/60 text-[var(--color-accent-dark)]">
          <Info size={17} strokeWidth={1.8} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-relaxed text-[var(--color-muted)]">
            {adminContent.auth.memoryNotice}
          </p>

          <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs font-medium text-[var(--color-muted)]">
            <input
              checked={hideForever}
              className="h-4 w-4 rounded border-[var(--color-border-strong)] accent-[var(--color-accent-dark)]"
              onChange={(event) => setHideForever(event.target.checked)}
              type="checkbox"
            />
            {adminContent.auth.memoryNoticeHideForever}
          </label>
        </div>
        <IconButton
          icon={<X size={15} strokeWidth={1.9} />}
          label={adminContent.auth.memoryNoticeDismiss}
          onClick={handleClose}
          tone="terciary"
          type="button"
        />
      </div>
    </section>
  );
}
