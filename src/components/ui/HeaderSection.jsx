export default function HeaderSection({
  eyebrow,
  title,
  text,
  titleAs = "h2",
  className = "",
  children,
}) {
  const Title = titleAs;

  return (
    <div className={`mx-auto max-w-3xl text-center ${className}`}>
      {eyebrow && <p className="section-eyebrow">{eyebrow}</p>}

      {title && <Title className="section-title">{title}</Title>}

      {text && <p className="section-text">{text}</p>}

      {children}
    </div>
  );
}
