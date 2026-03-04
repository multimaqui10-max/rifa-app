import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  console.log('🌱 Iniciando seeding de números...');
  
  // Check if numbers already exist
  const [existing] = await connection.execute('SELECT COUNT(*) as count FROM raffleNumbers');
  const count = existing[0].count;
  
  if (count > 0) {
    console.log(`✅ Ya existen ${count} números en la base de datos`);
    process.exit(0);
  }

  // Insert 1000 numbers
  const values = [];
  for (let i = 1; i <= 1000; i++) {
    values.push([i, 'available', null, null, null, new Date(), new Date()]);
  }

  // Batch insert in chunks of 100
  for (let i = 0; i < values.length; i += 100) {
    const chunk = values.slice(i, i + 100);
    const placeholders = chunk.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(',');
    const flatValues = chunk.flat();
    
    await connection.execute(
      `INSERT INTO raffleNumbers (number, status, reservedAt, reservationExpiresAt, soldAt, createdAt, updatedAt) 
       VALUES ${placeholders}`,
      flatValues
    );
    
    console.log(`✓ Insertados números ${i + 1} - ${Math.min(i + 100, 1000)}`);
  }

  console.log('✅ Seeding completado: 1000 números creados');
} catch (error) {
  console.error('❌ Error durante seeding:', error);
  process.exit(1);
} finally {
  await connection.end();
}
