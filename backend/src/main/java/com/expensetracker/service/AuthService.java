package com.expensetracker.service;

import com.expensetracker.dto.AuthResponse;
import com.expensetracker.dto.LoginRequest;
import com.expensetracker.dto.RegisterRequest;
import com.expensetracker.model.User;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.expensetracker.model.Otp;
import com.expensetracker.repository.OtpRepository;

import java.time.LocalDateTime;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final OtpRepository otpRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    public void sendRegisterOtp(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }
        if (request.getUsername() != null && userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new RuntimeException("Username already exists");
        }

        // Check rate limiting (1 minute)
        otpRepository.findTopByEmailAndPurposeOrderByCreatedAtDesc(request.getEmail(), Otp.Purpose.REGISTER)
                .ifPresent(otp -> {
                    if (otp.getCreatedAt().plusMinutes(1).isAfter(LocalDateTime.now())) {
                        throw new RuntimeException("Please wait 1 minute before requesting another OTP");
                    }
                });

        // Save PENDING user (if not exists, or update if exists as PENDING)
        User user = User.builder()
                .name(request.getName())
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .status(User.AccountStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();
        userRepository.save(user);

        otpRepository.deleteByEmailAndPurpose(request.getEmail(), Otp.Purpose.REGISTER);

        String code = generateOtpCode();
        Otp otp = Otp.builder()
                .email(request.getEmail())
                .code(code)
                .purpose(Otp.Purpose.REGISTER)
                .createdAt(LocalDateTime.now())
                .build();
        otpRepository.save(otp);

        emailService.sendOtpEmail(request.getEmail(), code, "Registration Verification");
    }

    public AuthResponse verifyRegisterOtp(String email, String code) {
        Otp otp = otpRepository.findTopByEmailAndPurposeOrderByCreatedAtDesc(email, Otp.Purpose.REGISTER)
                .orElseThrow(() -> new RuntimeException("OTP not found or expired"));

        if (otp.getAttempts() >= 5) {
            otpRepository.delete(otp);
            throw new RuntimeException("Max attempts reached. Please request a new OTP.");
        }

        if (!otp.getCode().equals(code)) {
            otp.setAttempts(otp.getAttempts() + 1);
            otpRepository.save(otp);
            throw new RuntimeException("Invalid OTP");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setStatus(User.AccountStatus.ACTIVE);
        userRepository.save(user);
        otpRepository.delete(otp);

        var userDetails = new org.springframework.security.core.userdetails.User(
                user.getEmail(), user.getPasswordHash(), new java.util.ArrayList<>()
        );
        var jwtToken = jwtUtil.generateToken(userDetails);

        return buildAuthResponse(user, jwtToken);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmailOrUsername(request.getIdentifier(), request.getIdentifier())
                .orElseThrow(() -> new RuntimeException("User not found"));

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        user.getEmail(),
                        request.getPassword()
                )
        );

        if (user.getStatus() != User.AccountStatus.ACTIVE) {
            throw new RuntimeException("Account is not active");
        }

        var userDetails = new org.springframework.security.core.userdetails.User(
                user.getEmail(), user.getPasswordHash(), new java.util.ArrayList<>()
        );
        var jwtToken = jwtUtil.generateToken(userDetails);

        return buildAuthResponse(user, jwtToken);
    }

    private AuthResponse buildAuthResponse(User user, String jwtToken) {
        return AuthResponse.builder()
                .token(jwtToken)
                .email(user.getEmail())
                .name(user.getName())
                .profilePicture(user.getProfilePicture())
                .theme(user.getTheme())
                .currency(user.getCurrency())
                .gmailConnected(user.getGmailConnected())
                .accentColor(user.getAccentColor())
                .build();
    }

    public User getMe(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private String generateOtpCode() {
        return String.format("%06d", new Random().nextInt(999999));
    }

    public void requestPasswordReset(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        otpRepository.deleteByEmailAndPurpose(email, Otp.Purpose.PASSWORD_RESET);

        String code = generateOtpCode();
        Otp otp = Otp.builder()
                .email(email)
                .code(code)
                .purpose(Otp.Purpose.PASSWORD_RESET)
                .createdAt(LocalDateTime.now())
                .build();
        otpRepository.save(otp);

        emailService.sendOtpEmail(email, code, "Password Reset");
    }

    public void resetPassword(String email, String code, String newPassword) {
        Otp otp = otpRepository.findByEmailAndCodeAndPurpose(email, code, Otp.Purpose.PASSWORD_RESET)
                .orElseThrow(() -> new RuntimeException("Invalid or expired OTP"));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        otpRepository.delete(otp);

        emailService.sendPasswordResetSuccessEmail(email, newPassword);
    }

    public void requestUsernameRecovery(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        otpRepository.deleteByEmailAndPurpose(email, Otp.Purpose.USERNAME_RECOVERY);

        String code = generateOtpCode();
        Otp otp = Otp.builder()
                .email(email)
                .code(code)
                .purpose(Otp.Purpose.USERNAME_RECOVERY)
                .createdAt(LocalDateTime.now())
                .build();
        otpRepository.save(otp);

        emailService.sendOtpEmail(email, code, "Username Recovery / Change");
    }

    public void changeUsernameViaOtp(String email, String code, String newUsername) {
        Otp otp = otpRepository.findByEmailAndCodeAndPurpose(email, code, Otp.Purpose.USERNAME_RECOVERY)
                .orElseThrow(() -> new RuntimeException("Invalid or expired OTP"));

        if (userRepository.findByUsername(newUsername).isPresent()) {
            throw new RuntimeException("Username already exists");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setUsername(newUsername);
        userRepository.save(user);

        otpRepository.delete(otp);
    }

    public void changeUsernameViaPassword(String email, String password, String newUsername) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new RuntimeException("Invalid password");
        }

        if (userRepository.findByUsername(newUsername).isPresent()) {
            throw new RuntimeException("Username already exists");
        }

        user.setUsername(newUsername);
        userRepository.save(user);
    }
}
