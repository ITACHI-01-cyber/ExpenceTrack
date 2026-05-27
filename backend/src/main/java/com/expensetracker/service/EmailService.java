package com.expensetracker.service;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import com.resend.services.emails.model.CreateEmailResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;

@Service
public class EmailService {

    @Value("${resend.api.key}")
    private String resendApiKey;
    
    @Value("${resend.from.email}")
    private String fromEmail;

    private Resend resend;

    @PostConstruct
    public void init() {
        this.resend = new Resend(resendApiKey);
    }

    public void sendOtpEmail(String toEmail, String otp, String purpose) {
        String body = "Hello,\n\n"
                    + "Your One-Time Password (OTP) for " + purpose + " is: " + otp + "\n\n"
                    + "This code is valid for 5 minutes. Do not share it with anyone.\n\n"
                    + "Thank you,\nExpense Tracker Team";

        CreateEmailOptions params = CreateEmailOptions.builder()
                .from("Expense Tracker <" + fromEmail + ">")
                .to(toEmail)
                .subject("Expense Tracker - Your OTP Code")
                .text(body)
                .build();

        try {
            CreateEmailResponse data = resend.emails().send(params);
            System.out.println("Resend Email ID: " + data.getId());
        } catch (ResendException e) {
            System.err.println("Failed to send email via Resend: " + e.getMessage());
            // Fallback for development if API key is not configured correctly:
            System.out.println("=========================================");
            System.out.println("MOCK EMAIL SENT TO: " + toEmail);
            System.out.println("SUBJECT: Expense Tracker - Your OTP Code");
            System.out.println("BODY: \n" + body);
            System.out.println("=========================================");
        }
    }

    public void sendPasswordResetSuccessEmail(String toEmail, String plainPassword) {
        String body = "Hello,\n\n"
                    + "Your password has been successfully reset.\n"
                    + "Your new password is: " + plainPassword + "\n\n"
                    + "If you did not make this change, please contact support immediately.\n\n"
                    + "Thank you,\nExpense Tracker Team";
                    
        CreateEmailOptions params = CreateEmailOptions.builder()
                .from("Expense Tracker <" + fromEmail + ">")
                .to(toEmail)
                .subject("Expense Tracker - Password Reset Successful")
                .text(body)
                .build();

        try {
            CreateEmailResponse data = resend.emails().send(params);
            System.out.println("Resend Email ID: " + data.getId());
        } catch (ResendException e) {
            System.err.println("Failed to send email via Resend: " + e.getMessage());
        }
    }
}
