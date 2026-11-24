import Image from "next/image";
import { buildImageKitUrl } from "@/lib/imagekit";

type GambarProdukProps = {
  src?: string | null;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  aspectRatio?: string;
};

export function GambarProduk({
  src,
  alt,
  className = "",
  width,
  height,
  fill = false,
  priority = false,
  aspectRatio,
}: GambarProdukProps) {
  if (!src) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-100 text-slate-400 text-xs ${className}`}
      >
        No Image
      </div>
    );
  }

  // Jika domain ImageKit, optimasi URL
  const optimizedSrc = buildImageKitUrl(src, {
    width: width || (fill ? 800 : 400),
    height,
    quality: 80,
    aspectRatio,
  });

  const isRemoteImageKit = optimizedSrc.startsWith("https://ik.imagekit.io");

  if (isRemoteImageKit) {
    if (fill) {
      return (
        <Image
          src={optimizedSrc}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className={className}
          preload={priority ? true : undefined}
        />
      );
    }

    return (
      <Image
        src={optimizedSrc}
        alt={alt}
        width={width || 400}
        height={height || 400}
        className={className}
        preload={priority ? true : undefined}
      />
    );
  }

  // Fallback untuk path lokal seperti /img/produk/1.png atau URL eksternal lainnya
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={optimizedSrc}
      alt={alt}
      className={className}
      loading={priority ? "eager" : "lazy"}
    />
  );
}
