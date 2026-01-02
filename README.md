# FKMB UNESA Backend API

REST API Backend untuk Sistem Informasi FKMB UNESA.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Zod
- **Password Hashing**: Bcrypt
- **Email**: Nodemailer

## Features

- ✅ Full CRUD untuk semua entitas
- ✅ JWT Authentication dengan refresh token
- ✅ Role-Based Access Control (RBAC)
- ✅ Soft delete untuk semua entitas
- ✅ Pagination dan filtering
- ✅ Request validation
- ✅ QR Code generation untuk absensi
- ✅ File upload untuk arsip
- ✅ Password reset via email
- ✅ Standardized API responses

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm atau pnpm

### Installation

1. Clone repository dan masuk ke direktori:
   ```bash
   cd fkmb
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment file:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` dengan konfigurasi database Anda:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/fkmb_db
   JWT_SECRET=your-super-secret-jwt-key-min-32-chars
   JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars
   ```

5. Push database schema:
   ```bash
   npm run db:push
   ```

6. Seed database dengan data awal:
   ```bash
   npx tsx src/db/seed.ts
   ```

7. Start development server:
   ```bash
   npm run dev
   ```

Server akan berjalan di `http://localhost:3000`

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password |
| POST | `/api/auth/change-password` | Change password (auth) |
| POST | `/api/auth/logout` | Logout (auth) |
| GET | `/api/auth/profile` | Get profile (auth) |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List users (admin) |
| GET | `/api/users/:id` | Get user detail |
| POST | `/api/users` | Create user (admin) |
| PUT | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user (admin) |

### Roles
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/roles` | List roles (admin) |
| GET | `/api/roles/:id` | Get role detail (admin) |
| POST | `/api/roles` | Create role (admin) |
| PUT | `/api/roles/:id` | Update role (admin) |
| DELETE | `/api/roles/:id` | Delete role (admin) |

### Departemen
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/departemen` | List departemen |
| GET | `/api/departemen/:id` | Get departemen detail |
| POST | `/api/departemen` | Create departemen (admin) |
| PUT | `/api/departemen/:id` | Update departemen (admin) |
| DELETE | `/api/departemen/:id` | Delete departemen (admin) |

### Kepengurusan
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/kepengurusan` | List kepengurusan |
| GET | `/api/kepengurusan/:id` | Get kepengurusan detail |
| POST | `/api/kepengurusan` | Create kepengurusan (admin) |
| PUT | `/api/kepengurusan/:id` | Update kepengurusan (admin) |
| DELETE | `/api/kepengurusan/:id` | Delete kepengurusan (admin) |

### Kegiatan
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/kegiatan` | List kegiatan |
| GET | `/api/kegiatan/:id` | Get kegiatan detail |
| POST | `/api/kegiatan` | Create kegiatan |
| PUT | `/api/kegiatan/:id` | Update kegiatan |
| DELETE | `/api/kegiatan/:id` | Delete kegiatan (admin) |

### Absensi Token
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/absensi-token` | List tokens |
| GET | `/api/absensi-token/:id` | Get token detail |
| POST | `/api/absensi-token` | Generate new token + QR |
| PUT | `/api/absensi-token/:id` | Update token |
| POST | `/api/absensi-token/:id/regenerate-qr` | Regenerate QR |
| DELETE | `/api/absensi-token/:id` | Delete token (admin) |

### Absensi
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/absensi` | List absensi |
| GET | `/api/absensi/:id` | Get absensi detail |
| GET | `/api/absensi/user/:userId` | Get user absensi history |
| GET | `/api/absensi/kegiatan/:kegiatanId` | Get kegiatan absensi |
| POST | `/api/absensi/scan` | Check-in via QR scan |
| POST | `/api/absensi/manual` | Manual absensi entry |
| PUT | `/api/absensi/:id` | Update absensi |
| DELETE | `/api/absensi/:id` | Delete absensi (admin) |

### Kas
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/kas` | List kas periode |
| GET | `/api/kas/active` | Get active kas |
| GET | `/api/kas/:id` | Get kas detail |
| POST | `/api/kas` | Create kas (admin) |
| PUT | `/api/kas/:id` | Update kas |
| DELETE | `/api/kas/:id` | Delete kas (admin) |

### Kas Detail (Transaksi)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/kas-detail` | List transaksi |
| GET | `/api/kas-detail/:id` | Get transaksi detail |
| GET | `/api/kas-detail/kas/:kasId` | Get transaksi by kas |
| POST | `/api/kas-detail` | Create transaksi |
| PUT | `/api/kas-detail/:id` | Update transaksi |
| DELETE | `/api/kas-detail/:id` | Delete transaksi (admin) |

### Laporan Kas
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/laporan-kas` | List laporan |
| GET | `/api/laporan-kas/:id` | Get laporan detail |
| POST | `/api/laporan-kas` | Generate laporan |
| PUT | `/api/laporan-kas/:id` | Update laporan (admin) |
| DELETE | `/api/laporan-kas/:id` | Delete laporan (admin) |

### Arsip
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/arsip` | List arsip |
| GET | `/api/arsip/categories` | Get categories |
| GET | `/api/arsip/:id` | Get arsip detail |
| POST | `/api/arsip` | Upload arsip |
| PUT | `/api/arsip/:id` | Update arsip |
| DELETE | `/api/arsip/:id` | Delete arsip (admin) |

## API Response Format

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

## Default Credentials

Setelah menjalankan seed:
- **Email**: admin@fkmb.unesa.ac.id
- **Password**: admin123

⚠️ **Segera ganti password default setelah login pertama!**

## Scripts

```bash
# Development
npm run dev

# Build
npm run build

# Start production
npm start

# Database
npm run db:generate   # Generate migrations
npm run db:push       # Push schema to database
npm run db:migrate    # Run migrations
npm run db:studio     # Open Drizzle Studio
```

## License

ISC
