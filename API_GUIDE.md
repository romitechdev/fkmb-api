# Panduan Penggunaan API FKMB UNESA

## Base URL
```
http://localhost:3000/api
```

---

## 🔐 Authentication

### 1. Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@fkmb.unesa.ac.id",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@fkmb.unesa.ac.id",
      "name": "Admin FKMB",
      "role": "admin"
    },
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG..."
  }
}
```

### 2. Menggunakan Token
Setelah login, gunakan `accessToken` di header untuk semua request:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### 3. Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbG..."
}
```

### 4. Logout
```http
POST /api/auth/logout
Authorization: Bearer <accessToken>
```

### 5. Lupa Password
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### 6. Ganti Password
```http
POST /api/auth/change-password
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "currentPassword": "password_lama",
  "newPassword": "password_baru"
}
```

---

## 👥 Users (Admin Only)

### List Users
```http
GET /api/users?page=1&limit=10&search=nama
Authorization: Bearer <accessToken>
```

### Get User Detail
```http
GET /api/users/:id
Authorization: Bearer <accessToken>
```

### Create User
```http
POST /api/users
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "Nama User",
  "nim": "12345678",
  "phone": "081234567890",
  "roleId": "uuid-role",
  "departemenId": "uuid-departemen",
  "sendWelcomeEmail": true
}
```

### Update User
```http
PUT /api/users/:id
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "name": "Nama Baru",
  "isActive": true
}
```

### Delete User
```http
DELETE /api/users/:id
Authorization: Bearer <accessToken>
```

---

## 🎭 Roles (Admin Only)

### List Roles
```http
GET /api/roles
Authorization: Bearer <accessToken>
```

### Create Role
```http
POST /api/roles
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "name": "koordinator",
  "description": "Koordinator kegiatan",
  "permissions": ["kegiatan:read", "kegiatan:create"]
}
```

---

## 🏢 Departemen

### List Departemen
```http
GET /api/departemen?page=1&limit=10&search=pendidikan
Authorization: Bearer <accessToken>
```

### Create Departemen (Admin)
```http
POST /api/departemen
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "name": "Departemen Baru",
  "description": "Deskripsi departemen"
}
```

---

## 👔 Kepengurusan

### List Kepengurusan
```http
GET /api/kepengurusan?periode=2024/2025&departemenId=uuid
Authorization: Bearer <accessToken>
```

### Create Kepengurusan (Admin)
```http
POST /api/kepengurusan
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "userId": "uuid-user",
  "departemenId": "uuid-departemen",
  "jabatan": "Ketua",
  "periode": "2024/2025",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31"
}
```

---

## 📅 Kegiatan

### List Kegiatan
```http
GET /api/kegiatan?status=upcoming&departemenId=uuid
Authorization: Bearer <accessToken>
```

### Create Kegiatan
```http
POST /api/kegiatan
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "name": "Rapat Bulanan",
  "description": "Rapat evaluasi bulanan",
  "location": "Ruang Rapat A",
  "startDate": "2024-01-15T09:00:00Z",
  "endDate": "2024-01-15T12:00:00Z",
  "type": "rapat",
  "status": "upcoming",
  "departemenId": "uuid-departemen"
}
```

---

## 📱 Absensi Token (QR Code)

### Generate Token + QR
```http
POST /api/absensi-token
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "kegiatanId": "uuid-kegiatan",
  "expiresAt": "2024-01-15T12:00:00Z"
}
```

**Response:** Termasuk `qrCode` dalam format base64.

### Regenerate QR
```http
POST /api/absensi-token/:id/regenerate-qr
Authorization: Bearer <accessToken>
```

---

## ✅ Absensi

### Scan QR (Check-in)
```http
POST /api/absensi/scan
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "token": "token-dari-qr-code"
}
```

### Manual Entry (Admin/Pengurus)
```http
POST /api/absensi/manual
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "userId": "uuid-user",
  "kegiatanId": "uuid-kegiatan",
  "status": "hadir",
  "note": "Datang tepat waktu"
}
```

Status: `hadir`, `izin`, `sakit`, `alpha`

### Get Absensi by User
```http
GET /api/absensi/user/:userId
Authorization: Bearer <accessToken>
```

### Get Absensi by Kegiatan
```http
GET /api/absensi/kegiatan/:kegiatanId
Authorization: Bearer <accessToken>
```

---

## 💰 Kas

### Get Active Kas
```http
GET /api/kas/active
Authorization: Bearer <accessToken>
```

### Create Kas Periode (Admin)
```http
POST /api/kas
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "periode": "2024/2025",
  "saldoAwal": "1000000",
  "description": "Kas periode baru"
}
```

---

## 💳 Kas Detail (Transaksi)

### List Transaksi
```http
GET /api/kas-detail?kasId=uuid&jenis=pemasukan&startDate=2024-01-01
Authorization: Bearer <accessToken>
```

### Create Transaksi
```http
POST /api/kas-detail
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "kasId": "uuid-kas",
  "tanggal": "2024-01-15",
  "jenis": "pemasukan",
  "kategori": "Iuran Anggota",
  "description": "Iuran bulan Januari",
  "jumlah": "50000"
}
```

Jenis: `pemasukan`, `pengeluaran`

---

## 📊 Laporan Kas

### Generate Laporan
```http
POST /api/laporan-kas
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "kasId": "uuid-kas",
  "periode": "Januari 2024",
  "startDate": "2024-01-01",
  "endDate": "2024-01-31"
}
```

---

## 📁 Arsip (File Upload)

### Upload Arsip
```http
POST /api/arsip
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data

file: [file binary]
title: Proposal Kegiatan
description: Proposal untuk event tahunan
category: proposal
departemenId: uuid-departemen
```

### List Arsip
```http
GET /api/arsip?category=proposal&departemenId=uuid
Authorization: Bearer <accessToken>
```

### Get Categories
```http
GET /api/arsip/categories
Authorization: Bearer <accessToken>
```

---

## 📋 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Email is required" }
  ]
}
```

---

## 🔐 Role Permissions

| Role | Akses |
|------|-------|
| **admin** | Full access semua endpoint |
| **pengurus** | CRUD kegiatan, absensi, arsip |
| **bendahara** | CRUD kas, transaksi, laporan |
| **anggota** | Read only, scan absensi |

---

## 📝 Tips

1. **Pagination**: Semua list endpoint mendukung `?page=1&limit=10`
2. **Search**: Kebanyakan list mendukung `?search=keyword`
3. **Soft Delete**: Data tidak benar-benar dihapus, hanya ditandai `deletedAt`
4. **Token Expiry**: Access token berlaku 15 menit, refresh token 7 hari
