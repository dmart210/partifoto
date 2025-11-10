export interface Album {
  id: string;
  name: string;
  created_at: number;
}

export interface Photo {
  id: string;
  album_id: string;
  filename: string;
  original_name: string;
  uploaded_by: string | null;
  title: string | null;
  created_at: number;
  // When using Supabase storage, API may include a resolved public URL
  url?: string;
}

export interface Comment {
  id: string;
  photo_id: string;
  author_name: string;
  content: string;
  created_at: number;
}
