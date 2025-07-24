const { Package } = require('./models');
const fs = require('fs');
const path = require('path');

async function migratePackageImages() {
  try {
    console.log('Starting package image migration...');
    
    const packages = await Package.findAll();
    let updatedCount = 0;
    
    for (const package of packages) {
      if (package.package_image && !package.package_image.startsWith('/uploads/')) {
        // This is an old file system path, convert to URL path
        const oldPath = package.package_image;
        const fileName = path.basename(oldPath);
        const newImagePath = `/uploads/packages/${fileName}`;
        
        // Update database record
        await package.update({ package_image: newImagePath });
        
        console.log(`Migrated package ${package.id}: ${oldPath} -> ${newImagePath}`);
        updatedCount++;
      }
    }
    
    console.log(`Migration completed. Updated ${updatedCount} package images.`);
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migratePackageImages().then(() => {
    console.log('Migration script finished.');
    process.exit(0);
  }).catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
}

module.exports = { migratePackageImages }; 