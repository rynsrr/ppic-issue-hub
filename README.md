# 📺 PPIC Issue Hub — Apple TV Minimal Edition

Aplikasi pencatatan isu harian dari **5 PPIC (Production Planning & Inventory Control)** dengan tampilan kalender bulanan yang super simpel, penampil isu belum selesai di bagian paling atas beserta live timer durasi berjalan, serta estetika **Apple TV (tvOS) Minimalist Monokrom** (tanpa warna-warni berlebih).

---

## ✨ Fitur Utama

1. **5 Unit PPIC**:
   - `PPIC 1`, `PPIC 2`, `PPIC 3`, `PPIC 4`, `PPIC 5` dengan filter cepat.

2. **Isu Belum Selesai di Paling Atas (+ Waktunya)**:
   - Tersemat langsung di posisi paling atas layar.
   - Penghitung durasi berjalan otomatis (*live elapsed time*: `4j 12m lalu`, `1h 4j lalu`).
   - Tombol cepat **`[Selesai]`** untuk langsung menuntaskan isu.

3. **Input Cepat 1 Baris**:
   - Pilih PPIC &rarr; Tulis isu &rarr; Pilih tanggal &rarr; Klik **Tambah**. Selesai dalam 3 detik!

4. **Tampilan Kalender Bulanan Sederhana**:
   - Kalender bulanan monokrom khas tvOS dengan navigasi bulan.
   - Klik tanggal mana pun untuk melihat dan mengelola daftar isu pada hari tersebut di bawahnya.

5. **Tema Apple TV Monokrom**:
   - Latar belakang OLED Black (`#000000`).
   - Kartu *frosted glass* halus dengan border transparan minimalis.
   - Bersih, elegan, tanpa warna-warni mencolok.

---

## 💻 Cara Menjalankan di Lokal

Server dev lokal aktif di:
👉 **http://localhost:3000**

Untuk menjalankan kembali nanti:
```bash
npm run dev
```

---

## 🐙 Push ke GitHub

```bash
git remote add origin https://github.com/USERNAME_ANDA/ppic-issue-hub.git
git push -u origin main
```

---

## ⚡ Deploy ke Vercel

1. Buka [vercel.com](https://vercel.com) & login dengan GitHub.
2. Klik **Add New Project**, pilih repositori `ppic-issue-hub`.
3. Klik **Deploy**. Selesai dalam ~1 menit!
