package com.expensetracker.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Map;

@Component
public class CloudinaryMediaObjectStore implements MediaObjectStore {
    private final Cloudinary cloudinary;
    private final boolean configured;

    public CloudinaryMediaObjectStore(
            @Value("${app.media.cloudinary.cloud-name:}") String cloudName,
            @Value("${app.media.cloudinary.api-key:}") String apiKey,
            @Value("${app.media.cloudinary.api-secret:}") String apiSecret) {
        configured = !cloudName.isBlank() && !apiKey.isBlank() && !apiSecret.isBlank();
        cloudinary = configured ? new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName, "api_key", apiKey, "api_secret", apiSecret, "secure", true)) : null;
    }

    @Override
    public String upload(byte[] contents, String publicId, String contentType) throws IOException {
        if (!configured) {
            throw new IllegalStateException("Durable media storage is not configured");
        }
        try {
            Map<?, ?> result = cloudinary.uploader().upload(contents, ObjectUtils.asMap(
                    "public_id", publicId,
                    "folder", "expense-track",
                    "resource_type", "image",
                    "overwrite", false,
                    "invalidate", false));
            Object secureUrl = result.get("secure_url");
            if (!(secureUrl instanceof String url) || !url.startsWith("https://")) {
                throw new IOException("Storage provider did not return a secure media URL");
            }
            return url;
        } catch (Exception e) {
            if (e instanceof IOException io) throw io;
            throw new IOException("Unable to upload image to durable media storage", e);
        }
    }
}
