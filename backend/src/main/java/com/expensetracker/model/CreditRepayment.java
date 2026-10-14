package com.expensetracker.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "credit_repayments")
@CompoundIndex(name = "uniq_credit_repayment_user_key", def = "{'userId': 1, 'idempotencyKey': 1}", unique = true)
public class CreditRepayment {
    @Id
    private String id;
    private String userId;
    private String walletId;
    private String sourceWalletId;
    private String statementId;
    private BigDecimal amount;
    private LocalDateTime date;
    private LocalDateTime createdAt;
    private String timezone;
    private String idempotencyKey;
    @Builder.Default
    private String transactionKind = "repayment";
}
