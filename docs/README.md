# docs/

Catatan teknis yang dibutuhkan saat mengerjakan dan menguji fitur. Aturan kapan menulis di sini ada di `CONTRIBUTING.md` bagian 4.5.

| Folder   | Isi                                                                                         |
| -------- | ------------------------------------------------------------------------------------------- |
| `api/`   | Kontrak setiap route di `app/api/`: siapa yang boleh memanggil, input, respons, kode status |
| `qa/`    | Skenario uji per fitur, termasuk keadaan gagal                                              |
| `ui-ux/` | Design token (warna, font) dari `app/globals.css`                                           |

- Dokumen ditulis dari kode yang sebenarnya. Jangan menulis kontrak atau skenario untuk perilaku yang belum ada.
- Satu file per fitur atau per kelompok route, nama huruf kecil dengan tanda hubung (`langganan.md`, `admin-users.md`).
- Ikuti template di `README.md` folder masing-masing.
- Dokumen diperbarui di PR yang sama dengan perubahan kodenya.
