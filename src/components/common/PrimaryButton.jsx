import IconButton from "./IconButton";

export default function PrimaryButton({
  children,
  icon,
  showText = true,
  variant = "primary",
  ...props
}) {
  return (
    <IconButton
      icon={icon}
      showText={showText}
      tone={variant === "secondary" ? "secondary" : "primary"}
      {...props}
    >
      {children}
    </IconButton>
  );
}
