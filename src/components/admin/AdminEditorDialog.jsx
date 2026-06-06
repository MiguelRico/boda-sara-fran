import EditorDialog from "./EditorDialog";

export default function AdminEditorDialog({
  children,
  icon,
  onClose,
  title,
  titleId = "admin-editor-title",
}) {
  return (
    <EditorDialog icon={icon} onClose={onClose} title={title} titleId={titleId}>
      {children}
    </EditorDialog>
  );
}
