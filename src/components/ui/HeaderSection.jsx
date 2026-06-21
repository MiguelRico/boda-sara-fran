import useIsMobileView from "../../hooks/useIsMobileView";

export default function HeaderSection({
  eyebrow,
  title,
  text,
  titleAs = "h2",
  className = "",
  hideTextOnMobile = false,
  showTitleAndTextOnMobile = false,
  children,
}) {
  const isMobileView = useIsMobileView();
  const Title = titleAs;
  const textClassName =
    hideTextOnMobile && isMobileView ? "hidden" : "section-text";
  const shouldShowTitleAndText = !isMobileView || showTitleAndTextOnMobile;

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
