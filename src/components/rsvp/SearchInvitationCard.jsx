import {
  FieldError,
  FormCard,
  inputClassName,
  Label,
} from "./RsvpFormPrimitives";
import PrimaryButton from "../common/PrimaryButton";

export default function SearchInvitationCard({
  email,
  emailError,
  loading,
  onCreateNew,
  onEmailChange,
  onSearchInvitation,
}) {
  return (
    <FormCard>
      <div className="mb-8">
        <p className="section-eyebrow mb-3">Buscar invitación</p>

        <h2 className="font-serif text-3xl text-[#2f2a25]">
          Busca tu confirmación
        </h2>

        <p className="mt-3 text-sm leading-relaxed text-[#7b6b5d]">
          Introduce el email asociado a tu confirmación para modificarla o
          revisarla.
        </p>
      </div>

      <div className="mb-6">
        <Label>Email de contacto</Label>

        <input
          type="email"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          className={inputClassName}
          placeholder="ejemplo@email.com"
        />

        <FieldError>{emailError}</FieldError>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <button
          type="button"
          onClick={onSearchInvitation}
          disabled={loading}
          className="btn-primary flex-1 disabled:opacity-50"
        >
          Buscar mi confirmación
        </button>

        <button
          type="button"
          onClick={onCreateNew}
          className="btn-secondary flex-1"
        >
          Crear nueva
        </button>

        <PrimaryButton to="/" variant="secondary">
          Volver al inicio
        </PrimaryButton>
      </div>
    </FormCard>
  );
}
