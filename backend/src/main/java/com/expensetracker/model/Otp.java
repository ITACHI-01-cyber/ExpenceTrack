package com.expensetracker.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "otps")
public class Otp {
    @Id
    private String id;
    
    @Indexed
    private String email;
    
    private String code;
    
    private Purpose purpose; // e.g. PASSWORD_RESET, USERNAME_RECOVERY
    
    @Builder.Default
    private int attempts = 0;
    
    @Indexed(expireAfterSeconds = 300) // 5 minutes TTL
    private LocalDateTime createdAt;
    
    public enum Purpose {
        REGISTER,
        LOGIN,
        PASSWORD_RESET,
        USERNAME_RECOVERY
    }
}
