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

