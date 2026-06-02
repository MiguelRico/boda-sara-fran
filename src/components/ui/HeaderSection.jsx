export default function HeaderSection({
  eyebrow,
  title,
  text,
  titleAs = "h2",
  className = "",
  hideTextOnMobile = false,
  children,
}) {
  const Title = titleAs;
  const textClassName = hideTextOnMobile
    ? "section-text hidden sm:block"
    : "section-text";

  return (
    <div className={`mx-auto max-w-3xl text-center ${className}`}>
      {eyebrow && <p className="section-eyebrow">{eyebrow}</p>}

      {title && <Title className="section-title">{title}</Title>}

      {text && <p className={textClassName}>{text}</p>}

      {children}
    </div>
  );
}
