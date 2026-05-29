package com.expensetracker.service;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import com.resend.services.emails.model.CreateEmailResponse;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    @Value("${resend.api.key:}")
    private String resendApiKey;

    @Value("${app.mail.from:onboarding@resend.dev}")
    private String fromEmail;

    @Value("${app.mail.from-name:Expense Tracker}")
    private String fromName;

    private Resend resend;

    @PostConstruct
    public void init() {
        if (resendApiKey != null && !resendApiKey.isEmpty()) {
            this.resend = new Resend(resendApiKey);
            log.info("Resend client initialized");
        } else {
            log.warn("RESEND_API_KEY is not set. Emails will not be sent.");
        }
    }

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
        if (resend == null) {
            log.error("Failed to send email to {}: Resend client is not initialized (missing API key)", to);
            throw new RuntimeException("Failed to send email. Email service not configured.");
        }

        try {
            CreateEmailOptions params = CreateEmailOptions.builder()
                    .from(fromName + " <" + fromEmail + ">")
                    .to(to)
                    .subject(subject)
                    .html(html)
                    .build();

            CreateEmailResponse data = resend.emails().send(params);
            log.info("Email sent via Resend to {} (ID: {})", to, data.getId());
        } catch (ResendException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage(), e);
            throw new RuntimeException("Failed to send email. Please try again later.");
        }
    }
}
