import { Instagram, Youtube, Send, Facebook, Twitter, Music2, MessageCircle, Sparkles } from "lucide-react";
import { detectPlatform } from "@/lib/utils";

const ICONS: Record<string, any> = {
  instagram: Instagram,
  tiktok: Music2,
  youtube: Youtube,
  telegram: Send,
  facebook: Facebook,
  twitter: Twitter,
  whatsapp: MessageCircle,
  spotify: Music2,
  other: Sparkles,
};

export default function PlatformIcon({
  name,
  size = "md",
}: {
  name: string | null | undefined;
  size?: "sm" | "md";
}) {
  const meta = detectPlatform(name);
  const Icon = ICONS[meta.key] || Sparkles;
  const box = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const icon = size === "sm" ? 15 : 18;

  return (
    <div
      className={`flex ${box} shrink-0 items-center justify-center rounded-xl ${meta.bg} ${meta.text} shadow-sm`}
      title={meta.label}
    >
      <Icon size={icon} strokeWidth={2} />
    </div>
  );
}
