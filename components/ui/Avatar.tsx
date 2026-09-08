import Image from "next/image";
import { tints } from "@/lib/theme";

export function Avatar({
  photo,
  emoji,
  tint = "lilac",
  size = 40,
}: {
  photo?: string;
  emoji?: string;
  tint?: string;
  size?: number;
}) {
  if (photo) {
    return (
      <Image
        src={photo}
        alt=""
        width={size}
        height={size}
        className="rounded-full bg-(--color-border) object-cover"
        style={{ width: size, height: size }}
        unoptimized
      />
    );
  }
  return (
    <div
      className="flex items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        backgroundColor: tints[tint] ?? tints.lilac,
      }}
    >
      <span style={{ fontSize: size * 0.45 }}>{emoji ?? "🎁"}</span>
    </div>
  );
}
