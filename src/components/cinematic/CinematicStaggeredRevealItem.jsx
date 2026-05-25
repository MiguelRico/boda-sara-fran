import { motion, useReducedMotion } from "framer-motion";

export default function CinematicStaggeredRevealItem({
  as = "div",
  children,
  className = "",
  index = 0,
  isVisible,
}) {
  const reduceMotion = useReducedMotion();
  const MotionComponent = motion[as] || motion.div;
  const hiddenState = reduceMotion
    ? { opacity: 0 }
    : { opacity: 0, y: 24, filter: "blur(8px)" };
  const visibleState = reduceMotion
    ? { opacity: 1 }
    : { opacity: 1, y: 0, filter: "blur(0px)" };

  return (
    <MotionComponent
      initial={hiddenState}
      animate={isVisible ? visibleState : hiddenState}
      transition={{
        duration: 0.8,
        delay: isVisible ? index * 0.06 : 0,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {children}
    </MotionComponent>
  );
}
