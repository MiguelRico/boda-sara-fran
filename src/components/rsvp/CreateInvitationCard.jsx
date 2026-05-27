import { FieldError, FormCard, inputClassName, Label } from "./FormPrimitives";
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
        <p className="section-eyebrow mb-3">Confirma tu invitación</p>

        <h2 className="font-serif text-3xl text-[#2f2a25]">
          Confirmar asistencia
        </h2>

        <p className="mt-3 text-sm leading-relaxed text-[#7b6b5d]">
          Confirma tu asistencia y la de tu familia
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <button
          type="button"
          onClick={onCreateNew}
          className="btn-primary flex-1"
        >
          Crear nueva
        </button>
      </div>
    </FormCard>
  );
}
