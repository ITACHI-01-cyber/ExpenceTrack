package com.expensetracker.controller;

import com.expensetracker.dto.ApiResponse;
import com.expensetracker.dto.AuthResponse;
import com.expensetracker.dto.LoginRequest;
import com.expensetracker.dto.RegisterRequest;
import com.expensetracker.model.User;
import com.expensetracker.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    @PostMapping("/register/send-otp")
    public ResponseEntity<ApiResponse<Void>> registerSendOtp(@RequestBody RegisterRequest request) {
        authService.sendRegisterOtp(request);
        return ResponseEntity.ok(ApiResponse.success(null, "Registration OTP sent"));
    }

    @PostMapping("/register/verify-otp")
    public ResponseEntity<ApiResponse<AuthResponse>> registerVerifyOtp(@RequestBody Map<String, String> request) {
        return ResponseEntity.ok(ApiResponse.success(authService.verifyRegisterOtp(request.get("email"), request.get("code")), "User registered successfully"));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(ApiResponse.success(authService.login(request), "Login successful"));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<User>> getMe() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User user = authService.getMe(authentication.getName());
        user.setPasswordHash(null);
        return ResponseEntity.ok(ApiResponse.success(user, "User details fetched"));
    }

    @PostMapping("/forgot-password/request")
    public ResponseEntity<ApiResponse<Void>> requestPasswordReset(@RequestBody Map<String, String> request) {
        authService.requestPasswordReset(request.get("email"));
        return ResponseEntity.ok(ApiResponse.success(null, "If an account with that email exists, an OTP has been sent."));
    }

    @PostMapping("/forgot-password/reset")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@RequestBody Map<String, String> request) {
        authService.resetPassword(request.get("email"), request.get("code"), request.get("newPassword"));
        return ResponseEntity.ok(ApiResponse.success(null, "Password reset successfully."));
    }

    @PostMapping("/forgot-username/request")
    public ResponseEntity<ApiResponse<Void>> requestUsernameRecovery(@RequestBody Map<String, String> request) {
        authService.requestUsernameRecovery(request.get("email"));
        return ResponseEntity.ok(ApiResponse.success(null, "If an account with that email exists, an OTP has been sent."));
    }

    @PostMapping("/forgot-username/change-via-otp")
    public ResponseEntity<ApiResponse<Void>> changeUsernameViaOtp(@RequestBody Map<String, String> request) {
        authService.changeUsernameViaOtp(request.get("email"), request.get("code"), request.get("newUsername"));
        return ResponseEntity.ok(ApiResponse.success(null, "Username changed successfully."));
    }

    @PostMapping("/forgot-username/change-via-password")
    public ResponseEntity<ApiResponse<Void>> changeUsernameViaPassword(@RequestBody Map<String, String> request) {
        authService.changeUsernameViaPassword(request.get("email"), request.get("password"), request.get("newUsername"));
        return ResponseEntity.ok(ApiResponse.success(null, "Username changed successfully."));
    }
}
