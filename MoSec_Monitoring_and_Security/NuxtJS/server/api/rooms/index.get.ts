import { db } from '../../utils/db';
import { rooms } from '../../utils/schema';

export default defineEventHandler(async () => {
  // Ambil semua data ruangan dan urutkan berdasarkan nomor lab (724, 725, dst)
  const allRooms = await db.select().from(rooms).orderBy(rooms.num);

  const formattedRooms = allRooms.map(r => {
    // Logika Penentuan Badge (Status Ruangan)
    let badgeStatus = 'inactive'; // Default: Jika pintu dikunci (closed)
    let badgeText = 'Inactive';

    if (r.status === 'open' && r.projector_status === true) {
      badgeStatus = 'active'; // Pintu buka & Proyektor nyala = Sedang dipakai
      badgeText = 'Active';
    } else if (r.status === 'open' && r.projector_status === false) {
      badgeStatus = 'warning'; // Pintu buka tapi proyektor mati = Potensi lupa kunci!
      badgeText = 'Warning';
    }

    return {
      id: r.id,
      num: r.num,
      name: `Lab ${r.num}`,
      projectorOn: r.projector_status,
      doorLocked: r.status === 'closed', // Di Postgres kita pakai 'open'/'closed'
      badgeStatus: badgeStatus,
      badgeText: badgeText
    };
  });

  return {
    success: true,
    data: formattedRooms
  };
});