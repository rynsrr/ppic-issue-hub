# 📺 PPIC Issue Hub — Apple TV Edition

Aplikasi modern pelacakan dan manajemen kendala operasional untuk **5 Unit PPIC (Production Planning & Inventory Control)** dengan desain estetik **Apple TV (tvOS)**, tampilan kalender bulanan, serta pelacak durasi berjalan (*live elapsed time*) untuk isu-isu yang belum selesai di bagian paling atas.

![Apple TV Theme](https://img.shields.io/badge/Theme-Apple%20TV%20(tvOS)-black?style=for-the-badge&logo=apple)
![Framework](https://img.shields.io/badge/Next.js-14-blue?style=for-the-badge&logo=nextdotjs)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38bdf8?style=for-the-badge&logo=tailwindcss)
![Vercel Ready](https://img.shields.io/badge/Vercel-Deployment%20Ready-000000?style=for-the-badge&logo=vercel)

---

## 🎯 Fitur Utama

1. **5 Unit PPIC Terintegrasi**:
   - 🔵 **PPIC 1**: Raw Material & Inbound Planning (*Bahan Baku*)
   - 🟠 **PPIC 2**: Production Scheduling & Machine Loading (*Jadwal Produksi / Line*)
   - 🟢 **PPIC 3**: Finished Goods & Outbound Logistics (*Gudang Barang Jadi & Pengiriman*)
   - 🟣 **PPIC 4**: Packaging & Auxiliary Material (*Bahan Kemas & Penunjang*)
   - 🔷 **PPIC 5**: Capacity & Toll-Out Subcontract (*Kapasitas Overload & Subkontraktor*)

2. **Top Unresolved Hero Shelf (Isu Belum Selesai di Paling Atas + Durasi Berjalan)**:
   - Tersemat langsung di bagian teratas aplikasi layaknya *Top Shelf* Apple TV.
   - Perhitungan durasi berjalan secara *real-time* (*live elapsed timer*): misalnya `1 hari 4 jam 20 menit lalu`.
   - Indikator urgensi visual:
     - 🟡 **Normal** (< 8 jam)
     - 🟠 **Warning** (8 - 24 jam)
     - 🔴 **Critical Pulsing Glow** (> 24 jam / Overdue)
   - Aksi kilat 1-klik: *Selesaikan Isu*, *Ubah Status (Open / In Progress)*.

3. **Tampilan Kalender Bulanan (Monthly View)**:
   - Grid kalender 7 hari interaktif untuk pemantauan isu harian per bulan.
   - Titik indikator warna per PPIC dan penghitung insiden per tanggal.
   - Ringkasan KPI bulanan: Total Isu, Rasio Terselesaikan (%), dan Isu Terbuka.
   - Filter cepat: Berdasarkan PPIC (1 s/d 5) atau Status (Belum Selesai / Selesai).
   - Modal detail tanggal (*Day Inspector*) untuk inspeksi & input isu pada tanggal tertentu.

4. **Matriks 5 PPIC (Department Board)**:
   - Tampilan kolom sejajar 5 PPIC untuk evaluasi beban kerja (*workload distribution*).

5. **Apple TV Design System**:
   - Latar belakang *deep midnight cosmic dark*.
   - Efek *frosted glass* (kaca buram/glassmorphism) dengan `backdrop-blur-2xl`.
   - Border halus berefek kilau (*ambient focus glow*).
   - Tipografi rapi terinspirasi SF Pro.

6. **Penyimpanan Lokal & Ekspor**:
   - Otomatis tersimpan di `localStorage` peramban.
   - Fitur ekspor data cadangan ke format JSON.
   - Fitur reset ke data demo untuk pengujian.

---

## 🚀 Menjalankan Secara Lokal (Local Development)

Pastikan Node.js telah terpasang di komputer Anda.

1. Buka terminal di folder project (`g:\App 2026`):
   ```bash
   npm run dev
   ```

2. Buka peramban di:
   ```
   http://localhost:3000
   ```

---

## 🐙 Cara Push ke GitHub

Ikuti langkah cepat berikut untuk mengunggah repositori ke akun GitHub Anda:

1. Buat repositori baru di [GitHub](https://github.com/new) (misalnya diberi nama: `ppic-issue-tracker`). **Jangan** centang inisialisasi README atau .gitignore.
2. Hubungkan remote dan push branch `main`:
   ```bash
   git remote add origin https://github.com/USERNAME_GITHUB_ANDA/ppic-issue-tracker.git
   git push -u origin main
   ```
   *(Ganti `USERNAME_GITHUB_ANDA` dengan username GitHub Anda)*

---

## ⚡ Cara Deploy ke Vercel

Aplikasi ini sudah 100% kompatibel dan siap di-*deploy* langsung ke Vercel tanpa konfigurasi tambahan:

### Cara 1: Lewat Web Dashboard Vercel (Paling Mudah)
1. Buka [vercel.com](https://vercel.com) dan login dengan akun GitHub Anda.
2. Klik tombol **"Add New..."** lalu pilih **"Project"**.
3. Pilih repositori `ppic-issue-tracker` yang baru saja Anda push ke GitHub.
4. Pada form konfigurasi:
   - **Framework Preset**: Next.js (otomatis terdeteksi).
   - **Root Directory**: `./` (default).
5. Klik **"Deploy"**.
6. Dalam 1-2 menit, aplikasi Anda akan tayang dengan domain publik gratis seperti `https://ppic-issue-tracker.vercel.app`!

### Cara 2: Lewat Terminal (Vercel CLI)
Jika ingin deploy langsung dari terminal:
```bash
npx vercel
```
Ikuti petunjuk di layar, lalu untuk production build jalankan:
```bash
npx vercel --prod
```

---

## 🛠️ Stack Teknologi

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, TypeScript)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) dengan konfigurasi custom Apple TV
- **Icons**: [Lucide React](https://lucide.dev/)
- **Date Handling**: [date-fns](https://date-fns.org/)
- **Deployment**: [Vercel](https://vercel.com/)
