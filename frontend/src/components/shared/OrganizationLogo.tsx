import { useState } from "react";
import { type LogoCrop } from "@/types/studentTypesData";

export type LogoSizeVariant =
  "card" | "detail" | "saved" | "appTable" | "adminTable" | "custom";

export interface OrganizationLogoProps {
  src?: string | null;
  originalSrc?: string | null;
  crop?: LogoCrop | null;
  organization?: string;
  initials?: string;
  size?: LogoSizeVariant;
  alt?: string;
  className?: string;
  customSize?: { width: number; height: number; rounded?: string };
}

const SIZE_VARIANTS: Record<
  LogoSizeVariant,
  { width: number; height: number; wrapperClass: string; textSize: string }
> = {
  adminTable: {
    width: 32,
    height: 32,
    wrapperClass: "h-8 w-8 rounded-lg",
    textSize: "text-[11px]",
  },
  appTable: {
    width: 32,
    height: 32,
    wrapperClass: "h-8 w-8 rounded-lg",
    textSize: "text-[11px]",
  },
  card: {
    width: 40,
    height: 40,
    wrapperClass: "h-10 w-10 rounded-xl",
    textSize: "text-xs",
  },
  saved: {
    width: 40,
    height: 40,
    wrapperClass: "h-10 w-10 rounded-xl",
    textSize: "text-xs",
  },
  detail: {
    width: 64,
    height: 64,
    wrapperClass: "h-16 w-16 rounded-2xl",
    textSize: "text-base font-bold",
  },
  custom: {
    width: 40,
    height: 40,
    wrapperClass: "h-10 w-10 rounded-xl",
    textSize: "text-xs",
  },
};

function getOrganizationInitials(
  orgName?: string,
  fallbackInitials?: string
): string {
  if (fallbackInitials && fallbackInitials.trim()) {
    return fallbackInitials.trim().slice(0, 2).toUpperCase();
  }
  if (!orgName || !orgName.trim()) {
    return "OP";
  }
  const words = orgName.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}

export default function OrganizationLogo({
  src,
  originalSrc,
  crop,
  organization,
  initials,
  size = "card",
  alt = "Organization logo",
  className = "",
  customSize,
}: OrganizationLogoProps) {
  const [imgError, setImgError] = useState(false);

  const variantConfig = SIZE_VARIANTS[size] || SIZE_VARIANTS.card;
  const imageSource = originalSrc || src;
  const displayInitials = getOrganizationInitials(organization, initials);

  const wrapperClass = customSize?.rounded
    ? `overflow-hidden shrink-0 ${customSize.rounded}`
    : `overflow-hidden shrink-0 ${variantConfig.wrapperClass}`;

  const containerStyle = customSize
    ? { width: customSize.width, height: customSize.height }
    : { width: variantConfig.width, height: variantConfig.height };

  // Initials fallback when no image is provided or loading failed
  if (!imageSource || imgError) {
    return (
      <div
        className={`flex items-center justify-center bg-linear-to-br from-blue-600 to-indigo-700 font-bold text-white shadow-sm select-none ${variantConfig.textSize} ${wrapperClass} ${className}`}
        style={containerStyle}
        title={organization || "Organization"}
      >
        <span>{displayInitials}</span>
      </div>
    );
  }

  // Normalized crop coordinates renderer
  if (crop && crop.width > 0 && crop.height > 0) {
    const scaleX = 100 / crop.width;
    const scaleY = 100 / crop.height;
    const leftPercent = -crop.x * scaleX;
    const topPercent = -crop.y * scaleY;

    return (
      <div
        className={`relative overflow-hidden border border-slate-700/80 bg-slate-900 shadow-sm ${wrapperClass} ${className}`}
        style={containerStyle}
      >
        <img
          src={imageSource}
          alt={alt}
          className="absolute max-w-none pointer-events-none select-none"
          style={{
            width: `${scaleX}%`,
            height: `${scaleY}%`,
            left: `${leftPercent}%`,
            top: `${topPercent}%`,
          }}
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  // Standard cropped image view (no custom crop metadata)
  return (
    <div
      className={`relative overflow-hidden border border-slate-200/60 dark:border-slate-700/80 bg-slate-900 shadow-sm ${wrapperClass} ${className}`}
      style={containerStyle}
    >
      <img
        src={imageSource}
        alt={alt}
        className="h-full w-full object-cover select-none"
        onError={() => setImgError(true)}
      />
    </div>
  );
}
