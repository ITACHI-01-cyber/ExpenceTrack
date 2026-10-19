# Durable media storage

Profile and wallpaper uploads use Cloudinary and return its stable HTTPS `secure_url`. MongoDB stores only that URL in `profilePicture` or `wallpaperImage`; it never stores image bytes or Base64 data.

## Render configuration

Create a Cloudinary product environment and add these secrets to the **backend** Render service (not Vercel or Android): `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`. The supplied `render.yaml` declares them as secret/sync-disabled values. Deploy after adding them and keep `MEDIA_MIGRATION_ENABLED=false` normally.

The upload endpoints remain `POST /api/media/avatar` and `POST /api/media/wallpaper`, require the user's existing bearer token, accept JPEG, PNG, GIF, and WebP only, and enforce 5 MB. The returned HTTPS URL can be used unchanged by both clients.

## Existing local uploads

Old Mongo references beginning `/api/media/` remain readable only while the old server's `UPLOAD_DIR` exists. To migrate them safely, run a one-time deployment where that directory is mounted/available and set `MEDIA_MIGRATION_ENABLED=true`. For each existing user reference the backend uploads the source to Cloudinary, verifies a secure URL was returned, then updates that one Mongo field. It does **not** delete local files, does not overwrite already migrated HTTPS references, and leaves a reference unchanged if upload/read fails. Review Mongo documents and test the returned URLs after the job, then set the flag back to false.

If the old Render filesystem has already been discarded, its files cannot be recovered by this migration; only any surviving files mounted from a backup can be migrated.

## Production verification

1. Upload an avatar and wallpaper while authenticated; confirm each response has an `https://res.cloudinary.com/...` URL.
2. Confirm the same values are in the user Mongo document and that unrelated fields (such as `wallpaperOpacity`) have not changed.
3. Redeploy/restart Render, retrieve the profile again, and load the saved URL from both Android and web clients.
4. Do not consider migration or durable delivery verified until step 3 succeeds in the actual deployment.
