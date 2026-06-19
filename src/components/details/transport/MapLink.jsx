import { MapPin } from "lucide-react";

import IconButton from "../../ui/IconButton";

export default function MapLink({ className = "", href }) {
  if (!href) return null;

  return (
    <IconButton
      className={className}
      href={href}
      icon={<MapPin size={16} strokeWidth={1.8} />}
      showText="always"
      target="_blank"
      tone="primary"
    >
      Mapa
    </IconButton>
  );
}
