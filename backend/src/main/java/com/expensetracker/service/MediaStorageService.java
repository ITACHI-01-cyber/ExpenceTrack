package com.expensetracker.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Set;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class MediaStorageService implements UserMediaService {
    private static final long MAX_BYTES = 5L * 1024 * 1024;
    private static final Set<String> ALLOWED = Set.of("image/jpeg", "image/png", "image/gif", "image/webp");
    private final Path root;
    private final MediaObjectStore objectStore;

    public MediaStorageService(@Value("${app.upload-dir}") String uploadDir, MediaObjectStore objectStore) throws IOException {
        root = Path.of(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(root);
        this.objectStore = objectStore;
    }

    public String store(MultipartFile file, String userId, String purpose) throws IOException {
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("An image file is required");
        if (file.getSize() > MAX_BYTES) throw new IllegalArgumentException("Image must be 5 MB or smaller");
        String type = file.getContentType();
        if (type == null || !ALLOWED.contains(type.toLowerCase())) throw new IllegalArgumentException("Unsupported image type");
        String extension = switch (type.toLowerCase()) { case "image/png" -> ".png"; case "image/gif" -> ".gif"; case "image/webp" -> ".webp"; default -> ".jpg"; };
        String name = purpose + "-" + userId + "-" + UUID.randomUUID();
        return objectStore.upload(file.getBytes(), name, type.toLowerCase());
    }

    /** Used only by the guarded legacy migration job. */
    public String migrate(Path source, String userId, String purpose) throws IOException {
        String filename = source.getFileName().toString();
        String extension = filename.contains(".") ? filename.substring(filename.lastIndexOf('.')) : ".jpg";
        String type = switch (extension.toLowerCase()) { case ".png" -> "image/png"; case ".gif" -> "image/gif"; case ".webp" -> "image/webp"; default -> "image/jpeg"; };
        return objectStore.upload(Files.readAllBytes(source), purpose + "-" + userId + "-legacy-" + UUID.randomUUID(), type);
    }

    public Path resolve(String filename) {
        Path path = root.resolve(filename).normalize();
        if (!path.startsWith(root) || !Files.isRegularFile(path)) throw new IllegalArgumentException("Media not found");
        return path;
    }
}
