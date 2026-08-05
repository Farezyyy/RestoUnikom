export const TABLE_LAYOUT = {
  1: { shape: 'rect-h', x: 15.6, y: 16.6 },
  2: { shape: 'square', x: 18.7, y: 46.6 },
  3: { shape: 'square', x: 37.5, y: 46.6 },
  4: { shape: 'square', x: 56.2, y: 46.6 },
  5: { shape: 'square', x: 75.0, y: 46.6 },
  6: { shape: 'rect-v', x: 18.7, y: 63.3 },
  7: { shape: 'round', x: 35.0, y: 63.3 },
  8: { shape: 'square', x: 50.0, y: 63.3 },
  9: { shape: 'square', x: 65.0, y: 63.3 },
  10: { shape: 'square', x: 81.2, y: 63.3 },
  11: { shape: 'square', x: 25.0, y: 88.3 },
  12: { shape: 'square', x: 43.7, y: 88.3 },
};

export const mapDBTableToVisual = (dbTable) => {
  const layout = TABLE_LAYOUT[dbTable.no_meja] || { shape: 'square', x: 50, y: 50 };
  
  // Mapping DB enum (KOSONG, RESERVASI, TERISI, DIBERSIHKAN) to frontend enum
  let status = 'available';
  if (dbTable.status === 'TERISI') status = 'occupied';
  if (dbTable.status === 'RESERVASI') status = 'reserved';
  if (dbTable.status === 'DIBERSIHKAN') status = 'needs-clearing';
  if (dbTable.status === 'NONAKTIF') status = 'disabled'; // if owner disabled it

  return {
    id: dbTable.id,
    label: `T${dbTable.no_meja}`,
    no_meja: dbTable.no_meja,
    cap: dbTable.kapasitas,
    shape: layout.shape,
    x: layout.x,
    y: layout.y,
    status: status,
    dbStatus: dbTable.status
  };
};
