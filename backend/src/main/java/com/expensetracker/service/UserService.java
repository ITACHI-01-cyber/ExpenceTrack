package com.expensetracker.service;

import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import com.expensetracker.model.User;
import com.expensetracker.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public User updateSettings(@NonNull String userId, @NonNull User settingsUpdate) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (settingsUpdate.getName() != null) {
            user.setName(settingsUpdate.getName());
        }
        if (settingsUpdate.getProfilePicture() != null) {
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

        return userRepository.save(user);
    }
}
