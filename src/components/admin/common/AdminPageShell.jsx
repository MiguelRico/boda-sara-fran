import CinematicSection from "../../cinematic/CinematicSection";
import CinematicStaggeredRevealItem from "../../cinematic/CinematicStaggeredRevealItem";
import HeaderSection from "../../ui/HeaderSection";

export default function AdminPageShell({
  children,
  header,
  innerClassName = "max-w-6xl py-6",
  isVisible,
  rootRef,
}) {
  return (
    <CinematicSection
      className="surface-soft admin-section"
      innerClassName={innerClassName}
      reveal={false}
    >
      <div ref={rootRef}>
        <CinematicStaggeredRevealItem index={0} isVisible={isVisible}>
          <HeaderSection
            eyebrow={header.eyebrow}
            text={header.text}
            title={header.title}
            titleAs="h1"
          />
        </CinematicStaggeredRevealItem>

        {children}
      </div>
    </CinematicSection>
  );
}
