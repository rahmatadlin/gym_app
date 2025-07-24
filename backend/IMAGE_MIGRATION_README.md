# Image Upload Structure Changes

## Overview
The image upload structure has been reorganized to be more organized and consistent between users and packages.

## New Structure
```
uploads/
├── users/          # User profile images
│   ├── user-1234567890.jpg
│   └── user-1234567891.png
└── packages/       # Package images
    ├── package-1234567890.jpg
    └── package-1234567891.png
```

## Changes Made

### Backend Changes

1. **User Controller (`controllers/userController.js`)**:
   - Updated to store user images in `uploads/users/` folder
   - Uses URL paths (e.g., `/uploads/users/filename.jpg`) instead of file system paths
   - Added `getUserImageUrl()` helper function

2. **Package Controller (`controllers/packageController.js`)**:
   - Already updated to store package images in `uploads/packages/` folder
   - Uses URL paths (e.g., `/uploads/packages/filename.jpg`)
   - Added `getPackageImageUrl()` helper function

3. **User Routes (`routes/user.js`)**:
   - Updated multer configuration to save files in `uploads/users/`
   - Added proper file validation
   - Uses consistent naming pattern (`user-{timestamp}-{random}.{ext}`)

4. **Package Routes (`routes/package.js`)**:
   - Already configured to save files in `uploads/packages/`
   - Uses consistent naming pattern (`package-{timestamp}-{random}.{ext}`)

### Frontend Changes

1. **Admin Dashboard (`frontend/src/admin/AdminDashboard.jsx`)**:
   - Updated package image URL construction in edit modal
   - User images already work correctly with the new structure

## Migration Scripts

### Running Migrations
To migrate existing images to the new structure, run:

```bash
cd backend
node run-migrations.js
```

This will:
1. Migrate package images to use URL paths
2. Move user images from `uploads/` to `uploads/users/`
3. Update database records with new paths

### Individual Migration Scripts
- `migrate-user-images.js`: Migrates only user images
- `migrate-package-images.js`: Migrates only package images
- `run-migrations.js`: Runs both migrations

## Benefits

1. **Better Organization**: Separate folders for different types of images
2. **Consistency**: Both users and packages use the same URL path format
3. **Maintainability**: Easier to manage and backup specific image types
4. **Scalability**: Easy to add new image types in the future

## File Naming Convention

- **User Images**: `user-{timestamp}-{random}.{ext}`
- **Package Images**: `package-{timestamp}-{random}.{ext}`

## URL Format

- **User Images**: `http://localhost:3000/uploads/users/filename.jpg`
- **Package Images**: `http://localhost:3000/uploads/packages/filename.jpg`

## Important Notes

1. **Backup**: Always backup your database and uploads folder before running migrations
2. **Testing**: Test the migration on a development environment first
3. **File Permissions**: Ensure the web server has write permissions to the uploads folders
4. **Static Serving**: The backend serves static files from `/uploads` which includes both subfolders

## Troubleshooting

### Images Not Showing
1. Check if the file exists in the correct folder
2. Verify the URL path in the database
3. Ensure static file serving is configured correctly

### Migration Errors
1. Check file permissions
2. Ensure database connection is working
3. Verify the uploads folder structure exists

### File Upload Issues
1. Check multer configuration
2. Verify file size limits
3. Ensure proper file type validation 