package com.expensetracker.service;

import com.expensetracker.model.User;
import com.expensetracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.nio.file.Path;

/** Opt-in, idempotent migration of old /api/media/{file} references. Never deletes source files. */
@Component
@RequiredArgsConstructor
public class LegacyMediaMigration implements CommandLineRunner {
    private final UserRepository users;
    private final UserMediaService mediaStorage;
    @Value("${app.media.migration.enabled:false}") private boolean enabled;

    @Override public void run(String... args) {
        if (!enabled) return;
        for (User user : users.findAll()) {
            boolean changed = migrate(user, true) | migrate(user, false);
            if (changed) users.save(user);
        }
    }

    private boolean migrate(User user, boolean avatar) {
        String reference = avatar ? user.getProfilePicture() : user.getWallpaperImage();
        if (reference == null || !reference.startsWith("/api/media/")) return false;
        try {
            Path local = mediaStorage.resolve(reference.substring("/api/media/".length()));
            String url = mediaStorage.migrate(local, user.getId(), avatar ? "avatar" : "wallpaper");
            if (avatar) user.setProfilePicture(url); else user.setWallpaperImage(url);
            return true;
        } catch (Exception ignored) {
            // Leave the Mongo reference unchanged for retry; never delete source media.
            return false;
        }
    }
}
