"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { gradientFor } from "@/lib/data/images";

interface SmartImageProps {
  src?: string;
  alt: string;
  className?: string;
  /** used to pick a deterministic gradient fallback */
  fallbackKey?: string;
  rounded?: string;
}

export function SmartImage({
  src,
  alt,
  className,
  fallbackKey,
  rounded,
}: SmartImageProps) {
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

  const showFallback = !src || failed;

  return (
    <div
      className={cn("relative overflow-hidden bg-surface-sunken", rounded, className)}
      style={
        showFallback || !loaded
          ? { backgroundImage: gradientFor(fallbackKey ?? alt) }
          : undefined
      }
    >
      {!showFallback ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn(
            "h-full w-full object-cover transition-opacity duration-500",
            loaded ? "opacity-100" : "opacity-0",
          )}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <span className="font-serif text-2xl text-white/70">
            {alt.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
    </div>
  );
}
