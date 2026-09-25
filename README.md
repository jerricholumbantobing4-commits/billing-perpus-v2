# Billing Perpus V.2

Sistem Billing Perpustakaan berbasis **Node.js + Socket.IO + MySQL**.

**Dibuat oleh:** Siswa SMKN 40 Jakarta

---

## Struktur Project

---

## Fitur

- ✅ Multi-PC billing (16 PC)
- ✅ Timer real-time per PC
- ✅ Chat Admin ke User
- ✅ Pindah PC tanpa putus sesi
- ✅ Tambah / kurang waktu
- ✅ Jeda dan lanjut sesi
- ✅ Kuota harian (max 2x per user per hari)
- ✅ Backend dan Frontend terpisah
- ✅ Kiosk mode untuk PC User
- ✅ Auto-restart via PM2

---


---

## 🔓 Panduan Keluar dari Kiosk Mode

Jika PC user menggunakan mode kiosk (`--kiosk`) dan perlu keluar:

### ⚡ Cara Cepat

1. **`Alt + F4`** — close Chrome langsung
2. **`Ctrl + Shift + Esc`** — buka Task Manager → kill Chrome
3. **`Ctrl + Alt + Del`** — Sign out / Restart PC

### 🥇 Cara 1: Alt + F4
Tekan `Alt + F4` → Chrome langsung close.

### 🥈 Cara 2: Task Manager (Paling Ampuh)
1. Tekan `Ctrl + Shift + Esc`
2. Cari **Google Chrome** di daftar
3. Klik kanan → **End task**

### 🥉 Cara 3: Ctrl + Alt + Del
1. Tekan `Ctrl + Alt + Del`
2. Pilih **Task Manager** atau **Sign out** atau **Restart**

### 🔄 Reset PC Setelah Test

1. **Win + R** → `shell:startup` → hapus shortcut `Billing Perpus`
2. Hapus shortcut di Desktop
3. **Win + R** → `netplwiz` → aktifkan kembali "Users must enter a password"
4. Restart PC

### 🆘 Metode Darurat
Kalau semua cara gagal: tekan tombol **power** PC, tahan **5-10 detik** → mati paksa → nyalakan lagi.

---

**Last updated:** 2026-09-25

## Teknologi

- **Backend:** Node.js, Express, Socket.IO, MySQL
- **Frontend:** HTML, Bootstrap, Socket.IO Client
- **Kiosk:** Chrome Kiosk Mode
- **Process Manager:** PM2

---

## Cara Install

### Prasyarat

- Node.js v18 atau lebih baru
- MySQL (XAMPP / Laragon)
- Chrome / Edge

### Setup Backend

```cmd
cd backend
npm install
npm start

### Buka Admin Panel
http://localhost:3000/admin

### Buka User Widget
http://localhost:3000/user?pc=PC-01

## Cara Pakai
Jalankan Server
cd backend
npm start

## Setup Kiosk untuk PC User
cd kiosk
set SERVER_URL=http://192.168.8.10:3000
set PC_CODE=PC-01
node kiosk.js

## Struktur Folder
billing-perpus-v2/
│
├── backend/
│   ├── src/
│   │   ├── api/           ← Routes dan Socket.IO
│   │   ├── config/        ← Database dan ENV
│   │   ├── controllers/   ← Handler request
│   │   ├── middleware/    ← Auth, validator, error
│   │   ├── models/        ← Query database
│   │   ├── services/      ← Bisnis logic
│   │   ├── utils/         ← Helper
│   │   └── server.js      ← Entry point
│   ├── public/
│   │   ├── admin.html     ← Admin Panel
│   │   └── user.html      ← User Widget
│   ├── .env
│   ├── ecosystem.config.js
│   └── package.json
│
├── kiosk/
│   ├── kiosk.js
│   └── package.json
│
└── README.md

## Lisensi
© 2026 SMKN 40 Jakarta. All rights reserved.

