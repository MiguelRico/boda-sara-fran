import { useInView } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { LockKeyhole } from "lucide-react";

import {
  ADMIN_AUTH_EVENT,
  ADMIN_PASSWORD,
  ADMIN_SESSION_KEY,
} from "../constants/admin";
import CinematicPage from "../components/cinematic/CinematicPage";
import CinematicSection from "../components/cinematic/CinematicSection";
import CinematicStaggeredRevealItem from "../components/cinematic/CinematicStaggeredRevealItem";
import HeaderSection from "../components/common/HeaderSection";
import PrimaryButton from "../components/common/PrimaryButton";
import AnimatedInfoCard from "../components/common/AnimatedInfoCard";
import {
  FieldError,
  FormCard,
  inputClassName,
  Label,
} from "../components/rsvp/FormPrimitives";

const adminCards = [
  {
    title: "Invitados",
    subtitle: "Gestiona la lista",
    description:
      "Gestionar confirmaciones, datos de contacto, alergias y transporte.",
    to: "/admin/guests",
    emoji: "📋",
  },

  {
    title: "Resumen",
    subtitle: "Todo en un vistazo",
    description:
      "Consultar totales, asistencia, alergias y horarios de autobus.",
    to: "/admin/stats",
    emoji: "📊",
  },
];

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

    setError("La contraseña no es correcta.");
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
              eyebrow="Panel privado"
              text="Acceso reservado para revisar y organizar las confirmaciones de la boda."
              title="Sara & Fran"
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
              Introduce la contraseña para entrar al panel de gestion.
            </p>
          </div>
        </div>

        <Label>Contraseña</Label>

        <input
          autoComplete="current-password"
          autoFocus
          className={inputClassName}
          onChange={(event) => {
            onPasswordChange(event.target.value);
          }}
          placeholder="Contraseña privada"
          type="password"
          value={password}
        />

        <FieldError>{error}</FieldError>

        <div className="mt-6 flex flex-col gap-3">
          <button
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canSubmit}
            type="submit"
          >
            Entrar
          </button>

          <PrimaryButton to="/" variant="secondary">
            Volver al inicio
          </PrimaryButton>
        </div>
      </form>
    </FormCard>
  );
}

function AdminDashboard() {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="grid gap-4 sm:grid-cols-2">
        {adminCards.map((card, index) => (
          <AnimatedInfoCard key={card.title} card={card} index={index} />
        ))}
      </div>
    </div>
  );
}
