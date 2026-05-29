package com.expensetracker.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class EmailService {

    @Value("${brevo.api.key:}")
    private String brevoApiKey;

    @Value("${app.mail.from:your-email@gmail.com}")
    private String fromEmail;

    @Value("${app.mail.from-name:Expense Tracker}")
    private String fromName;

    private final RestTemplate restTemplate = new RestTemplate();

    private static final String BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

    public void sendOtpEmail(String toEmail, String otp, String purpose) {
        String subject = "Your Expense Tracker OTP Code";
        String html = """
                <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #eee;border-radius:12px;">
                    <h2 style="color:#360568;margin:0 0 16px;">Expense Tracker</h2>
                    <p>Hello,</p>
                    <p>Your One-Time Password (OTP) for <b>%s</b> is:</p>
                    <div style="font-size:28px;font-weight:bold;letter-spacing:6px;background:#f4f6fa;padding:14px 20px;border-radius:8px;text-align:center;margin:16px 0;">
                        %s
                    </div>
                    <p>This code is valid for <b>5 minutes</b>. Do not share it with anyone.</p>
                    <p style="color:#888;font-size:12px;margin-top:24px;">If you did not request this, you can safely ignore this email.</p>
                </div>
                """.formatted(purpose, otp);

        sendHtml(toEmail, subject, html);
    }

    @Async
    public void sendPasswordResetSuccessEmail(String toEmail) {
        String subject = "Your Expense Tracker password was changed";
        String html = """
                <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #eee;border-radius:12px;">
                    <h2 style="color:#360568;margin:0 0 16px;">Password Changed</h2>
                    <p>Your Expense Tracker password was just changed successfully.</p>
                    <p>If this wasn't you, please reset your password again immediately and contact support.</p>
                </div>
                """;

        sendHtml(toEmail, subject, html);
    }

    private void sendHtml(String to, String subject, String html) {
        if (brevoApiKey == null || brevoApiKey.isEmpty()) {
            log.error("BREVO_API_KEY is not set. Cannot send email to {}", to);
            throw new RuntimeException("Email service not configured.");
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("api-key", brevoApiKey);

            Map<String, Object> body = Map.of(
                    "sender", Map.of("name", fromName, "email", fromEmail),
                    "to", List.of(Map.of("email", to)),
                    "subject", subject,
                    "htmlContent", html
            );

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(BREVO_API_URL, request, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Email sent to {} via Brevo API", to);
            } else {
                log.error("Brevo API returned {}: {}", response.getStatusCode(), response.getBody());
                throw new RuntimeException("Failed to send email.");
            }
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage(), e);
            throw new RuntimeException("Failed to send email. Please try again later.");
        }
    }
}
