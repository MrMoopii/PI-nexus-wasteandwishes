import { z } from "zod";

// Skema input pembayaran langganan (kode tugas 1.6, CONTRIBUTING 9.8).
// Jumlah bayar sengaja tidak ada di skema mana pun: selalu dibaca dari
// pengajuan_langganan.harga_final di server (CONTRIBUTING 9.7).

const ID_TIDAK_VALID = { error: "Pengajuan tidak valid." };

/** Isian tombol bayar pelanggan: hanya ID pengajuan yang ingin dibayar. */
export const skemaMulaiPembayaran = z.object({
  idPengajuan: z.coerce
    .number(ID_TIDAK_VALID)
    .int(ID_TIDAK_VALID)
    .positive(ID_TIDAK_VALID),
});

export type InputMulaiPembayaran = z.infer<typeof skemaMulaiPembayaran>;

/**
 * Body notifikasi yang dikirim Midtrans ke webhook. Hanya transaction_id yang dipakai,
 * karena status transaksi dibaca ulang dari Midtrans lewat transaction.notification().
 */
export const skemaPayloadNotifikasi = z.object({
  transaction_id: z.string().trim().min(1),
});

// Midtrans mengirim nominal sebagai teks desimal, misalnya "150000.00".
const POLA_NOMINAL = /^\d+(\.\d{1,2})?$/;

/**
 * Data transaksi hasil verifikasi Midtrans (kembalian transaction.notification()) yang
 * dipakai webhook. transaction_status sengaja teks bebas: status yang tidak dikenal
 * diabaikan webhook, bukan ditolak, supaya Midtrans tidak mengirim ulang terus-menerus.
 */
export const skemaNotifikasiMidtrans = z.object({
  order_id: z.string().trim().min(1),
  transaction_status: z.string().min(1),
  fraud_status: z.string().nullish(),
  transaction_id: z.string().nullish(),
  gross_amount: z.string().regex(POLA_NOMINAL).transform(Number),
});

export type NotifikasiMidtrans = z.infer<typeof skemaNotifikasiMidtrans>;
