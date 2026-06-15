import { MapPin } from "lucide-react";

import IconButton from "../../ui/IconButton";

export default function MapLink({ href }) {
  if (!href) return null;

  return (
    <IconButton
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
