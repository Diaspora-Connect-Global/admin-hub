import { putFileToPresignedUrl } from "./associationImageUpload";

/** Max image size for community avatar/banner (aligned with form copy). */
export const COMMUNITY_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

type AvatarUploadMutation = (options: {
  variables: { communityId: string; filename: string; contentType: string };
}) => Promise<{
  data?: {
    getCommunityAvatarUploadUrl: { uploadUrl: string; fileUrl: string };
  } | null;
}>;

type CoverUploadMutation = (options: {
  variables: { communityId: string; filename: string; contentType: string };
}) => Promise<{
  data?: {
    getCommunityCoverUploadUrl: { uploadUrl: string; fileUrl: string };
  } | null;
}>;

/** Avatar / logo image. Returns the persisted public file URL. */
export async function uploadCommunityAvatar(
  communityId: string,
  file: File,
  getAvatarUploadUrl: AvatarUploadMutation,
): Promise<string> {
  if (file.size > COMMUNITY_IMAGE_MAX_BYTES) {
    throw new Error("Image must be 5MB or smaller.");
  }
  const { data } = await getAvatarUploadUrl({
    variables: {
      communityId,
      filename: file.name,
      contentType: file.type || "application/octet-stream",
    },
  });
  const payload = data?.getCommunityAvatarUploadUrl;
  if (!payload?.uploadUrl || !payload.fileUrl) {
    throw new Error("Could not get logo upload URL.");
  }
  await putFileToPresignedUrl(payload.uploadUrl, file);
  return payload.fileUrl;
}

/** Wide / banner (cover) image. Returns the persisted public file URL. */
export async function uploadCommunityCover(
  communityId: string,
  file: File,
  getCoverUploadUrl: CoverUploadMutation,
): Promise<string> {
  if (file.size > COMMUNITY_IMAGE_MAX_BYTES) {
    throw new Error("Image must be 5MB or smaller.");
  }
  const { data } = await getCoverUploadUrl({
    variables: {
      communityId,
      filename: file.name,
      contentType: file.type || "application/octet-stream",
    },
  });
  const payload = data?.getCommunityCoverUploadUrl;
  if (!payload?.uploadUrl || !payload.fileUrl) {
    throw new Error("Could not get banner upload URL.");
  }
  await putFileToPresignedUrl(payload.uploadUrl, file);
  return payload.fileUrl;
}
