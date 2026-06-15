export default function HeaderSection({
  eyebrow,
  title,
  text,
  titleAs = "h2",
  className = "",
  hideTextOnMobile = false,
  isMobileView = false,
  children,
}) {
  const Title = titleAs;
  const textClassName = hideTextOnMobile ? "hidden" : "section-text";
  const shouldShowTitleAndText = !isMobileView;

  return (
    <div className={`mx-auto max-w-3xl text-center ${className}`}>
      {eyebrow && <p className="section-eyebrow">{eyebrow}</p>}

      {shouldShowTitleAndText && title && (
        <Title className="section-title">{title}</Title>
      )}

      {shouldShowTitleAndText && text && (
        <p className={textClassName}>{text}</p>
      )}

      {children}
    </div>
  );
}
