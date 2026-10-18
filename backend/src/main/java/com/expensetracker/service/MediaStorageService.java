package com.expensetracker.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class MediaStorageService {
    private static final long MAX_BYTES = 5L * 1024 * 1024;
    private static final Set<String> ALLOWED = Set.of("image/jpeg", "image/png", "image/gif", "image/webp");
    private final Path root;

    public MediaStorageService(@Value("${app.upload-dir}") String uploadDir) throws IOException {
        root = Path.of(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(root);
    }

    public String store(MultipartFile file, String userId, String purpose) throws IOException {
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("An image file is required");
        if (file.getSize() > MAX_BYTES) throw new IllegalArgumentException("Image must be 5 MB or smaller");
        String type = file.getContentType();
        if (type == null || !ALLOWED.contains(type.toLowerCase())) throw new IllegalArgumentException("Unsupported image type");
        String extension = switch (type.toLowerCase()) { case "image/png" -> ".png"; case "image/gif" -> ".gif"; case "image/webp" -> ".webp"; default -> ".jpg"; };
        String name = purpose + "-" + userId + "-" + UUID.randomUUID() + extension;
        Files.copy(file.getInputStream(), root.resolve(name), StandardCopyOption.REPLACE_EXISTING);
        return "/api/media/" + name;
    }

    public Path resolve(String filename) {
        Path path = root.resolve(filename).normalize();
        if (!path.startsWith(root) || !Files.isRegularFile(path)) throw new IllegalArgumentException("Media not found");
        return path;
    }
}
