package com.expensetracker.service;

import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import com.expensetracker.model.User;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.dto.UserSettingsUpdate;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public User updateSettings(@NonNull String userId, @NonNull UserSettingsUpdate settingsUpdate) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (settingsUpdate.getName() != null) {
            user.setName(settingsUpdate.getName());
        }
        if (settingsUpdate.getProfilePicture() != null) {
            validateMediaReference(settingsUpdate.getProfilePicture());
            user.setProfilePicture(settingsUpdate.getProfilePicture());
        }
        if (settingsUpdate.getTheme() != null) {
            user.setTheme(settingsUpdate.getTheme());
        }
        if (settingsUpdate.getCurrency() != null) {
            user.setCurrency(settingsUpdate.getCurrency());
        }
        if (settingsUpdate.getGmailConnected() != null) {
            user.setGmailConnected(settingsUpdate.getGmailConnected());
        }
        if (settingsUpdate.getAccentColor() != null) {
            user.setAccentColor(settingsUpdate.getAccentColor());
        }
        if (settingsUpdate.getGlass() != null) user.setGlass(settingsUpdate.getGlass());
        if (settingsUpdate.getWallpaperId() != null) user.setWallpaperId(settingsUpdate.getWallpaperId());
        if (settingsUpdate.getWallpaperImage() != null) {
            validateMediaReference(settingsUpdate.getWallpaperImage());
            user.setWallpaperImage(settingsUpdate.getWallpaperImage());
        }
        if (settingsUpdate.getWallpaperOpacity() != null) {
            int opacity = settingsUpdate.getWallpaperOpacity();
            if (opacity < 0 || opacity > 100) throw new IllegalArgumentException("Wallpaper opacity must be between 0 and 100");
            user.setWallpaperOpacity(opacity);
        }
        if (settingsUpdate.getWallpaperEnabled() != null) user.setWallpaperEnabled(settingsUpdate.getWallpaperEnabled());

        return userRepository.save(user);
    }

    private void validateMediaReference(String reference) {
        if (reference.regionMatches(true, 0, "data:", 0, 5)) {
            throw new IllegalArgumentException("Image data must be uploaded through /api/media; Base64 image data is not supported");
        }
        if (!reference.isBlank() && !reference.startsWith("https://") && !reference.startsWith("/api/media/")) {
            throw new IllegalArgumentException("Image reference must be a secure URL or a legacy media reference");
        }
    }
}
