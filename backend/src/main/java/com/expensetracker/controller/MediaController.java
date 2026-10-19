package com.expensetracker.controller;

import com.expensetracker.dto.ApiResponse;
import com.expensetracker.model.User;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.service.UserMediaService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/media")
@RequiredArgsConstructor
public class MediaController {
    private final UserMediaService mediaStorageService;
    private final UserRepository userRepository;
    private User currentUser() { return userRepository.findByEmail(SecurityContextHolder.getContext().getAuthentication().getName()).orElseThrow(() -> new RuntimeException("User not found")); }
    @PostMapping("/avatar")
    public ResponseEntity<ApiResponse<String>> uploadAvatar(@RequestParam("file") MultipartFile file) throws Exception {
        User user = currentUser(); String url = mediaStorageService.store(file, user.getId(), "avatar"); user.setProfilePicture(url); userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.success(url, "Avatar uploaded"));
    }
    @PostMapping("/wallpaper")
    public ResponseEntity<ApiResponse<String>> uploadWallpaper(@RequestParam("file") MultipartFile file) throws Exception {
        User user = currentUser(); String url = mediaStorageService.store(file, user.getId(), "wallpaper"); user.setWallpaperImage(url); user.setWallpaperEnabled(true); userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.success(url, "Wallpaper uploaded"));
    }
    @GetMapping("/{filename:.+}")
    public ResponseEntity<FileSystemResource> getMedia(@PathVariable String filename) {
        return ResponseEntity.ok(new FileSystemResource(mediaStorageService.resolve(filename)));
    }
}
