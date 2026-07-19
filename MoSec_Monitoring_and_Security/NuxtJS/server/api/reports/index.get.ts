import { desc, eq } from 'drizzle-orm';
import { db } from '../../utils/db';
import { transactions, users, door_lock_history } from '../../utils/schema';

export default defineEventHandler(async () => {
  // 1. AMBIL DATA TRANSAKSI (Gabungkan dengan tabel Users untuk dapat Nama)
  const rawTransactions = await db.select({
    id: transactions.id,
    userId: transactions.user_id,
    userName: users.name,       // Hasil JOIN
    roomId: transactions.room_id,
    timestamp: transactions.typed_at
  })
  .from(transactions)
  .leftJoin(users, eq(transactions.user_id, users.id)) // Menyambungkan ID
  .orderBy(desc(transactions.typed_at)); // Urutkan dari yang paling baru

  // Format datanya agar persis dengan yang diminta Template Vue Anda
  const formattedTransactions = rawTransactions.map(tx => ({
    id: tx.id,
    userId: tx.userId,
    userName: tx.userName || 'Unknown User',
    // Karena kalau masuk ke database berarti berhasil masuk ruangan
    status: 'Success', 
    timestamp: tx.timestamp
  }));

  // 2. AMBIL DATA RIWAYAT KUNCI
  const rawLockHistory = await db.select()
    .from(door_lock_history)
    .orderBy(desc(door_lock_history.recorded_at));

  // Format datanya
  const formattedLockHistory = rawLockHistory.map(lock => ({
    id: lock.id,
    roomId: lock.room_id,
    isLocked: lock.status === 'closed', // Jika 'closed' berarti isLocked = true
    lockedBy: 'System (IoT)',           // Sensor otomatis
    timestamp: lock.recorded_at
  }));

  // 3. KIRIM KEDUA DATANYA
  return {
    success: true,
    data: {
      transactions: formattedTransactions,
      lockHistory: formattedLockHistory
    }
  };
});