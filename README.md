# VIMAXX VIP Tools — Full-stack

## Fitur
- Dashboard tools responsif, pencarian, filter kategori, popup tools.
- Tombol **Saluran 1** dan **Saluran 2** selalu tampil; tidak ada gerbang akses WhatsApp.
- Registrasi/login akun (password di-hash dengan bcrypt).
- Catatan pribadi dan riwayat penggunaan tools tersimpan di SQLite.
- Endpoint health-check dan API backend.

## Jalankan lokal
1. Install Node.js 20 atau lebih baru.
2. Salin `.env.example` menjadi `.env`.
3. Isi `JWT_SECRET` dengan secret acak panjang (minimal 32 karakter).
4. Ganti link saluran di `public/config.json`.
5. Jalankan:
   ```bash
   npm install
   npm start
   ```
6. Buka `http://localhost:3000`.

## Deploy
Deploy sebagai **Node.js web service** pada hosting yang mendukung aplikasi Node dan penyimpanan persisten.
- Build command: `npm install`
- Start command: `npm start`
- Environment variables: `JWT_SECRET`, opsional `PORT`, `DB_PATH`.
- Pasang persistent disk/volume dan arahkan `DB_PATH` ke lokasi di volume tersebut agar SQLite tidak hilang saat redeploy.
- HTTPS wajib digunakan untuk deployment publik.

## Mengatur tombol Saluran
Edit `public/config.json`:
```json
{
  "channel1": "https://whatsapp.com/channel/LINK_ASLI_SALURAN_1",
  "channel2": "https://whatsapp.com/channel/LINK_ASLI_SALURAN_2"
}
```
Isi dengan tautan saluran milikmu. Tombol tetap terlihat walaupun tautan belum diganti.

## Catatan
- Link Saluran 1 dan 2 masih berupa placeholder karena URL asli belum diberikan.
- Versi ini tidak membuat akses wajib bergabung ke WhatsApp.
- SQLite cocok untuk satu instance dengan persistent volume. Untuk banyak instance, gunakan PostgreSQL atau database terkelola.
- Jangan commit file `.env` atau database ke repositori publik.
