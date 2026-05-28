package com.expensetracker.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.UnsupportedEncodingException;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:}")
    private String fromEmail;

    @Value("${app.mail.from-name:Expense Tracker}")
    private String fromName;

    @Async
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
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(fromEmail, fromName);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
            log.info("Email sent to {} (subject: {})", to, subject);
        } catch (MessagingException | MailException | UnsupportedEncodingException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage(), e);
            throw new RuntimeException("Failed to send email. Please try again later.");
        }
    }
}
