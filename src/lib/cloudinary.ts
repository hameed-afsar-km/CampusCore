/**
 * Cloudinary Helper for Unsigned Uploads
 * This allows direct client-side uploads without a backend server or Firebase billing.
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export type CloudinaryResource = {
  secure_url: string;
  public_id: string;
  original_filename: string;
  format: string;
  resource_type: string;
};

/**
 * Uploads a file directly to Cloudinary using an unsigned preset.
 */
export async function uploadToCloudinary(
  file: File,
  onProgress?: (percent: number) => void
): Promise<CloudinaryResource> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      "Cloudinary configuration missing. Ensure NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET are set in your .env.local file."
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  
  // Optional: Auto-tagging or folder organization
  formData.append("folder", "campuscore_uploads");

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
      true
    );

    // Track Progress
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        resolve(response as CloudinaryResource);
      } else {
        const error = JSON.parse(xhr.responseText);
        console.error("Cloudinary Upload Error:", error);
        reject(new Error(error.error?.message || "Cloudinary upload failed."));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during Cloudinary upload."));
    xhr.send(formData);
  });
}
