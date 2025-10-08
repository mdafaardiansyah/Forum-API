#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Konfigurasi
const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');
const MIGRATION_TEMPLATE = `/* eslint-disable camelcase */
exports.up = (pgm) => {
  // TODO: Implementasi migrasi up
  // Contoh:
  // pgm.createTable('table_name', {
  //   id: {
  //     type: 'VARCHAR(50)',
  //     primaryKey: true,
  //   },
  //   created_at: {
  //     type: 'timestamp',
  //     notNull: true,
  //     default: pgm.func('current_timestamp'),
  //   },
  // });
};

exports.down = (pgm) => {
  // TODO: Implementasi migrasi down (rollback)
  // Contoh:
  // pgm.dropTable('table_name');
};
`;

/**
 * Mendapatkan nomor urut berikutnya berdasarkan file migrasi yang ada
 */
function getNextMigrationNumber() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
    return '001';
  }

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(file => file.endsWith('.js'))
    .map(file => {
      // Cek format sequential (001_, 002_, dst.)
      const sequentialMatch = file.match(/^(\d{3})_/);
      if (sequentialMatch) {
        return parseInt(sequentialMatch[1], 10);
      }
      
      // Jika ada file dengan format timestamp, abaikan untuk penomoran sequential
      const timestampMatch = file.match(/^(\d{13})_/);
      if (timestampMatch) {
        return 0; // Abaikan file timestamp untuk penomoran sequential
      }
      
      return 0;
    })
    .filter(num => num > 0) // Hanya ambil nomor sequential yang valid
    .sort((a, b) => b - a);

  const lastNumber = files.length > 0 ? files[0] : 0;
  const nextNumber = lastNumber + 1;
  
  return nextNumber.toString().padStart(3, '0');
}

/**
 * Mengkonversi nama menjadi format yang konsisten
 */
function formatMigrationName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Hapus karakter khusus
    .replace(/\s+/g, '-') // Ganti spasi dengan dash
    .replace(/-+/g, '-') // Hapus dash berlebihan
    .replace(/^-|-$/g, ''); // Hapus dash di awal/akhir
}

/**
 * Membuat file migrasi baru
 */
function createMigration(name) {
  const migrationNumber = getNextMigrationNumber();
  const formattedName = formatMigrationName(name);
  const fileName = `${migrationNumber}_${formattedName}.js`;
  const filePath = path.join(MIGRATIONS_DIR, fileName);

  // Cek apakah file sudah ada
  if (fs.existsSync(filePath)) {
    console.error(`❌ File migrasi sudah ada: ${fileName}`);
    process.exit(1);
  }

  // Buat file migrasi
  fs.writeFileSync(filePath, MIGRATION_TEMPLATE);
  
  console.log(`✅ File migrasi berhasil dibuat: ${fileName}`);
  console.log(`📁 Lokasi: ${filePath}`);
  console.log(`\n📝 Langkah selanjutnya:`);
  console.log(`   1. Edit file ${fileName}`);
  console.log(`   2. Implementasi fungsi up() dan down()`);
  console.log(`   3. Jalankan migrasi: npm run migrate up`);
  
  return filePath;
}

/**
 * Menampilkan daftar migrasi yang ada
 */
function listMigrations() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.log('📂 Belum ada file migrasi.');
    return;
  }

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(file => file.endsWith('.js'))
    .sort();

  if (files.length === 0) {
    console.log('📂 Belum ada file migrasi.');
    return;
  }

  console.log('📋 Daftar file migrasi:');
  files.forEach((file, index) => {
    console.log(`   ${index + 1}. ${file}`);
  });
}

/**
 * Fungsi utama
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('🚀 Generator Migrasi Database Forum API');
    console.log('\n📖 Penggunaan:');
    console.log('   npm run migration:create <nama-migrasi>');
    console.log('   npm run migration:list');
    console.log('\n💡 Contoh:');
    console.log('   npm run migration:create "add user avatar column"');
    console.log('   npm run migration:create "create posts table"');
    console.log('   npm run migration:create "add index to username"');
    process.exit(0);
  }

  const command = args[0];
  
  switch (command) {
    case 'create':
      if (args.length < 2) {
        console.error('❌ Nama migrasi harus disediakan.');
        console.log('💡 Contoh: npm run migration:create "create users table"');
        process.exit(1);
      }
      
      const migrationName = args.slice(1).join(' ');
      createMigration(migrationName);
      break;
      
    case 'list':
      listMigrations();
      break;
      
    default:
      console.error(`❌ Command tidak dikenal: ${command}`);
      console.log('✅ Command yang tersedia: create, list');
      process.exit(1);
  }
}

// Jalankan script jika dipanggil langsung
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}

module.exports = {
  createMigration,
  listMigrations,
  getNextMigrationNumber,
  formatMigrationName
};