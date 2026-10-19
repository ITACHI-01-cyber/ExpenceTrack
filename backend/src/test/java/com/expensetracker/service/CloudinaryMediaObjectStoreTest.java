package com.expensetracker.service;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class CloudinaryMediaObjectStoreTest {
    @Test
    void refusesUploadWhenDurableStorageCredentialsAreMissing() {
        CloudinaryMediaObjectStore store = new CloudinaryMediaObjectStore("", "", "");
        IllegalStateException exception = assertThrows(IllegalStateException.class,
                () -> store.upload(new byte[] {1}, "avatar-user", "image/png"));
        assertEquals("Durable media storage is not configured", exception.getMessage());
    }
}
