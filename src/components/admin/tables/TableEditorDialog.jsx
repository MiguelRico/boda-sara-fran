import { EditorDialog as AdminEditorDialog } from "../common";
import { tableContent } from "../../../constants/tableContent";
import TableForm from "./TableForm";

export default function TableEditorDialog({
  content,
  errors,
  form,
  onCancel,
  onChange,
  onSubmit,
  seatReductionWarning = [],
  submitDisabled = false,
  title = tableContent.form.title,
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
        submitDisabled={submitDisabled}
      />
    </AdminEditorDialog>
  );
}
