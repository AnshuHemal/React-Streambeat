import { supabase } from "@/lib/supabase";

const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export interface AudioUploadResult {
  public_id: string;
  secure_url: string;
  duration: number;
  format: string;
  bytes: number;
}

export interface AudioQualityUrls {
  medium: string;   // 192kbps - Regular users (best quality for free)
  high: string;     // 320kbps - Premium users
  preview: string;  // 30sec 96kbps preview
}

/**
 * Upload audio file to Cloudinary
 */
export async function uploadAudioToCloudinary(
  fileUri: string,
  metadata: {
    title: string;
    artist_id: string;
    album_id?: string;
  }
): Promise<AudioUploadResult> {
  const formData = new FormData();
  
  // Append file
  const fileName = fileUri.split("/").pop() || "audio.mp3";
  formData.append("file", {
    uri: fileUri,
    type: "audio/mpeg",
    name: fileName,
  } as any);
  
  // Append upload preset
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET || "audio_uploads");
  
  // Set resource type to video (Cloudinary treats audio as video)
  formData.append("resource_type", "video");
  
  // Organize in folders by artist
  const publicId = `songs/${metadata.artist_id}/${Date.now()}_${metadata.title.toLowerCase().replace(/\s+/g, "_")}`;
  formData.append("public_id", publicId);
  
  // Note: Eager transformations are NOT allowed with unsigned uploads
  // Quality versions will be generated on-the-fly via URL transformations
  
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`,
    {
      method: "POST",
      body: formData,
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Upload failed");
  }
  
  const result = await response.json();
  
  return {
    public_id: result.public_id,
    secure_url: result.secure_url,
    duration: result.duration,
    format: result.format,
    bytes: result.bytes,
  };
}

/**
 * Generate quality-specific URLs from Cloudinary public_id
 */
export function generateAudioQualityUrls(publicId: string): AudioQualityUrls {
  const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/video/upload`;
  
  return {
    medium: `${baseUrl}/br_192k/f_aac/${publicId}.aac`,   // 192kbps - Regular
    high: `${baseUrl}/br_320k/f_aac/${publicId}.aac`,   // 320kbps - Premium
    preview: `${baseUrl}/br_192k/du_30s/f_aac/${publicId}.aac`, // 30sec 192kbps preview
  };
}

/**
 * Delete audio from Cloudinary
 */
export async function deleteAudioFromCloudinary(publicId: string): Promise<void> {
  // This requires server-side authentication
  // Call Supabase edge function to delete
  const { error } = await supabase.functions.invoke("delete-cloudinary-asset", {
    body: { public_id: publicId, resource_type: "video" },
  });
  
  if (error) {
    throw new Error(`Failed to delete audio: ${error.message}`);
  }
}

/**
 * Get audio duration from file
 */
export async function getAudioDuration(fileUri: string): Promise<number> {
  return new Promise((resolve, reject) => {
    // In React Native, we'd use expo-av or react-native-sound
    // For now, return a placeholder that will be updated after Cloudinary upload
    resolve(0);
  });
}
