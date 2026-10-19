package com.expensetracker.controller;

import com.expensetracker.config.SecurityConfig;
import com.expensetracker.model.User;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.security.JwtAuthFilter;
import com.expensetracker.service.UserMediaService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.mock.web.MockMultipartFile;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(MediaController.class)
@Import(SecurityConfig.class)
class MediaControllerTest {
    @Autowired MockMvc mvc;
    @MockBean UserMediaService mediaStorage;
    @MockBean UserRepository users;
    @MockBean JwtAuthFilter jwtAuthFilter;
    @MockBean UserDetailsService userDetailsService;

    @BeforeEach
    void passThroughJwtFilter() throws Exception {
        doAnswer(invocation -> {
            invocation.getArgument(2, jakarta.servlet.FilterChain.class)
                    .doFilter(invocation.getArgument(0, jakarta.servlet.ServletRequest.class),
                            invocation.getArgument(1, jakarta.servlet.ServletResponse.class));
            return null;
        }).when(jwtAuthFilter).doFilter(any(), any(), any());
    }

    @Test
    void uploadIsNotPublic() throws Exception {
        mvc.perform(multipart("/api/media/avatar").file(new MockMultipartFile("file", "a.png", "image/png", new byte[]{1})))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "owner@example.com")
    void avatarUploadPersistsReturnedDurableReferenceForAuthenticatedOwner() throws Exception {
        User user = User.builder().id("owner").email("owner@example.com").theme("dark").wallpaperOpacity(72).build();
        when(users.findByEmail("owner@example.com")).thenReturn(Optional.of(user));
        when(mediaStorage.store(any(), eq("owner"), eq("avatar")))
                .thenReturn("https://res.cloudinary.com/demo/image/upload/avatar-owner");

        mvc.perform(multipart("/api/media/avatar").file(new MockMultipartFile("file", "a.png", "image/png", new byte[]{1})))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").value("https://res.cloudinary.com/demo/image/upload/avatar-owner"));

        verify(users).save(argThat(saved -> saved.getProfilePicture().startsWith("https://")
                && "dark".equals(saved.getTheme()) && Integer.valueOf(72).equals(saved.getWallpaperOpacity())));
    }
}
