import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Batas panjang file kode (CONTRIBUTING.md bagian 4.2 no. 9).
// Semua baris dihitung, termasuk baris kosong dan komentar.
const BATAS_BARIS = {
  max: 300,
  skipBlankLines: false,
  skipComments: false,
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["**/*.{js,jsx,mjs,cjs,ts,tsx}"],
    rules: {
      "max-lines": ["error", BATAS_BARIS],
    },
  },
  // Pengecualian sementara: hanya peringatan, bukan error.
  // Berisi skema database dan file yang sudah melebihi 300 baris sebelum
  // aturan ini dibuat (23 Nov 2026). File di sini TIDAK boleh bertambah panjang.
  // Setelah sebuah file dipecah, hapus namanya dari daftar ini.
  // Jangan menambah file baru ke daftar ini.
  {
    files: [
      "components/admin/ImageKitUpload.tsx",
      "app/event/actions.ts",
      "components/admin/ImageKitEventUpload.tsx",
      "app/admin/users/UsersManagementContent.tsx",
      "components/event-slider/EventSlider.tsx",
      "components/profile/ProfilContent.tsx",
      "components/admin/ProdukForm.tsx",
      "app/admin/jadwal-pengambilan/JadwalManagementContent.tsx",
      "app/admin/reports/page.tsx",
      "app/admin/produk/ProdukContent.tsx",
      "app/about/page.tsx",
    ],
    rules: {
      "max-lines": ["warn", BATAS_BARIS],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
