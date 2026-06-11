import EditorDialog from "./EditorDialog";

export default function AdminEditorDialog({
  children,
  onClose,
  title,
  titleId = "admin-editor-title",
}) {
  return (
    <EditorDialog onClose={onClose} title={title} titleId={titleId}>
      {children}
    </EditorDialog>
  );
}
