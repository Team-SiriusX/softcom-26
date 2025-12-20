# User Profile Feature with UploadThing

## Overview
Complete user profile management system with profile picture upload using UploadThing.

## Features
- ✅ View user profile information
- ✅ Update name and personal details
- ✅ Upload/update profile picture using UploadThing
- ✅ Remove profile picture
- ✅ View account information (role, subscription, join date)
- ✅ Responsive design with loading states

## Setup

### 1. Environment Variables
Add UploadThing credentials to your `.env` file:

```env
UPLOADTHING_SECRET=your_uploadthing_secret
UPLOADTHING_APP_ID=your_uploadthing_app_id
```

**Get your credentials:**
1. Visit [UploadThing Dashboard](https://uploadthing.com/dashboard)
2. Create a new app or select existing one
3. Copy your Secret and App ID

### 2. Dependencies
Already installed:
```bash
pnpm add uploadthing @uploadthing/react
```

## File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── uploadthing/
│   │   │   ├── core.ts          # UploadThing file router config
│   │   │   └── route.ts         # API route handler
│   │   └── [[...route]]/
│   │       └── controllers/(base)/
│   │           └── profile.ts    # Profile API endpoints
│   └── dashboard/
│       └── profile/
│           └── page.tsx          # Profile UI page
├── hooks/
│   └── use-profile.ts            # React Query hooks
└── lib/
    └── uploadthing.ts            # UploadThing components
```

## API Endpoints

### GET `/api/profile`
Get current user profile

**Response:**
```json
{
  "data": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "image": "https://...",
    "role": "USER",
    "subscriptionTier": "FREE",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### PATCH `/api/profile`
Update user profile

**Request Body:**
```json
{
  "name": "New Name",
  "image": "https://uploadthing.com/..."
}
```

**Response:**
```json
{
  "data": {
    "id": "user_id",
    "name": "New Name",
    "email": "john@example.com",
    "image": "https://uploadthing.com/...",
    ...
  }
}
```

## Usage

### Frontend Components

#### Profile Page
Location: `/dashboard/profile`

Features:
- Profile picture with avatar fallback
- UploadThing button for image uploads
- Editable name field
- Read-only email display
- Account information cards (role, subscription, dates)

#### Upload Button Usage
```tsx
import { UploadButton } from "@/lib/uploadthing";

<UploadButton
  endpoint="profileImage"
  onClientUploadComplete={(res) => {
    if (res?.[0]?.url) {
      handleImageUpload(res[0].url);
    }
  }}
  onUploadError={(error: Error) => {
    toast.error(`Upload failed: ${error.message}`);
  }}
/>
```

### React Query Hooks

```typescript
import { useGetProfile, useUpdateProfile } from "@/hooks/use-profile";

function ProfileComponent() {
  const { data, isLoading } = useGetProfile();
  const updateProfile = useUpdateProfile();

  const handleUpdate = () => {
    updateProfile.mutate({
      name: "New Name",
      image: "https://..."
    });
  };
}
```

## UploadThing Configuration

### File Router (`src/app/api/uploadthing/core.ts`)
```typescript
profileImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
  .middleware(async ({ req }) => {
    const user = await currentUser();
    if (!user) throw new UploadThingError("Unauthorized");
    return { userId: user.id };
  })
  .onUploadComplete(async ({ metadata, file }) => {
    console.log("Upload complete for userId:", metadata.userId);
    return { uploadedBy: metadata.userId, url: file.url };
  })
```

### Middleware
- Checks authentication before upload
- Passes userId to onUploadComplete
- Throws error if user is not authenticated

### Configuration
- **Max file size:** 4MB
- **Max file count:** 1
- **Allowed types:** Images only (jpg, png, gif, etc.)

## Styling

### Custom UploadThing Appearance
```tsx
appearance={{
  button:
    "ut-ready:bg-primary ut-ready:text-primary-foreground hover:ut-ready:bg-primary/90",
  container: "flex items-center gap-2",
  allowedContent: "text-xs text-muted-foreground",
}}
```

### Profile Avatar
- 96x96px (h-24 w-24) on profile page
- Fallback shows first letter of name
- Supports external image URLs

## Security

### Authentication
- All API endpoints check authentication via `currentUser()`
- UploadThing middleware validates user before upload
- Unauthorized requests return 401

### File Upload Security
- Only authenticated users can upload
- File type validation (images only)
- File size limit enforced (4MB max)
- Rate limiting via UploadThing

### Profile Updates
- Users can only update their own profile
- Email cannot be changed (handled by auth provider)
- Role and subscription tier are read-only

## Navigation

Profile link added to sidebar:
- Icon: User icon
- Location: Bottom of navigation menu
- Active state highlighting
- Accessible at `/dashboard/profile`

## Error Handling

### Upload Errors
```typescript
onUploadError={(error: Error) => {
  toast.error(`Upload failed: ${error.message}`);
}}
```

### API Errors
```typescript
try {
  await updateProfile.mutateAsync({ name: "New Name" });
  toast.success("Profile updated successfully");
} catch (error: any) {
  toast.error(error.message || "Failed to update profile");
}
```

## UI Components Used

- **Card**: Container for profile sections
- **Avatar**: Profile picture display with fallback
- **Input**: Name and email fields
- **Button**: Edit, save, cancel actions
- **Label**: Form field labels
- **Loader2**: Loading spinner
- **Toast**: Success/error notifications

## Best Practices

1. **Image Optimization**: UploadThing automatically optimizes images
2. **Loading States**: Show spinners during uploads and updates
3. **Error Feedback**: Toast notifications for all operations
4. **Responsive Design**: Works on mobile and desktop
5. **Accessibility**: Proper labels and semantic HTML

## Troubleshooting

### Upload Not Working
1. Check UploadThing credentials in `.env`
2. Verify API route is accessible: `GET /api/uploadthing`
3. Check browser console for errors
4. Ensure file meets requirements (image, <4MB)

### Profile Not Loading
1. Verify user is authenticated
2. Check database connection
3. Look for API errors in terminal
4. Clear React Query cache

### Image Not Displaying
1. Check CORS settings on UploadThing
2. Verify image URL in database
3. Test image URL directly in browser
4. Check for HTTPS vs HTTP issues

## Future Enhancements

- [ ] Email change with verification
- [ ] Password change (if using email/password auth)
- [ ] Two-factor authentication
- [ ] Account deletion
- [ ] Activity log
- [ ] Profile completeness indicator
- [ ] Crop/resize images before upload
- [ ] Multiple image formats (cover photo, etc.)
