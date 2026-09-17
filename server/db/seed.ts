import { initSchema } from './schema';
import { migratePECClubs } from './pec_migration';

export async function seedDatabase() {
  initSchema();

  // Guarantee Pragati University official data, migration, and club seeding run cleanly
  await migratePECClubs();
  console.log('[Seed] Database initialization and migration completed successfully.');
}
