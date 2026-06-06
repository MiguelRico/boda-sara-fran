import { Armchair } from "lucide-react";

import AdminEditorDialog from "../AdminEditorDialog";
import TableForm from "../TableForm";

export default function TableEditorDialog({
  content,
  errors,
  form,
  onCancel,
  onChange,
  onDelete,
  onSubmit,
  seatReductionWarning = [],
  title = "Crear mesa",
}) {
  return (
    <AdminEditorDialog
      icon={<Armchair size={22} strokeWidth={1.8} />}
      onClose={onCancel}
      title={title}
      titleId="table-editor-title"
    >
      <TableForm
        content={content}
        errors={errors}
        form={form}
        onCancel={onCancel}
        onChange={onChange}
        onDelete={onDelete}
        onSubmit={onSubmit}
        seatReductionWarning={seatReductionWarning}
      />
    </AdminEditorDialog>
  );
}
