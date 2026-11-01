import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Destination from '../models/Destination.js';
import Attraction from '../models/Attraction.js';
import { SEED_DESTINATIONS } from '../data/seedData.js';

export const seedDatabase = async ({ silent = false } = {}) => {
  const log = (...args) => {
    if (!silent) console.log(...args);
  };

  log('\n========================================');
  log('  SmartTravel Phase 3 — Database Seeder');
  log('========================================\n');

  const conn = await connectDB();
  if (!conn) {
    throw new Error('Database connection failed. Seeding aborted.');
  }

  log(`[Seeder] Connected to database: ${mongoose.connection.name}`);
  log(`[Seeder] Preparing to upsert ${SEED_DESTINATIONS.length} curated destinations...\n`);

  let destinationCount = 0;
  let attractionCount = 0;

  for (const item of SEED_DESTINATIONS) {
    const { attractions = [], ...destinationFields } = item;

    // 1. Idempotently upsert destination by unique slug
    const destination = await Destination.findOneAndUpdate(
      { slug: destinationFields.slug },
      { $set: destinationFields },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    destinationCount++;
    log(`  [Destination] ✓ ${destination.name} (${destination.slug}) - INR ${destination.estimatedDailyBudget}/day`);

    // 2. Idempotently upsert each attraction linked to this destination
    for (const attr of attractions) {
      const attractionPayload = {
        ...attr,
        destination: destination._id,
        destinationSlug: destination.slug,
      };

      await Attraction.findOneAndUpdate(
        { destination: destination._id, slug: attr.slug },
        { $set: attractionPayload },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
      );

      attractionCount++;
      log(`    -> [Attraction] ✓ ${attr.name} (Est. INR ${attr.estimatedPriceINR})`);
    }
  }

  log('\n========================================');
  log(`[Seeder Summary] Successfully processed:`);
  log(`  - Destinations upserted: ${destinationCount}`);
  log(`  - Attractions upserted:  ${attractionCount}`);
  log('  - Idempotency status:     GUARANTEED (No duplicates)');
  log('========================================\n');

  return { destinationCount, attractionCount };
};

// If run directly from CLI
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase()
    .then(async () => {
      await mongoose.connection.close();
      console.log('[Seeder] Connection closed cleanly.');
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('[Seeder Error]', err.message);
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
      }
      process.exit(1);
    });
}
