package com.expensetracker.controller;

import com.expensetracker.dto.ApiResponse;
import com.expensetracker.model.User;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;

    private String getUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getId();
    }

    @PutMapping("/settings")
    public ResponseEntity<ApiResponse<User>> updateSettings(@RequestBody User settingsUpdate) {
        User updatedUser = userService.updateSettings(getUserId(), settingsUpdate);
        // Do not return password hash
        updatedUser.setPasswordHash(null);
        return ResponseEntity.ok(ApiResponse.success(updatedUser, "Settings updated successfully"));
    }
}
