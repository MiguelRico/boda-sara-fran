import { motion, useReducedMotion } from "framer-motion";

export default function RevealOnView({
  as = "div",
  children,
  className = "",
  delay = 0,
  duration = 0.8,
  amount = 0.35,
  margin,
  once = true,
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
      whileInView={visibleState}
      viewport={{ once, amount, margin }}
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {children}
    </MotionComponent>
  );
}
