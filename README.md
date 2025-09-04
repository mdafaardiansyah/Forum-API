# Forum API

![Node.js](https://img.shields.io/badge/Node.js-v14+-green.svg)
![Hapi.js](https://img.shields.io/badge/Hapi.js-v20+-blue.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-v13+-blue.svg)
![License](https://img.shields.io/badge/License-ISC-yellow.svg)

Forum API adalah aplikasi backend RESTful API yang dibangun menggunakan Node.js dan Hapi.js framework. Aplikasi ini menyediakan layanan untuk sistem forum diskusi dengan fitur autentikasi, manajemen thread, komentar, dan balasan.

## 🚀 Fitur Utama

- **Autentikasi & Autorisasi**: Sistem login/logout dengan JWT token
- **Manajemen Pengguna**: Registrasi dan manajemen profil pengguna
- **Thread Management**: Membuat, membaca, dan menghapus thread diskusi
- **Sistem Komentar**: Menambah, membaca, dan menghapus komentar pada thread
- **Sistem Balasan**: Menambah balasan pada komentar (nested comments)
- **Validasi Input**: Validasi komprehensif menggunakan Joi
- **Database Migration**: Sistem migrasi database yang terstruktur
- **Testing**: Unit test dan integration test yang lengkap

## 🛠️ Teknologi yang Digunakan

- **Runtime**: Node.js v14+
- **Framework**: Hapi.js v20+
- **Database**: PostgreSQL v13+
- **Authentication**: JWT (JSON Web Token)
- **Password Hashing**: bcrypt
- **Testing**: Jest
- **Code Quality**: ESLint dengan Airbnb config
- **Development**: Nodemon untuk hot reload

## 📋 Prasyarat

Sebelum menjalankan aplikasi, pastikan Anda telah menginstal:

- [Node.js](https://nodejs.org/) (v14 atau lebih baru)
- [PostgreSQL](https://www.postgresql.org/) (v13 atau lebih baru)
- [npm](https://www.npmjs.com/) atau [yarn](https://yarnpkg.com/)

## 🔧 Instalasi

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd Forum-API
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Kemudian edit file `.env` dan sesuaikan dengan konfigurasi Anda:
   ```env
   # Database
   PGHOST=localhost
   PGUSER=your_username
   PGDATABASE=forum_api
   PGPASSWORD=your_password
   PGPORT=5432
   
   # JWT
   ACCESS_TOKEN_KEY=your_access_token_secret
   REFRESH_TOKEN_KEY=your_refresh_token_secret
   ACCESS_TOKEN_AGE=3000
   
   # Server
   HOST=localhost
   PORT=5000
   
   # CORS
   CORS_ORIGINS=http://localhost:3000,http://localhost:3001
   ```

4. **Setup database**
   
   Buat database PostgreSQL:
   ```sql
   CREATE DATABASE forum_api;
   CREATE DATABASE forum_api_test; -- untuk testing
   ```

5. **Jalankan migrasi database**
   ```bash
   npm run migrate up
   ```

## 🚀 Menjalankan Aplikasi

### Development Mode
```bash
npm run start:dev
```
Server akan berjalan di `http://localhost:5000` dengan auto-reload.

### Production Mode
```bash
npm start
```

## 🗃️ Database Migration

### Migration Generator (Recommended)
Gunakan script generator untuk membuat file migrasi dengan nama yang natural:

```bash
# Membuat migrasi baru
npm run migration:create "add email verification to users"
npm run migration:create "create notifications table"

# Melihat daftar migrasi
npm run migration:list

# Bantuan penggunaan
npm run migration:help
```

**Output yang dihasilkan:**
- `001_add_email_verification_to_users.js`
- `002_create_notifications_table.js`

### Menjalankan Migration
```bash
# Jalankan semua migrasi
npm run migrate up

# Rollback migrasi terakhir
npm run migrate down

# Lihat status migrasi
npm run migrate list
```

📖 **Dokumentasi lengkap**: [Migration Generator Guide](docs/migration-generator.md)

## 🧪 Testing

### Menjalankan semua test
```bash
npm test
```

### Test dengan watch mode
```bash
npm run test:watch
```

### Test dengan coverage
```bash
npm run test:watch
```

## 📚 API Documentation

### Base URL
```
http://localhost:5000
```

### Authentication Endpoints

#### Register User
```http
POST /users
Content-Type: application/json

{
  "username": "johndoe",
  "password": "secret123",
  "fullname": "John Doe"
}
```

#### Login
```http
POST /authentications
Content-Type: application/json

{
  "username": "johndoe",
  "password": "secret123"
}
```

#### Refresh Token
```http
PUT /authentications
Content-Type: application/json

{
  "refreshToken": "your_refresh_token"
}
```

#### Logout
```http
DELETE /authentications
Content-Type: application/json

{
  "refreshToken": "your_refresh_token"
}
```

### Thread Endpoints

#### Create Thread
```http
POST /threads
Authorization: Bearer your_access_token
Content-Type: application/json

{
  "title": "Thread Title",
  "body": "Thread content"
}
```

#### Get All Threads
```http
GET /threads
```

#### Get Thread Detail
```http
GET /threads/{threadId}
```

#### Delete Thread
```http
DELETE /threads/{threadId}
Authorization: Bearer your_access_token
```

### Comment Endpoints

#### Add Comment
```http
POST /threads/{threadId}/comments
Authorization: Bearer your_access_token
Content-Type: application/json

{
  "content": "Comment content"
}
```

#### Delete Comment
```http
DELETE /threads/{threadId}/comments/{commentId}
Authorization: Bearer your_access_token
```

### Reply Endpoints

#### Add Reply
```http
POST /threads/{threadId}/comments/{commentId}/replies
Authorization: Bearer your_access_token
Content-Type: application/json

{
  "content": "Reply content"
}
```

#### Delete Reply
```http
DELETE /threads/{threadId}/comments/{commentId}/replies/{replyId}
Authorization: Bearer your_access_token
```

## 🏗️ Arsitektur Proyek

```
Forum-API/
├── config/
│   └── database/           # Konfigurasi database
├── migrations/             # File migrasi database
├── src/
│   ├── Applications/       # Use cases dan security
│   ├── Commons/           # Exception handlers
│   ├── Domains/           # Domain entities dan repositories
│   ├── Infrastructures/   # Database dan HTTP implementations
│   ├── Interfaces/        # HTTP routes dan handlers
│   └── app.js            # Entry point aplikasi
├── tests/                 # Test helpers
└── docs/                  # Dokumentasi tambahan
```

### Clean Architecture

Proyek ini menggunakan prinsip Clean Architecture dengan pembagian layer:

- **Domain Layer**: Entities, repositories interfaces
- **Application Layer**: Use cases, security
- **Infrastructure Layer**: Database, HTTP server implementations
- **Interface Layer**: HTTP routes, request/response handling

## 🔒 Keamanan

- **Password Hashing**: Menggunakan bcrypt dengan salt rounds
- **JWT Authentication**: Access token dan refresh token
- **Input Validation**: Validasi komprehensif dengan Joi
- **SQL Injection Prevention**: Menggunakan parameterized queries
- **CORS Configuration**: Konfigurasi CORS yang dapat disesuaikan

## 🚀 Deployment

### Environment Variables untuk Production

Pastikan untuk mengatur environment variables berikut di production:

```env
NODE_ENV=production
PGHOST=your_production_db_host
PGUSER=your_production_db_user
PGDATABASE=your_production_db_name
PGPASSWORD=your_production_db_password
PGPORT=5432
ACCESS_TOKEN_KEY=your_strong_access_token_secret
REFRESH_TOKEN_KEY=your_strong_refresh_token_secret
HOST=0.0.0.0
PORT=5000
```

### Docker (Opsional)

Jika menggunakan Docker, buat `Dockerfile`:

```dockerfile
FROM node:14-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🤝 Kontribusi

Kami menyambut kontribusi dari komunitas! Untuk berkontribusi:

1. **Fork** repository ini
2. **Buat branch** untuk fitur baru (`git checkout -b feature/amazing-feature`)
3. **Commit** perubahan Anda (`git commit -m 'Add some amazing feature'`)
4. **Push** ke branch (`git push origin feature/amazing-feature`)
5. **Buat Pull Request**

### Guidelines Kontribusi

- Pastikan semua test lulus (`npm test`)
- Ikuti style guide yang ada (ESLint)
- Tulis test untuk fitur baru
- Update dokumentasi jika diperlukan
- Gunakan commit message yang deskriptif

### Code Style

Proyek ini menggunakan ESLint dengan Airbnb configuration. Jalankan linting dengan:

```bash
npx eslint src/
```

## 🐛 Bug Reports

Jika Anda menemukan bug, silakan buat issue dengan informasi:

- Deskripsi bug yang jelas
- Langkah-langkah untuk reproduce
- Expected behavior vs actual behavior
- Environment (OS, Node.js version, dll)
- Screenshot jika diperlukan

## 📝 Changelog

### v1.0.0 (Current)
- ✅ Implementasi autentikasi JWT
- ✅ CRUD operations untuk threads
- ✅ Sistem komentar dan balasan
- ✅ Validasi input komprehensif
- ✅ Unit testing dan integration testing
- ✅ Database migration system
- ✅ Clean Architecture implementation


## 📞 Kontak

Jika Anda memiliki pertanyaan atau saran, jangan ragu untuk menghubungi:

- **Email**: [ardidafa21@gmail.com]

---

**Dibuat dengan ❤️ menggunakan Node.js dan Hapi.js**