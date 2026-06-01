import IconButton from "../ui/IconButton";
import { Home, Search } from "lucide-react";
import { FieldError, FormCard, inputClassName, Label } from "./FormPrimitives";

export default function SearchInvitationCard({
  groupName,
  groupNameError,
  loading,
  onGroupNameChange,
  onSearchInvitation,
}) {
  return (
    <FormCard className="mt-6">
      <div className="mb-4">
        <p className="section-eyebrow mb-3">Buscar invitación</p>

        <h2 className="font-serif text-3xl">Modificar tu confirmación</h2>

        <p className="mt-3 text-sm leading-relaxed">
          Introduce el nombre de grupo asociado a tu confirmación.
        </p>
      </div>

      <div className="mb-4">
        <Label>Nombre de grupo</Label>

        <input
          type="text"
          value={groupName}
          onChange={(event) => onGroupNameChange(event.target.value)}
          className={inputClassName}
          placeholder="Ej: Familia Garcia"
        />

        <FieldError>{groupNameError}</FieldError>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <IconButton
          className="flex-1"
          icon={<Search size={16} strokeWidth={1.8} />}
          showText="always"
          tone="primary"
          type="button"
          onClick={onSearchInvitation}
          disabled={loading}
        >
          Buscar mi confirmación
        </IconButton>

        <IconButton
          className="flex-1"
          icon={<Home size={16} strokeWidth={1.8} />}
          showText="always"
          to="/"
          tone="secondary"
        >
          Volver al inicio
        </IconButton>
      </div>
    </FormCard>
  );
}
