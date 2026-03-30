/** Max banner size aligned with events UI copy (JPG, PNG up to 2MB). */
export const EVENT_BANNER_MAX_BYTES = 2 * 1024 * 1024;

/** GraphQL `getUploadUrl` category for event cover images. */
export const EVENT_COVER_UPLOAD_CATEGORY = "event_cover";

type GetUploadUrlResult = {
  data?: { getUploadUrl?: { uploadUrl: string; publicUrl: string } } | null;
};

/**
 * Request a signed upload URL, PUT the file (no auth header), return publicUrl for createEvent/updateEvent.coverImageUrl.
 */
export async function uploadEventBannerToStorage(
  file: File,
  getUploadUrl: (options: {
    variables: { contentType: string; category: string };
  }) => Promise<GetUploadUrlResult>,
): Promise<string> {
  if (file.size > EVENT_BANNER_MAX_BYTES) {
    throw new Error("Banner image must be 2MB or smaller.");
  }
  const contentType = file.type || "image/jpeg";
  const { data } = await getUploadUrl({
    variables: { contentType, category: EVENT_COVER_UPLOAD_CATEGORY },
  });
  const uploadUrl = data?.getUploadUrl?.uploadUrl;
  const publicUrl = data?.getUploadUrl?.publicUrl;
  if (!uploadUrl || !publicUrl) {
    throw new Error(
      "Could not get upload URL for the banner. Ensure getUploadUrl supports category \"event_cover\".",
    );
  }
  const res = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": contentType },
  });
  if (!res.ok) {
    throw new Error(`Banner upload failed (${res.status}).`);
  }
  return publicUrl;
}
