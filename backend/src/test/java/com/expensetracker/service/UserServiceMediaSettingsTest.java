package com.expensetracker.service;

import com.expensetracker.model.User;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.dto.UserSettingsUpdate;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceMediaSettingsTest {
    @Mock UserRepository users;
    @InjectMocks UserService service;

    @Test
    void persistsMediaReferenceWithoutClearingOtherWallpaperSettings() {
        User stored = User.builder().id("u1").name("A").theme("dark").wallpaperId("preset-1")
                .wallpaperOpacity(65).wallpaperEnabled(true).build();
        when(users.findById("u1")).thenReturn(Optional.of(stored));
        when(users.save(any(User.class))).thenAnswer(i -> i.getArgument(0));
        UserSettingsUpdate patch = new UserSettingsUpdate();
        patch.setProfilePicture("https://res.cloudinary.com/x/image/upload/avatar");

        User saved = service.updateSettings("u1", patch);
        assertEquals("https://res.cloudinary.com/x/image/upload/avatar", saved.getProfilePicture());
        assertEquals("preset-1", saved.getWallpaperId());
        assertEquals(65, saved.getWallpaperOpacity());
        assertTrue(saved.getWallpaperEnabled());
    }

    @Test
    void rejectsBase64PayloadsInsteadOfPersistingThem() {
        when(users.findById("u1")).thenReturn(Optional.of(User.builder().id("u1").build()));
        UserSettingsUpdate patch = new UserSettingsUpdate();
        patch.setWallpaperImage("data:image/png;base64,AAAA");
        assertThrows(IllegalArgumentException.class, () -> service.updateSettings("u1", patch));
        verify(users, never()).save(any());
    }
}
