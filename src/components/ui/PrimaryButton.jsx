import { Link } from "react-router-dom";

export default function PrimaryButton({
  children,
  to,
  variant = "primary",
  className = "",
  ...props
}) {
  const buttonClass = variant === "secondary" ? "btn-secondary" : "btn-primary";

  if (to) {
    return (
      <Link to={to} className={`${buttonClass} ${className}`} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button className={`${buttonClass} ${className}`} {...props}>
      {children}
    </button>
  );
}
