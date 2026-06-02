import { Home, Search } from "lucide-react";
import IconButton from "../ui/IconButton";
import { FieldError, FormCard, inputClassName, Label } from "./FormPrimitives";

export default function SearchInvitationCard({
  email,
  emailError,
  loading,
  onEmailChange,
  onSearchInvitation,
  hideTextOnMobile = false,
}) {
  const textClassName = hideTextOnMobile
    ? "hidden sm:block mt-3 text-sm leading-relaxed"
    : " mt-3 text-sm leading-relaxed";
  return (
    <FormCard className="mt-6">
      <div className="mb-4">
        <p className="section-eyebrow mb-3">Buscar invitación</p>

        <h2 className="font-serif text-3xl">Modificar tu confirmación</h2>

        <p className={textClassName}>
          Busca por email asociado a tu confirmación.
        </p>
      </div>

      <div className="mb-4">
        <Label>Email</Label>

        <input
          className={inputClassName}
          onChange={(event) => onEmailChange(event.target.value)}
          placeholder="Ej: ejemplo@email.com"
          type="email"
          value={email}
        />

        <FieldError>{emailError}</FieldError>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row-reverse">
        <IconButton
          className="flex-1"
          disabled={loading}
          icon={<Search size={16} strokeWidth={1.8} />}
          onClick={onSearchInvitation}
          showText="always"
          tone="primary"
          type="button"
        >
          Buscar mi confirmación
        </IconButton>

        <IconButton
          className="flex-1"
          icon={<Home size={16} strokeWidth={1.8} />}
          showText="always"
          to="/"
          tone="terciary"
        >
          Volver al inicio
        </IconButton>
      </div>
    </FormCard>
  );
}
