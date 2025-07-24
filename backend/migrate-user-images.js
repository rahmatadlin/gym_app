const { User } = require('./models');
const fs = require('fs');
const path = require('path');

async function migrateUserImages() {
  try {
    console.log('Starting user image migration...');
    
    const users = await User.findAll();
    let updatedCount = 0;
    
    for (const user of users) {
      if (user.user_image && user.user_image.startsWith('/uploads/')) {
        // Check if the image exists in the old location
        const oldPath = user.user_image.replace(/^\//, ''); // Remove leading slash
        const newPath = oldPath.replace('uploads/', 'uploads/users/');
        
        // Create users directory if it doesn't exist
        const usersDir = path.join(__dirname, 'uploads/users');
        if (!fs.existsSync(usersDir)) {
          fs.mkdirSync(usersDir, { recursive: true });
        }
        
        // Move file from old location to new location
        if (fs.existsSync(oldPath)) {
          const fileName = path.basename(oldPath);
          const newFilePath = path.join(usersDir, fileName);
          
          // Copy file to new location
          fs.copyFileSync(oldPath, newFilePath);
          
          // Update database record
          const newImagePath = `/uploads/users/${fileName}`;
          await user.update({ user_image: newImagePath });
          
          // Delete old file
          fs.unlinkSync(oldPath);
          
          console.log(`Migrated user ${user.id}: ${oldPath} -> ${newImagePath}`);
          updatedCount++;
        } else {
          console.log(`User ${user.id}: Image not found at ${oldPath}`);
        }
      }
    }
    
    console.log(`Migration completed. Updated ${updatedCount} user images.`);
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateUserImages().then(() => {
    console.log('Migration script finished.');
    process.exit(0);
  }).catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
}

module.exports = { migrateUserImages }; 