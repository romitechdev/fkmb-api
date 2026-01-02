# 📱 Panduan API untuk Flutter App FKMB UNESA

Dokumentasi lengkap untuk integrasi API backend dengan aplikasi Flutter untuk **Anggota** dan **Pengurus**.

---

## 📌 Informasi Umum

### Base URL
```
Development: http://localhost:3000/api
Production: https://api.fkmb-unesa.ac.id/api  (ganti sesuai server)
```

### Header Default
```http
Content-Type: application/json
Authorization: Bearer <accessToken>
```

### Format Response
Semua response API menggunakan format JSON yang konsisten:

**Sukses:**
```json
{
  "success": true,
  "message": "Pesan sukses",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Pesan error",
  "errors": [
    { "field": "email", "message": "Email is required" }
  ]
}
```

---

## 🔐 1. Authentication

### 1.1 Login
Endpoint untuk masuk ke aplikasi.

```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "anggota@fkmb.unesa.ac.id",
  "password": "password123"
}
```

**Response Sukses (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "anggota@fkmb.unesa.ac.id",
      "name": "Ahmad Fauzi",
      "role": "anggota"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response Error (401):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

**Catatan Penting:**
- Simpan `accessToken` dan `refreshToken` di secure storage
- `accessToken` berlaku **15 menit**
- `refreshToken` berlaku **7 hari**
- Role yang mungkin: `admin`, `pengurus`, `anggota`, `bendahara`

---

### 1.2 Refresh Token
Perpanjang sesi tanpa login ulang.

```http
POST /api/auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response Sukses (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 1.3 Get Profile
Ambil data profil user yang sedang login.

```http
GET /api/auth/profile
Authorization: Bearer <accessToken>
```

**Response Sukses (200):**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "anggota@fkmb.unesa.ac.id",
    "name": "Ahmad Fauzi",
    "nim": "21050123456",
    "phone": "081234567890",
    "avatar": null,
    "roleId": "uuid-role",
    "departemenId": "uuid-departemen",
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "roleName": "anggota"
  }
}
```

---

### 1.4 Logout
Keluar dari aplikasi dan invalidate token.

```http
POST /api/auth/logout
Authorization: Bearer <accessToken>
```

**Response Sukses (200):**
```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": null
}
```

---

## 🔑 2. Ganti Password

### 2.1 Change Password
Ganti password untuk user yang sedang login.

```http
POST /api/auth/change-password
Authorization: Bearer <accessToken>
```

**Request Body:**
```json
{
  "currentPassword": "password_lama",
  "newPassword": "password_baru_min_8_char"
}
```

**Response Sukses (200):**
```json
{
  "success": true,
  "message": "Password changed successfully",
  "data": null
}
```

**Response Error - Password Lama Salah (400):**
```json
{
  "success": false,
  "message": "Current password is incorrect"
}
```

**Response Error - Password Baru Terlalu Pendek (400):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "newPassword", "message": "New password must be at least 8 characters" }
  ]
}
```

**Catatan:**
- Password baru minimal **8 karakter**
- Setelah ganti password, semua sesi aktif akan di-logout (refresh token di-invalidate)

---

### 2.2 Lupa Password (Opsional)
Kirim email reset password.

```http
POST /api/auth/forgot-password
```

**Request Body:**
```json
{
  "email": "anggota@fkmb.unesa.ac.id"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "If the email exists, a reset link will be sent",
  "data": null
}
```

---

## ✅ 3. Absensi

### 3.1 Scan QR Code / Input Token
Endpoint utama untuk absensi via QR code atau input token manual.

```http
POST /api/absensi/scan
Authorization: Bearer <accessToken>
```

**Request Body:**
```json
{
  "token": "ABC123XYZ"
}
```

**Response Sukses (201):**
```json
{
  "success": true,
  "message": "Absensi berhasil dicatat",
  "data": {
    "id": "uuid-absensi",
    "userId": "uuid-user",
    "kegiatanId": "uuid-kegiatan",
    "tokenId": "uuid-token",
    "tokenLabel": "Pertemuan 1",
    "status": "hadir",
    "checkInTime": "2026-01-02T14:30:00.000Z",
    "createdAt": "2026-01-02T14:30:00.000Z",
    "updatedAt": "2026-01-02T14:30:00.000Z",
    "kegiatanName": "Rapat Bulanan FKMB"
  }
}
```

**Response Error Cases:**

| HTTP Code | Message | Kondisi |
|-----------|---------|---------|
| 400 | `Token tidak boleh kosong` | Token kosong |
| 400 | `Token tidak valid atau sudah kadaluarsa` | Token salah/expired |
| 400 | `Anda sudah absen untuk pertemuan ini` | Sudah pernah absen dengan token yang sama |

**Catatan Penting:**
- Token bersifat **case-insensitive** (tidak peduli huruf besar/kecil)
- Token di-trim otomatis (spasi di depan/belakang dihapus)
- Satu token hanya bisa digunakan sekali per user per kegiatan

---

### 3.2 Lihat Riwayat Absensi Sendiri
Ambil riwayat absensi user yang sedang login.

```http
GET /api/absensi/user/{userId}
Authorization: Bearer <accessToken>
```

**Query Parameters (Opsional):**
| Parameter | Tipe | Default | Deskripsi |
|-----------|------|---------|-----------|
| `page` | int | 1 | Nomor halaman |
| `limit` | int | 10 | Jumlah item per halaman |
| `sortOrder` | string | desc | `asc` atau `desc` |

**Contoh:**
```
GET /api/absensi/user/550e8400-e29b-41d4-a716-446655440000?page=1&limit=20
```

**Response Sukses (200):**
```json
{
  "success": true,
  "message": "User absensi retrieved successfully",
  "data": [
    {
      "id": "uuid-absensi-1",
      "kegiatanId": "uuid-kegiatan-1",
      "tokenLabel": "Pertemuan 1",
      "status": "hadir",
      "checkInTime": "2026-01-02T14:30:00.000Z",
      "note": null,
      "createdAt": "2026-01-02T14:30:00.000Z",
      "kegiatanName": "Rapat Bulanan FKMB",
      "kegiatanDate": "2026-01-02T09:00:00.000Z"
    },
    {
      "id": "uuid-absensi-2",
      "kegiatanId": "uuid-kegiatan-2",
      "tokenLabel": "Pertemuan 2",
      "status": "hadir",
      "checkInTime": "2026-01-09T14:30:00.000Z",
      "note": null,
      "createdAt": "2026-01-09T14:30:00.000Z",
      "kegiatanName": "Rapat Bulanan FKMB",
      "kegiatanDate": "2026-01-09T09:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 25,
    "totalPages": 2
  }
}
```

**Status Absensi:**
| Status | Deskripsi |
|--------|-----------|
| `hadir` | Hadir tepat waktu |
| `izin` | Izin dengan alasan |
| `sakit` | Tidak hadir karena sakit |
| `alpha` | Tidak hadir tanpa keterangan |

---

## 📁 4. Arsip

### 4.1 Lihat Daftar Arsip
Ambil daftar semua arsip/dokumen.

```http
GET /api/arsip
Authorization: Bearer <accessToken>
```

**Query Parameters (Opsional):**
| Parameter | Tipe | Default | Deskripsi |
|-----------|------|---------|-----------|
| `page` | int | 1 | Nomor halaman |
| `limit` | int | 10 | Jumlah item per halaman |
| `search` | string | - | Cari berdasarkan judul/deskripsi |
| `category` | string | - | Filter berdasarkan kategori |
| `departemenId` | uuid | - | Filter berdasarkan departemen |
| `fileType` | string | - | Filter berdasarkan tipe file (mime type) |
| `sortOrder` | string | desc | `asc` atau `desc` |

**Contoh:**
```
GET /api/arsip?page=1&limit=10&search=proposal&category=dokumen
```

**Response Sukses (200):**
```json
{
  "success": true,
  "message": "Arsip retrieved successfully",
  "data": [
    {
      "id": "uuid-arsip-1",
      "title": "Proposal Kegiatan FKMB 2026",
      "description": "Proposal lengkap untuk event tahunan FKMB",
      "category": "proposal",
      "fileUrl": "/uploads/arsip/proposal-2026.pdf",
      "fileType": "application/pdf",
      "fileSize": 2048576,
      "departemenId": "uuid-departemen",
      "uploadedBy": "uuid-uploader",
      "createdAt": "2026-01-01T10:00:00.000Z",
      "updatedAt": "2026-01-01T10:00:00.000Z",
      "departemenName": "Departemen Pendidikan",
      "uploaderName": "Admin FKMB"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

---

### 4.2 Detail Arsip
Ambil detail satu arsip berdasarkan ID.

```http
GET /api/arsip/{id}
Authorization: Bearer <accessToken>
```

**Response Sukses (200):**
```json
{
  "success": true,
  "message": "Arsip retrieved successfully",
  "data": {
    "id": "uuid-arsip-1",
    "title": "Proposal Kegiatan FKMB 2026",
    "description": "Proposal lengkap untuk event tahunan FKMB",
    "category": "proposal",
    "fileUrl": "/uploads/arsip/proposal-2026.pdf",
    "fileType": "application/pdf",
    "fileSize": 2048576,
    "departemenId": "uuid-departemen",
    "uploadedBy": "uuid-uploader",
    "createdAt": "2026-01-01T10:00:00.000Z",
    "updatedAt": "2026-01-01T10:00:00.000Z",
    "departemenName": "Departemen Pendidikan",
    "uploaderName": "Admin FKMB"
  }
}
```

**Response Error (404):**
```json
{
  "success": false,
  "message": "Arsip not found"
}
```

---

### 4.3 Daftar Kategori Arsip
Ambil semua kategori arsip yang tersedia.

```http
GET /api/arsip/categories
Authorization: Bearer <accessToken>
```

**Response Sukses (200):**
```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": [
    "dokumen",
    "foto",
    "laporan",
    "notulensi",
    "proposal",
    "surat"
  ]
}
```

---

### 4.4 Download File Arsip
Untuk mendownload file arsip, gunakan URL lengkap:

```
{BASE_URL}{fileUrl}
```

**Contoh:**
```
http://localhost:3000/uploads/arsip/proposal-2026.pdf
```

---

## 🔒 Role & Permission Matrix

| Fitur | anggota | pengurus | admin |
|-------|---------|----------|-------|
| Login | ✅ | ✅ | ✅ |
| Ganti Password | ✅ | ✅ | ✅ |
| Scan QR Absensi | ✅ | ✅ | ✅ |
| Input Token Absensi | ✅ | ✅ | ✅ |
| Lihat Riwayat Absensi Sendiri | ✅ | ✅ | ✅ |
| Lihat Arsip | ✅ | ✅ | ✅ |
| Download Arsip | ✅ | ✅ | ✅ |
| Input Absensi Manual (untuk orang lain) | ❌ | ✅ | ✅ |
| Upload Arsip | ❌ | ✅ | ✅ |
| Kelola Kegiatan | ❌ | ✅ | ✅ |
| Kelola User | ❌ | ❌ | ✅ |

---

## 📲 Contoh Implementasi Flutter

### Model Classes

```dart
// lib/models/api_response.dart
class ApiResponse<T> {
  final bool success;
  final String message;
  final T? data;
  final PaginationMeta? meta;
  final List<ApiError>? errors;

  ApiResponse({
    required this.success,
    required this.message,
    this.data,
    this.meta,
    this.errors,
  });

  factory ApiResponse.fromJson(
    Map<String, dynamic> json,
    T Function(dynamic)? fromJsonT,
  ) {
    return ApiResponse<T>(
      success: json['success'] ?? false,
      message: json['message'] ?? '',
      data: json['data'] != null && fromJsonT != null
          ? fromJsonT(json['data'])
          : json['data'],
      meta: json['meta'] != null
          ? PaginationMeta.fromJson(json['meta'])
          : null,
      errors: json['errors'] != null
          ? (json['errors'] as List).map((e) => ApiError.fromJson(e)).toList()
          : null,
    );
  }
}

class PaginationMeta {
  final int page;
  final int limit;
  final int total;
  final int totalPages;

  PaginationMeta({
    required this.page,
    required this.limit,
    required this.total,
    required this.totalPages,
  });

  factory PaginationMeta.fromJson(Map<String, dynamic> json) {
    return PaginationMeta(
      page: json['page'] ?? 1,
      limit: json['limit'] ?? 10,
      total: json['total'] ?? 0,
      totalPages: json['totalPages'] ?? 0,
    );
  }
}

class ApiError {
  final String field;
  final String message;

  ApiError({required this.field, required this.message});

  factory ApiError.fromJson(Map<String, dynamic> json) {
    return ApiError(
      field: json['field'] ?? '',
      message: json['message'] ?? '',
    );
  }
}
```

```dart
// lib/models/user.dart
class User {
  final String id;
  final String email;
  final String name;
  final String? nim;
  final String? phone;
  final String? avatar;
  final String role;

  User({
    required this.id,
    required this.email,
    required this.name,
    this.nim,
    this.phone,
    this.avatar,
    required this.role,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      email: json['email'],
      name: json['name'],
      nim: json['nim'],
      phone: json['phone'],
      avatar: json['avatar'],
      role: json['role'] ?? json['roleName'] ?? 'anggota',
    );
  }
}
```

```dart
// lib/models/absensi.dart
class Absensi {
  final String id;
  final String kegiatanId;
  final String? tokenLabel;
  final String status;
  final DateTime? checkInTime;
  final String? note;
  final String kegiatanName;
  final DateTime? kegiatanDate;

  Absensi({
    required this.id,
    required this.kegiatanId,
    this.tokenLabel,
    required this.status,
    this.checkInTime,
    this.note,
    required this.kegiatanName,
    this.kegiatanDate,
  });

  factory Absensi.fromJson(Map<String, dynamic> json) {
    return Absensi(
      id: json['id'],
      kegiatanId: json['kegiatanId'],
      tokenLabel: json['tokenLabel'],
      status: json['status'],
      checkInTime: json['checkInTime'] != null
          ? DateTime.parse(json['checkInTime'])
          : null,
      note: json['note'],
      kegiatanName: json['kegiatanName'] ?? '',
      kegiatanDate: json['kegiatanDate'] != null
          ? DateTime.parse(json['kegiatanDate'])
          : null,
    );
  }
}
```

```dart
// lib/models/arsip.dart
class Arsip {
  final String id;
  final String title;
  final String? description;
  final String? category;
  final String fileUrl;
  final String fileType;
  final int fileSize;
  final String? departemenName;
  final String? uploaderName;
  final DateTime createdAt;

  Arsip({
    required this.id,
    required this.title,
    this.description,
    this.category,
    required this.fileUrl,
    required this.fileType,
    required this.fileSize,
    this.departemenName,
    this.uploaderName,
    required this.createdAt,
  });

  factory Arsip.fromJson(Map<String, dynamic> json) {
    return Arsip(
      id: json['id'],
      title: json['title'],
      description: json['description'],
      category: json['category'],
      fileUrl: json['fileUrl'],
      fileType: json['fileType'],
      fileSize: json['fileSize'] ?? 0,
      departemenName: json['departemenName'],
      uploaderName: json['uploaderName'],
      createdAt: DateTime.parse(json['createdAt']),
    );
  }

  String get fileSizeFormatted {
    if (fileSize < 1024) return '$fileSize B';
    if (fileSize < 1024 * 1024) return '${(fileSize / 1024).toStringAsFixed(1)} KB';
    return '${(fileSize / (1024 * 1024)).toStringAsFixed(1)} MB';
  }
}
```

---

### API Service

```dart
// lib/services/api_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiService {
  static const String baseUrl = 'http://localhost:3000/api';
  // Untuk production: 'https://api.fkmb-unesa.ac.id/api'
  
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  // === Private Methods ===
  
  Future<Map<String, String>> _getHeaders({bool auth = true}) async {
    final headers = {'Content-Type': 'application/json'};
    
    if (auth) {
      final token = await _storage.read(key: 'accessToken');
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }
    }
    
    return headers;
  }

  Future<void> _saveTokens(String accessToken, String refreshToken) async {
    await _storage.write(key: 'accessToken', value: accessToken);
    await _storage.write(key: 'refreshToken', value: refreshToken);
  }

  Future<void> clearTokens() async {
    await _storage.delete(key: 'accessToken');
    await _storage.delete(key: 'refreshToken');
  }

  // === Auth Endpoints ===

  /// Login dengan email dan password
  Future<ApiResponse> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: await _getHeaders(auth: false),
      body: jsonEncode({
        'email': email,
        'password': password,
      }),
    );

    final data = jsonDecode(response.body);
    
    if (data['success'] == true) {
      await _saveTokens(
        data['data']['accessToken'],
        data['data']['refreshToken'],
      );
    }
    
    return ApiResponse.fromJson(data, (d) => {
      'user': User.fromJson(d['user']),
      'accessToken': d['accessToken'],
      'refreshToken': d['refreshToken'],
    });
  }

  /// Refresh access token
  Future<bool> refreshToken() async {
    final refreshToken = await _storage.read(key: 'refreshToken');
    if (refreshToken == null) return false;

    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/refresh'),
        headers: await _getHeaders(auth: false),
        body: jsonEncode({'refreshToken': refreshToken}),
      );

      final data = jsonDecode(response.body);
      
      if (data['success'] == true) {
        await _saveTokens(
          data['data']['accessToken'],
          data['data']['refreshToken'],
        );
        return true;
      }
    } catch (e) {
      print('Refresh token error: $e');
    }
    
    return false;
  }

  /// Get profile user yang sedang login
  Future<ApiResponse<User>> getProfile() async {
    final response = await http.get(
      Uri.parse('$baseUrl/auth/profile'),
      headers: await _getHeaders(),
    );

    return ApiResponse.fromJson(
      jsonDecode(response.body),
      (d) => User.fromJson(d),
    );
  }

  /// Ganti password
  Future<ApiResponse> changePassword(String currentPassword, String newPassword) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/change-password'),
      headers: await _getHeaders(),
      body: jsonEncode({
        'currentPassword': currentPassword,
        'newPassword': newPassword,
      }),
    );

    return ApiResponse.fromJson(jsonDecode(response.body), null);
  }

  /// Logout
  Future<ApiResponse> logout() async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/logout'),
      headers: await _getHeaders(),
    );

    await clearTokens();
    return ApiResponse.fromJson(jsonDecode(response.body), null);
  }

  // === Absensi Endpoints ===

  /// Absensi dengan scan QR atau input token
  Future<ApiResponse<Absensi>> submitAbsensi(String token) async {
    final response = await http.post(
      Uri.parse('$baseUrl/absensi/scan'),
      headers: await _getHeaders(),
      body: jsonEncode({'token': token}),
    );

    return ApiResponse.fromJson(
      jsonDecode(response.body),
      (d) => Absensi.fromJson(d),
    );
  }

  /// Lihat riwayat absensi user
  Future<ApiResponse<List<Absensi>>> getAbsensiHistory(
    String userId, {
    int page = 1,
    int limit = 10,
  }) async {
    final uri = Uri.parse('$baseUrl/absensi/user/$userId')
        .replace(queryParameters: {
      'page': page.toString(),
      'limit': limit.toString(),
    });

    final response = await http.get(uri, headers: await _getHeaders());

    return ApiResponse.fromJson(
      jsonDecode(response.body),
      (d) => (d as List).map((e) => Absensi.fromJson(e)).toList(),
    );
  }

  // === Arsip Endpoints ===

  /// Lihat daftar arsip
  Future<ApiResponse<List<Arsip>>> getArsip({
    int page = 1,
    int limit = 10,
    String? search,
    String? category,
  }) async {
    final queryParams = {
      'page': page.toString(),
      'limit': limit.toString(),
    };
    
    if (search != null && search.isNotEmpty) {
      queryParams['search'] = search;
    }
    if (category != null && category.isNotEmpty) {
      queryParams['category'] = category;
    }

    final uri = Uri.parse('$baseUrl/arsip')
        .replace(queryParameters: queryParams);

    final response = await http.get(uri, headers: await _getHeaders());

    return ApiResponse.fromJson(
      jsonDecode(response.body),
      (d) => (d as List).map((e) => Arsip.fromJson(e)).toList(),
    );
  }

  /// Lihat detail arsip
  Future<ApiResponse<Arsip>> getArsipById(String id) async {
    final response = await http.get(
      Uri.parse('$baseUrl/arsip/$id'),
      headers: await _getHeaders(),
    );

    return ApiResponse.fromJson(
      jsonDecode(response.body),
      (d) => Arsip.fromJson(d),
    );
  }

  /// Lihat kategori arsip
  Future<ApiResponse<List<String>>> getArsipCategories() async {
    final response = await http.get(
      Uri.parse('$baseUrl/arsip/categories'),
      headers: await _getHeaders(),
    );

    return ApiResponse.fromJson(
      jsonDecode(response.body),
      (d) => (d as List).map((e) => e.toString()).toList(),
    );
  }

  /// Get full URL untuk download file
  String getFileDownloadUrl(String fileUrl) {
    if (fileUrl.startsWith('http')) return fileUrl;
    return baseUrl.replaceAll('/api', '') + fileUrl;
  }
}
```

---

### QR Scanner Widget

```dart
// lib/widgets/qr_scanner_widget.dart
import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

class QRScannerWidget extends StatefulWidget {
  final Function(String) onScan;

  const QRScannerWidget({Key? key, required this.onScan}) : super(key: key);

  @override
  State<QRScannerWidget> createState() => _QRScannerWidgetState();
}

class _QRScannerWidgetState extends State<QRScannerWidget> {
  bool _isScanned = false;

  @override
  Widget build(BuildContext context) {
    return MobileScanner(
      onDetect: (capture) {
        if (_isScanned) return;
        
        final List<Barcode> barcodes = capture.barcodes;
        for (final barcode in barcodes) {
          if (barcode.rawValue != null) {
            setState(() => _isScanned = true);
            widget.onScan(barcode.rawValue!);
            break;
          }
        }
      },
    );
  }
}
```

---

### Contoh Screen: Absensi

```dart
// lib/screens/absensi_screen.dart
import 'package:flutter/material.dart';

class AbsensiScreen extends StatefulWidget {
  const AbsensiScreen({Key? key}) : super(key: key);

  @override
  State<AbsensiScreen> createState() => _AbsensiScreenState();
}

class _AbsensiScreenState extends State<AbsensiScreen> {
  final _tokenController = TextEditingController();
  final _apiService = ApiService();
  bool _isLoading = false;
  bool _showScanner = false;

  Future<void> _submitAbsensi(String token) async {
    setState(() => _isLoading = true);

    try {
      final response = await _apiService.submitAbsensi(token);
      
      if (response.success) {
        _showSuccessDialog(response.data!);
      } else {
        _showErrorSnackbar(response.message);
      }
    } catch (e) {
      _showErrorSnackbar('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setState(() {
        _isLoading = false;
        _showScanner = false;
      });
    }
  }

  void _showSuccessDialog(Absensi absensi) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.check_circle, color: Colors.green),
            SizedBox(width: 8),
            Text('Berhasil!'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Kegiatan: ${absensi.kegiatanName}'),
            if (absensi.tokenLabel != null)
              Text('Pertemuan: ${absensi.tokenLabel}'),
            Text('Status: ${absensi.status.toUpperCase()}'),
            Text('Waktu: ${_formatDateTime(absensi.checkInTime!)}'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  void _showErrorSnackbar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
      ),
    );
  }

  String _formatDateTime(DateTime dt) {
    return '${dt.day}/${dt.month}/${dt.year} ${dt.hour}:${dt.minute.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Absensi')),
      body: _showScanner
          ? Stack(
              children: [
                QRScannerWidget(onScan: _submitAbsensi),
                Positioned(
                  bottom: 32,
                  left: 16,
                  right: 16,
                  child: ElevatedButton(
                    onPressed: () => setState(() => _showScanner = false),
                    child: const Text('Batal'),
                  ),
                ),
              ],
            )
          : Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Scan QR Button
                  ElevatedButton.icon(
                    onPressed: () => setState(() => _showScanner = true),
                    icon: const Icon(Icons.qr_code_scanner),
                    label: const Text('Scan QR Code'),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.all(16),
                    ),
                  ),
                  
                  const SizedBox(height: 24),
                  const Divider(),
                  const SizedBox(height: 24),
                  
                  // Manual Token Input
                  const Text(
                    'Atau masukkan token manual:',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _tokenController,
                    decoration: const InputDecoration(
                      hintText: 'Masukkan token absensi',
                      border: OutlineInputBorder(),
                    ),
                    textCapitalization: TextCapitalization.characters,
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: _isLoading
                        ? null
                        : () {
                            if (_tokenController.text.isNotEmpty) {
                              _submitAbsensi(_tokenController.text);
                            }
                          },
                    child: _isLoading
                        ? const CircularProgressIndicator()
                        : const Text('Submit'),
                  ),
                ],
              ),
            ),
    );
  }

  @override
  void dispose() {
    _tokenController.dispose();
    super.dispose();
  }
}
```

---

## 📦 Dependencies Flutter

Tambahkan di `pubspec.yaml`:

```yaml
dependencies:
  flutter:
    sdk: flutter
  http: ^1.1.0
  flutter_secure_storage: ^9.0.0
  mobile_scanner: ^3.5.5
  url_launcher: ^6.2.1  # untuk buka file
  path_provider: ^2.1.1  # untuk download file
  dio: ^5.4.0  # alternatif http client dengan download progress
```

---

## 🛡️ Tips Keamanan

1. **Jangan simpan token di SharedPreferences biasa** - gunakan `flutter_secure_storage`
2. **Implementasikan auto-refresh token** sebelum expired
3. **Handle 401 Unauthorized** dengan redirect ke login
4. **Validasi input** sebelum kirim ke server
5. **Gunakan HTTPS** di production

---

## 🚀 Checklist Fitur Flutter

- [ ] Login Screen
- [ ] Home/Dashboard Screen
- [ ] QR Scanner Screen
- [ ] Manual Token Input
- [ ] Riwayat Absensi Screen
- [ ] Ganti Password Screen
- [ ] Arsip List Screen
- [ ] Arsip Detail/Download
- [ ] Profile Screen
- [ ] Logout

---

**Selamat mengembangkan! 🎉**

Jika ada pertanyaan, silakan hubungi tim backend.
