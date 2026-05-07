# 🍱 Nana Bites — Jajanan Kekinian Premium

Nana Bites adalah aplikasi web katalog menu dan pemesanan jajanan modern yang dibangun dengan **Next.js 16**, **TypeScript**, **Tailwind CSS**, dan **Supabase**. Didesain dengan estetika *Modern, Elegant, & Cute* untuk memberikan pengalaman belanja yang premium bagi pelanggan.

## ✨ Fitur Utama

- **🎨 Desain Premium**: Antarmuka modern dengan tipografi mewah (Cormorant Garamond & DM Sans) serta animasi halus menggunakan **Framer Motion**.
- **📱 Responsive & Interactive**: Optimal di semua perangkat dengan fitur *Product Detail Modal* dan *Cart System*.
- **🛍️ Alur Pesan WhatsApp**: Integrasi otomatis yang merangkum pesanan dan mengirimkannya langsung ke WhatsApp penjual.
- **⚡ Real-time Menu Management**: Dashboard Admin lengkap untuk mengatur stok, harga, gambar, label (Best Seller/Coming Soon), dan status ketersediaan secara real-time.
- **🗄️ Supabase Integration**: Database PostgreSQL yang handal untuk menyimpan data menu dan riwayat pesanan.

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React
- **Toast**: Sonner

## 🚀 Persiapan Lokal

1. **Clone Repository**
   ```bash
   git clone https://github.com/Radityaaa25/nana-bites.git
   cd nana-bites
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment**
   Buat file `.env.local` dan lengkapi variabel berikut:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ADMIN_PASSWORD=your_admin_password
   NEXT_PUBLIC_WA_NUMBER=your_whatsapp_number (cth: 628xxx)
   ```

4. **Jalankan Development Server**
   ```bash
   npm run dev
   ```

## 📂 Struktur Proyek

- `/app`: Rute aplikasi, API, dan halaman utama.
- `/components`: Komponen UI yang reusable (Admin & Customer).
- `/lib`: Utilitas, konfigurasi Supabase, dan state management (Zustand).
- `/public`: Aset gambar dan logo.

---

Made with 🩷 by [Nana Bites Team](https://github.com/Radityaaa25/nana-bites)
