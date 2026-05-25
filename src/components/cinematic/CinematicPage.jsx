export default function CinematicPage({ children, className = "" }) {
  return <main className={`cinematic-page ${className}`}>{children}</main>;
}
