# Forum API Postman Collection

Koleksi Postman untuk testing API Forum - Backend Expert Dicoding.

## Files

- `Forum-API.postman_collection.json` - Koleksi request API lengkap
- `Forum-API.postman_environment.json` - Environment variables untuk testing
- `README.md` - Dokumentasi penggunaan

## Setup

### 1. Import Collection dan Environment

1. Buka Postman
2. Import `Forum-API.postman_collection.json`
3. Import `Forum-API.postman_environment.json`
4. Pilih environment "Forum API Environment"

### 2. Konfigurasi Environment

Pastikan variabel berikut sudah diset:

- `baseUrl`: URL server API (default: `http://localhost:5000`)
- `username`: Username untuk testing (default: `dicoding`)
- `password`: Password untuk testing (default: `secret`)
- `fullname`: Nama lengkap untuk registrasi (default: `Dicoding Indonesia`)

## Testing Flow

### 1. User Registration & Authentication

1. **Register User** - Daftarkan user baru
2. **Login** - Login untuk mendapatkan access token
3. Token akan otomatis tersimpan di environment variables

### 2. Thread Management

1. **Create Thread** - Buat thread baru (memerlukan authentication)
2. **Get Thread Detail** - Ambil detail thread beserta comments dan replies

### 3. Comment Management

1. **Add Comment** - Tambah komentar ke thread (memerlukan authentication)
2. **Delete Comment** - Hapus komentar (soft delete, memerlukan authentication)

### 4. Reply Management

1. **Add Reply** - Tambah balasan ke komentar (memerlukan authentication)
2. **Delete Reply** - Hapus balasan (soft delete, memerlukan authentication)

### 5. Token Management

1. **Refresh Token** - Perbarui access token menggunakan refresh token
2. **Logout** - Hapus refresh token dari server

## Variables

Environment variables yang digunakan:

| Variable | Description | Type |
|----------|-------------|----- |
| `baseUrl` | Base URL API server | default |
| `accessToken` | JWT access token | secret |
| `refreshToken` | JWT refresh token | secret |
| `threadId` | ID thread untuk testing | default |
| `commentId` | ID comment untuk testing | default |
| `replyId` | ID reply untuk testing | default |
| `username` | Username untuk testing | default |
| `password` | Password untuk testing | secret |
| `fullname` | Nama lengkap untuk registrasi | default |

## Authentication

API menggunakan JWT Bearer token untuk authentication. Token akan otomatis diset setelah login berhasil.

Format header:
```
Authorization: Bearer {{accessToken}}
```

## Response Format

Semua response mengikuti format standar:

### Success Response
```json
{
  "status": "success",
  "data": {
    // response data
  }
}
```

### Error Response
```json
{
  "status": "fail",
  "message": "error message"
}
```

## Testing Tips

1. **Urutan Testing**: Ikuti urutan register → login → create thread → add comment → add reply
2. **Token Management**: Access token akan expire, gunakan refresh token untuk mendapatkan token baru
3. **ID Variables**: Setelah create resource, copy ID ke environment variables untuk testing selanjutnya
4. **Soft Delete**: Comment dan reply yang dihapus tidak benar-benar dihapus, hanya ditandai sebagai deleted

## Troubleshooting

### Common Issues

1. **401 Unauthorized**: Token expired atau tidak valid, lakukan login ulang
2. **404 Not Found**: Resource tidak ditemukan, periksa ID yang digunakan
3. **403 Forbidden**: User tidak memiliki akses, pastikan owner resource sesuai
4. **Connection Error**: Pastikan server API berjalan di `http://localhost:5000`

### Server Setup

Pastikan server API sudah berjalan:

```bash
# Install dependencies
npm install

# Setup database
npm run migrate up

# Start server
npm run start:dev
```

Server akan berjalan di `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /authentications` - Login
- `PUT /authentications` - Refresh token
- `DELETE /authentications` - Logout

### Users
- `POST /users` - Register user

### Threads
- `POST /threads` - Create thread
- `GET /threads/{threadId}` - Get thread detail

### Comments
- `POST /threads/{threadId}/comments` - Add comment
- `DELETE /threads/{threadId}/comments/{commentId}` - Delete comment

### Replies
- `POST /threads/{threadId}/comments/{commentId}/replies` - Add reply
- `DELETE /threads/{threadId}/comments/{commentId}/replies/{replyId}` - Delete reply

## Notes

- Semua endpoint yang memerlukan authentication menggunakan JWT Bearer token
- Soft delete diimplementasikan untuk comments dan replies
- Thread detail endpoint mengembalikan data thread beserta comments dan replies
- Response format mengikuti standar REST API