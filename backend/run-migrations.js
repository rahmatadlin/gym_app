const { migrateUserImages } = require('./migrate-user-images');
const { migratePackageImages } = require('./migrate-package-images');

async function runAllMigrations() {
  try {
    console.log('=== Starting Image Migration Process ===\n');
    
    // Run package migration first
    console.log('1. Migrating package images...');
    await migratePackageImages();
    console.log('');
    
    // Run user migration
    console.log('2. Migrating user images...');
    await migrateUserImages();
    console.log('');
    
    console.log('=== All migrations completed successfully! ===');
  } catch (error) {
    console.error('Migration process failed:', error);
    process.exit(1);
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runAllMigrations().then(() => {
    console.log('Migration process finished.');
    process.exit(0);
  }).catch((error) => {
    console.error('Migration process failed:', error);
    process.exit(1);
  });
}

module.exports = { runAllMigrations }; 