import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  // the main entry for your schema
  schema: 'prisma/schema.prisma',

  // where migrations should be generated
  // what script to run for "prisma db seed"
  migrations: {
    path: 'prisma/migrations',
    // seed: 'tsx prisma/seed.ts', // Uncomment and configure when seed script is added
  },

  // The database URL
  datasource: {
    // For generate: dummy URL is fine (not actually connecting)
    // For runtime: actual DATABASE_URL will be provided by environment
    // Using process.env directly with fallback for build-time generation
    url: process.env.DATABASE_URL || 'postgresql://dummy:dummy@localhost:5432/dummy',
  },
});
