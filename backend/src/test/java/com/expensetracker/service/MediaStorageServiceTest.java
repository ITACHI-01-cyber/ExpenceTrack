package com.expensetracker.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class MediaStorageServiceTest {
    @TempDir Path tempDir;

    @Test
    void uploadsValidatedImageToDurableStoreAndReturnsItsReference() throws Exception {
        MediaObjectStore store = (data, id, type) -> "https://res.cloudinary.com/demo/image/upload/" + id;
        MediaStorageService service = new MediaStorageService(tempDir.toString(), store);
        String url = service.store(new MockMultipartFile("file", "photo.png", "image/png", new byte[] {1, 2}), "user-1", "avatar");
        assertTrue(url.startsWith("https://"));
        assertTrue(url.contains("avatar-user-1-"));
    }

    @Test
    void rejectsInvalidImageTypesAndOversizedFiles() throws Exception {
        MediaStorageService service = new MediaStorageService(tempDir.toString(), (data, id, type) -> "https://example.test/" + id);
        assertThrows(IllegalArgumentException.class, () -> service.store(
                new MockMultipartFile("file", "x.txt", "text/plain", new byte[] {1}), "u", "avatar"));
        assertThrows(IllegalArgumentException.class, () -> service.store(
                new MockMultipartFile("file", "x.png", "image/png", new byte[5 * 1024 * 1024 + 1]), "u", "avatar"));
    }
}
