import { motion, useReducedMotion } from "framer-motion";

export default function CinematicRevealItem({
  children,
  className = "",
  delay = 0,
  amount = 0.35,
  once = true,
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={
        reduceMotion
          ? { opacity: 0 }
          : { opacity: 0, y: 42, scale: 0.985, filter: "blur(10px)" }
      }
      whileInView={
        reduceMotion
          ? { opacity: 1 }
          : { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }
      }
      viewport={{ once, amount }}
      transition={{
        duration: 1.15,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
