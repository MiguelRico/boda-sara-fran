import { FormCard } from "./FormPrimitives";
import { Plus } from "lucide-react";
import PrimaryButton from "../common/PrimaryButton";

export default function CreateInvitationCard({ onCreateNew }) {
  return (
    <FormCard>
      <div className="mb-4">
        <p className="section-eyebrow mb-3">Confirma tu invitación</p>

        <h2 className="font-serif text-3xl">Confirmar asistencia</h2>

        <p className="mt-2 text-sm leading-relaxed">
          Confirma tu asistencia y la de tu familia.
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row">
        <PrimaryButton
          className="flex-1"
          icon={<Plus size={16} strokeWidth={1.8} />}
          type="button"
          onClick={onCreateNew}
        >
          Crear nueva
        </PrimaryButton>
      </div>
    </FormCard>
  );
}
