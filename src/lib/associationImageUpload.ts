/** Max image size for association logo/banner (aligned with form copy). */
export const ASSOCIATION_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export async function putFileToPresignedUrl(uploadUrl: string, file: File): Promise<void> {
  const contentType = file.type || "application/octet-stream";
  const res = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": contentType },
  });
  if (!res.ok) {
    throw new Error(`Upload failed (${res.status}).`);
  }
}

type AvatarUploadMutation = (options: {
  variables: { associationId: string };
}) => Promise<{
  data?: {
    getAssociationAvatarUploadUrl: { uploadUrl: string; fileKey: string };
  } | null;
}>;

type CoverUploadMutation = (options: {
  variables: { associationId: string };
}) => Promise<{
  data?: {
    getAssociationCoverUploadUrl: { uploadUrl: string; fileKey: string };
  } | null;
}>;

export async function uploadAssociationAvatar(
  associationId: string,
  file: File,
  getAvatarUploadUrl: AvatarUploadMutation,
): Promise<string> {
  if (file.size > ASSOCIATION_IMAGE_MAX_BYTES) {
    throw new Error("Image must be 5MB or smaller.");
  }
  const { data } = await getAvatarUploadUrl({ variables: { associationId } });
  const payload = data?.getAssociationAvatarUploadUrl;
  if (!payload?.uploadUrl || !payload.fileKey) {
    throw new Error("Could not get logo upload URL.");
  }
  await putFileToPresignedUrl(payload.uploadUrl, file);
  return payload.fileKey;
}

/** Wide / banner image; requires `getAssociationCoverUploadUrl` on the API. */
export async function uploadAssociationCover(
  associationId: string,
  file: File,
  getCoverUploadUrl: CoverUploadMutation,
): Promise<string> {
  if (file.size > ASSOCIATION_IMAGE_MAX_BYTES) {
    throw new Error("Image must be 5MB or smaller.");
  }
  const { data } = await getCoverUploadUrl({ variables: { associationId } });
  const payload = data?.getAssociationCoverUploadUrl;
  if (!payload?.uploadUrl || !payload.fileKey) {
    throw new Error("Could not get banner upload URL.");
  }
  await putFileToPresignedUrl(payload.uploadUrl, file);
  return payload.fileKey;
}
