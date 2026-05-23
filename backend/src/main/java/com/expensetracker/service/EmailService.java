package com.expensetracker.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    
    @Value("${spring.mail.username}")
    private String fromEmail;

    public void sendOtpEmail(String toEmail, String otp, String purpose) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("Expense Tracker - Your OTP Code");
        
        String body = "Hello,\n\n"
                    + "Your One-Time Password (OTP) for " + purpose + " is: " + otp + "\n\n"
                    + "This code is valid for 5 minutes. Do not share it with anyone.\n\n"
                    + "Thank you,\nExpense Tracker Team";
                    
        message.setText(body);
        
        try {
            mailSender.send(message);
        } catch (Exception e) {
            // Log error but we might just print for now if configuration is missing
            System.err.println("Failed to send email. Did you configure SMTP credentials? " + e.getMessage());
            // Fallback for development if SMTP not configured:
            System.out.println("=========================================");
            System.out.println("MOCK EMAIL SENT TO: " + toEmail);
            System.out.println("SUBJECT: " + message.getSubject());
            System.out.println("BODY: " + message.getText());
            System.out.println("=========================================");
        }
    }

    public void sendPasswordResetSuccessEmail(String toEmail, String plainPassword) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("Expense Tracker - Password Reset Successful");
        
        String body = "Hello,\n\n"
                    + "Your password has been successfully reset.\n"
                    + "Your new password is: " + plainPassword + "\n\n"
                    + "If you did not make this change, please contact support immediately.\n\n"
                    + "Thank you,\nExpense Tracker Team";
                    
        message.setText(body);
        
        try {
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send email. " + e.getMessage());
        }
    }
}
