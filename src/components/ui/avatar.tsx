"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { gradientFor } from "@/lib/data/images";

const sizes = {
  xs: "h-7 w-7 text-[10px]",
  sm: "h-9 w-9 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-16 w-16 text-lg",
  xl: "h-24 w-24 text-2xl",
};

export function Avatar({
  src,
  name,
  size = "md",
  className,
}: {
  src?: string;
  name: string;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setFailed(false);
    setLoaded(false);
    if (!src) return;
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
      return;
    }
    const timer = setTimeout(() => {
      if (!imgRef.current?.complete || imgRef.current.naturalWidth === 0) {
        setFailed(true);
      }
    }, 3500);
    return () => clearTimeout(timer);
  }, [src]);

  const parts = name.trim().split(/\s+/);
  const inits =
    (parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "");

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-medium text-white",
        sizes[size],
        className,
      )}
      style={{ backgroundImage: gradientFor(name) }}
    >
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={imgRef}
          src={src}
          alt={name}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn(
            "h-full w-full object-cover transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0",
          )}
        />
      ) : (
        <span className="text-primary-hover/80">{inits.toUpperCase()}</span>
      )}
      {src && !failed && !loaded ? (
        <span className="absolute text-primary-hover/80">
          {inits.toUpperCase()}
        </span>
      ) : null}
    </span>
  );
}
