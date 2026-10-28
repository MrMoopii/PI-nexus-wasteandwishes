import Image from "next/image";

export default function GambarEvent({
  src,
  alt,
  sizes,
  className,
  preload,
}: {
  src: string | null;
  alt: string;
  sizes: string;
  className?: string;
  preload?: boolean;
}) {
  // Kalau src kosong, tampilkan pesan "Tidak ada gambar"

  if (!src) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-(--hx-sunk) text-xs text-(--hx-ink-3)">
        Tidak ada gambar
      </div>
    );
  }

  // Kalau ada, kembalikan <Image> dengan src apa adanya
  return (
    <Image
      src={src}
      alt={alt}
      sizes={sizes}
      className={className}
      preload={preload}
      fill
      unoptimized
    />
  );
}
