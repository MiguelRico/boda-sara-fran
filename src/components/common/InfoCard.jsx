import { Link } from "react-router-dom";

export default function InfoCard({
  title,
  subtitle,
  description,
  to,
  emoji,
  className = "",
}) {
  return (
    <Link
      to={to}
      className={`
        premium-card
        group
        block
        cursor-pointer
        ${className}
      `}
    >
      <div className="flex h-full flex-col">
        <p className="text-xs uppercase tracking-[0.28em] text-[#9b7a61]">
          <span className="text-xl">{emoji}</span>
          {subtitle}
        </p>

        <h3 className="mt-5 font-serif text-3xl leading-tight text-[#2f2a25] sm:text-4xl">
          {title}
        </h3>

        <p className="mt-5 flex-1 text-sm leading-relaxed text-[#7b6b5d] sm:text-base">
          {description}
        </p>

        <div className="mt-10 flex items-center gap-3 text-sm uppercase tracking-[0.18em] text-[#8f6f56]">
          <span className="transition-transform duration-500 group-hover:translate-x-1">
            Ver detalles
          </span>

          <span className="h-px w-8 bg-[#d8c1ad]" />
        </div>
      </div>
    </Link>
  );
}
