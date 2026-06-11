import AdminEditorDialog from "../AdminEditorDialog";
import TableForm from "../TableForm";

export default function TableEditorDialog({
  content,
  errors,
  form,
  onCancel,
  onChange,
  onSubmit,
  seatReductionWarning = [],
  title = "Crear mesa",
}) {
  return (
    <AdminEditorDialog
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
        onSubmit={onSubmit}
        seatReductionWarning={seatReductionWarning}
      />
    </AdminEditorDialog>
  );
}
