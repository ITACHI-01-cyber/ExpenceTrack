package com.expensetracker.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class User {
    @Id
    private String id;
    private String name;
    private String email;
    private String passwordHash;
    private String profilePicture;
    private LocalDateTime createdAt;
    
    // Settings & Preferences
    @Builder.Default
    private String theme = "light";
    @Builder.Default
    private String currency = "INR";
    @Builder.Default
    private Boolean gmailConnected = false;
    @Builder.Default
    private String accentColor = "purple";
}
