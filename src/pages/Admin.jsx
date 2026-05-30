import { useMemo, useState } from "react";
import { BarChart3, LockKeyhole, LogOut, UsersRound } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { ADMIN_PASSWORD, ADMIN_SESSION_KEY } from "../constants/admin";
import PrimaryButton from "../components/common/PrimaryButton";
import { FieldError, FormCard, inputClassName, Label } from "../components/rsvp/FormPrimitives";

const adminSections = [
  {
    title: "Invitados",
    description: "Gestionar confirmaciones, datos de contacto, alergias y transporte.",
    icon: UsersRound,
  },
  {
    title: "Estadisticas",
    description: "Consultar totales, asistencia, alergias y horarios de autobus.",
    icon: BarChart3,
  },
];

export default function Admin() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return window.sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
  });

  const canSubmit = useMemo(() => password.trim().length > 0, [password]);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (password === ADMIN_PASSWORD) {
      window.sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
      setIsAuthenticated(true);
      setError("");
      setPassword("");
      return;
    }

    setError("La contraseña no es correcta.");
  };

  const handleLogout = () => {
    window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setIsAuthenticated(false);
    setPassword("");
    setError("");
  };

  return (
    <main className="min-h-screen bg-[var(--color-bg-soft)] px-5 py-6 sm:px-8 lg:px-12">
      <section className="mx-auto flex min-h-[calc(100svh-3rem)] w-full max-w-5xl flex-col justify-center">
        <div className="mb-8 text-center">
          <p className="section-eyebrow">Panel privado</p>

          <h1 className="section-title">Sara & Fran</h1>

          <p className="section-text">
            Acceso reservado para revisar y organizar las confirmaciones de la boda.
          </p>
        </div>

        {isAuthenticated ? (
          <AdminDashboard onLogout={handleLogout} onNavigate={navigate} />
        ) : (
          <AdminLogin
            canSubmit={canSubmit}
            error={error}
            onPasswordChange={setPassword}
            onSubmit={handleSubmit}
            password={password}
          />
        )}
      </section>
    </main>
  );
}

function AdminLogin({ canSubmit, error, onPasswordChange, onSubmit, password }) {
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
          <button className="btn-primary disabled:cursor-not-allowed disabled:opacity-50" disabled={!canSubmit} type="submit">
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

function AdminDashboard({ onLogout, onNavigate }) {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="section-eyebrow mb-2">Gestion</p>
          <h2 className="font-serif text-4xl leading-none text-[var(--color-accent-dark)] sm:text-5xl">
            Panel de invitados
          </h2>
        </div>

        <button className="btn-secondary gap-2" onClick={onLogout} type="button">
          <LogOut size={16} strokeWidth={1.8} />
          Salir
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {adminSections.map((section) => (
          <button
            className="premium-card group min-h-56 text-left"
            key={section.title}
            onClick={() => {
              if (section.title === "Invitados") {
                onNavigate("/admin/invitados");
              }

              if (section.title === "Estadisticas") {
                onNavigate("/admin/estadisticas");
              }
            }}
            type="button"
          >
            <div className="flex h-full flex-col justify-between gap-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--color-border-strong)] bg-white/60 text-[var(--color-accent-dark)] transition group-hover:bg-white">
                <section.icon size={21} strokeWidth={1.7} />
              </div>

              <div>
                <h3 className="font-serif text-4xl leading-none text-[var(--color-accent-dark)]">
                  {section.title}
                </h3>

                <p className="mt-4 text-sm leading-relaxed text-[var(--color-muted)]">
                  {section.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
