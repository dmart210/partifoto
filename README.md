# Partiful Photos

A collaborative photo-sharing app where anyone with a link can upload photos, comment, and download images from shared albums.

## Features

✅ **Create Albums** - Generate shareable albums with unique links
✅ **Upload Photos** - Authenticated users can upload photos (flow: create account or login → upload)  
✅ **Comment System** - Leave comments on any photo in the album
✅ **Download Photos** - Download any photo from the album
✅ **Authentication Flow** - Users create an account or sign in before creating albums or uploading photos

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

### Uploading Photos (Auth-Gated)
1. Sign in or create an account
2. Open or create an album
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

## Authentication (Supabase-backed, Required for Create/Upload)

Email/password auth is powered by Supabase Auth. Users must be signed in to create albums or upload photos. Viewing albums and photos remains public (link-based access). Participation history is tracked automatically.

Pages:
| Path | Purpose |
|------|---------|
| `/auth/register` | Create an account (username + email + password) |
| `/auth/login` | Sign in with email + password |
| `/my` | Lists albums you have interacted with |

Automatic participation tracking occurs on:
1. Opening an album page
2. Fetching photos for an album
3. Viewing or posting comments
4. Uploading a photo

Schema additions (run once in Supabase SQL Editor): `profiles`, `album_participation` plus RLS policies (idempotent). See `supabase-schema.sql`.

Environment variables (client):
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Redirect flow: unauthenticated users are prompted to sign in/register and then redirected back (`?next=/album/xyz`).

### Applying schema changes in Supabase

Whenever this repo changes the database schema (for example, new columns in `profiles`), do the following in Supabase:

1) Open the Supabase Dashboard → your project → SQL Editor.
2) Open `supabase-schema.sql` from this repo and paste it into the SQL editor.
3) Run it as-is. The script is idempotent: it uses `IF NOT EXISTS`/`DO $$` guards so re-running is safe.

Storage setup (one-time):
- Create a public bucket named `uploads` for photos.
- Create a public bucket named `avatars` for profile images.
   - The SQL script also adds RLS policies that allow public read and authenticated write to `avatars`.

Environment variables (client-side):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Verify after running:
- In Table Editor → `profiles`, you should see columns: `username`, `display_name`, `avatar_url`, and social links `instagram_url`, `twitter_url`.
- In Storage → `uploads` and `avatars` buckets should exist and be Public.

Optional: Supabase CLI
- If you prefer CLI-based migrations, you can maintain SQL in `supabase/migrations` and use `supabase db push`. For this project, the single `supabase-schema.sql` script is the source of truth and can be re-run safely.

Most recent change (what to do now):
- Added social link fields to `profiles`: `instagram_url` and `twitter_url`.
- Action: Re-run `supabase-schema.sql` in the SQL Editor to add these columns. No additional storage/bucket changes required.

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
