import ImageKit from "imagekit";

export function getImageKitConfig() {
  const publicKey =
    process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY ||
    process.env.IMAGEKIT_PUBLIC_KEY ||
    process.env.NEXT_PUBLIC_PUBLIC_KEY;

  const privateKey =
    process.env.IMAGEKIT_PRIVATE_KEY ||
    process.env.PRIVATE_KEY;

  const urlEndpoint =
    process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT ||
    process.env.IMAGEKIT_URL_ENDPOINT ||
    process.env.NEXT_PUBLIC_URL_ENDPOINT ||
    process.env.IMAGEKIT_ENDPOINT_URL ||
    process.env.IMAGEKIT_URL;

  return { publicKey, privateKey, urlEndpoint };
}

export function getImageKitServerInstance() {
  const { publicKey, privateKey, urlEndpoint } = getImageKitConfig();

  const missing: string[] = [];
  if (!publicKey) {
    missing.push("NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY (atau IMAGEKIT_PUBLIC_KEY)");
  }
  if (!privateKey) {
    missing.push("IMAGEKIT_PRIVATE_KEY");
  }
  if (!urlEndpoint) {
    missing.push(
      "NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT (atau IMAGEKIT_URL_ENDPOINT)",
    );
  }

  if (missing.length > 0) {
    throw new Error(
      `Konfigurasi ImageKit belum lengkap di .env.local: variabel [${missing.join(", ")}] belum disetel atau masih kosong.`,
    );
  }

  return new ImageKit({
    publicKey: publicKey!,
    privateKey: privateKey!,
    urlEndpoint: urlEndpoint!,
  });
}

export function getImageKitAuthParams() {
  const ik = getImageKitServerInstance();
  const { publicKey } = getImageKitConfig();
  const authParams = ik.getAuthenticationParameters();

  return {
    ...authParams,
    publicKey,
  };
}

export async function deleteImageKitFile(fileId: string): Promise<void> {
  if (!fileId) return;
  try {
    const ik = getImageKitServerInstance();
    await ik.deleteFile(fileId);
  } catch (err) {
    console.error("Gagal menghapus file dari ImageKit:", fileId, err);
  }
}

export async function deleteImageKitFiles(fileIds: string[]): Promise<void> {
  const filtered = fileIds.filter(Boolean);
  if (filtered.length === 0) return;

  try {
    const ik = getImageKitServerInstance();
    if (filtered.length === 1) {
      await ik.deleteFile(filtered[0]);
    } else {
      await ik.bulkDeleteFiles(filtered);
    }
  } catch (err) {
    console.error("Gagal menghapus kumpulan file dari ImageKit:", filtered, err);
  }
}

export function buildImageKitUrl(
  url: string | null | undefined,
  transformations?: {
    width?: number;
    height?: number;
    quality?: number;
    aspectRatio?: string;
  },
): string {
  if (!url) return "";

  // Jika bukan gambar ImageKit (misalnya path lokal /img/..), kembalikan apa adanya
  if (!url.includes("ik.imagekit.io")) {
    return url;
  }

  if (!transformations) return url;

  const parts: string[] = [];
  if (transformations.width) parts.push(`w-${transformations.width}`);
  if (transformations.height) parts.push(`h-${transformations.height}`);
  if (transformations.quality) parts.push(`q-${transformations.quality}`);
  if (transformations.aspectRatio) {
    parts.push(`ar-${transformations.aspectRatio}`);
  }

  if (parts.length === 0) return url;

  const trParam = `tr=${parts.join(",")}`;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}${trParam}`;
}
