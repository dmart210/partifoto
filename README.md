# Partiful Photos

A collaborative photo-sharing app where anyone with a link can upload photos, comment, and download images from shared albums.

## Features

✅ **Create Albums** - Generate shareable albums with unique links
✅ **Upload Photos** - Anyone with the link can upload photos to the album  
✅ **Comment System** - Leave comments on any photo in the album
✅ **Download Photos** - Download any photo from the album
✅ **No Authentication** - Simple, friction-free sharing (authentication can be added later)

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## How It Works

### Creating an Album
1. Click "Create New Album" on the homepage
2. Enter an album name (e.g., "Birthday Party 2024")
3. You'll be redirected to the album page with a unique shareable link

### Sharing with Guests
- Copy the album link (e.g., `/album/abc123xyz`)
- Share it through Partiful invitations, text messages, or any messaging app
- Anyone with the link can access the album

### Uploading Photos
1. Open the album link
2. Optionally enter your name
3. Click "Choose Photo" to upload an image
4. Photos appear in a grid layout

Notes on image optimization:
- Large images are automatically resized to fit within 1920x1920 and compressed (~82% quality).
- PNGs may be converted to WebP for better size; JPEGs remain JPEG.
- The original filename’s extension may change to .webp or .jpg depending on the optimized format.

### Commenting on Photos
1. Click on any photo to open the detail view
2. Enter your name and comment
3. Click "Post Comment"
4. Comments appear in chronological order

### Downloading Photos
- Click on a photo to open it
- Click the "Download" button
- The original photo will be downloaded

## Tech Stack

- **Framework:** Next.js (App Router)
- **Database:** Supabase Postgres (migrated from SQLite)
- **Storage:** Supabase Storage (public bucket `uploads`)
- **Styling:** Tailwind CSS
- **Language:** TypeScript

## Database Schema (Supabase)

### Albums
- `id` - Unique album identifier
- `name` - Album name
- `created_at` - Timestamp

### Photos
- `id` - Unique photo identifier
- `album_id` - Reference to album
- `filename` - Stored filename
- `original_name` - Original filename
- `uploaded_by` - Optional uploader name
- `created_at` - Timestamp

### Comments
- `id` - Unique comment identifier
- `photo_id` - Reference to photo
- `author_name` - Commenter's name
- `content` - Comment text
- `created_at` - Timestamp

## API Endpoints (Supabase-backed)

### Albums
- `POST /api/albums` - Create new album
- `GET /api/albums` - List all albums
- `GET /api/albums/[albumId]` - Get album details

### Photos
- `POST /api/albums/[albumId]/photos` - Upload photo to album
- `GET /api/albums/[albumId]/photos` - Get all photos in album

### Comments
- `POST /api/photos/[photoId]/comments` - Add comment to photo
- `GET /api/photos/[photoId]/comments` - Get all comments for photo

## Future Enhancements

The current implementation focuses on core functionality. Potential additions:

- [ ] Authentication (email/password, OAuth, magic links)
- [ ] Private vs public albums
- [ ] Photo reactions/likes
- [x] Image optimization (client-side compression)
- [ ] Thumbnails / responsive variants (server-side or edge)
- [ ] Bulk photo upload
- [ ] Photo captions
- [ ] Album expiration dates
- [ ] Email notifications for new photos/comments
- [ ] Photo filters and editing
- [ ] Search and filtering
- [ ] Cloud storage integration (S3, Cloudinary)

## Development Notes

- The database is created automatically on first run
- Uploaded photos are stored in `public/uploads/`
- The app uses client-side React components with server-side API routes
- No authentication is required - perfect for getting the core features working first!

## License

MIT


## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
