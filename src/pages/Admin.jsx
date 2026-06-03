import { useInView } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Armchair,
  ChartColumn,
  ClipboardCheck,
  Home,
  LockKeyhole,
  LogIn,
} from "lucide-react";

import {
  ADMIN_AUTH_EVENT,
  ADMIN_PASSWORD,
  ADMIN_SESSION_KEY,
} from "../constants/admin";
import AnimatedInfoCard from "../components/ui/AnimatedInfoCard";
import HeaderSection from "../components/ui/HeaderSection";
import IconButton from "../components/ui/IconButton";
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

const adminCardIcons = {
  Invitados: ClipboardCheck,
  Resumen: ChartColumn,
  Mesas: Armchair,
};

const getAdminCard = (card) => {
  const Icon = adminCardIcons[card.title];

  if (!Icon) return card;

  return {
    ...card,
    backgroundIcon: <Icon size={72} strokeWidth={1.5} />,
    emoji: <Icon size={22} strokeWidth={1.8} />,
  };
};

export default function Admin() {
  const adminRef = useRef(null);
  const adminInView = useInView(adminRef, {
    once: true,
    amount: 0.35,
  });
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
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

  const handleSubmit = (event) => {
    event.preventDefault();

    if (password === ADMIN_PASSWORD) {
      window.sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
      window.dispatchEvent(new Event(ADMIN_AUTH_EVENT));
      setIsAuthenticated(true);
      setError("");
      setPassword("");
      return;
    }

    setError(adminContent.auth.error);
  };

  return (
    <CinematicPage>
      <CinematicSection
        className="surface-soft"
        innerClassName="max-w-5xl"
        reveal={false}
      >
        <div ref={adminRef}>
          <CinematicStaggeredRevealItem index={0} isVisible={adminInView}>
            <HeaderSection
              className="mb-8"
              eyebrow={adminContent.auth.eyebrow}
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
            disabled={!canSubmit}
            icon={<LogIn size={16} strokeWidth={1.8} />}
            showText="always"
            tone="primary"
            type="submit"
          >
            Entrar
          </IconButton>

          <IconButton
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
  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {siteContent.admin.cards.map((card, index) => (
          <AnimatedInfoCard
            key={card.title}
            card={getAdminCard(card)}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}
