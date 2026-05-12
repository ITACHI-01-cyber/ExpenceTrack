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
@Document(collection = "transactions")
public class Transaction {
    @Id
    private String id;
    private String userId;
    private String type; // "income" or "expense"
    private String category;
    private Double amount;
    private String currency; // "NGN"
    private String description;
    private LocalDateTime date;
    private Boolean isRecurring;
    private String paymentMethod;
    private String walletId; // link to specific wallet/card
    private LocalDateTime createdAt;
}
