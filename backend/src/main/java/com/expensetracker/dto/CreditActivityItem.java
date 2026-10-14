package com.expensetracker.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class CreditActivityItem {
    private String id;
    private String transactionKind;
    private String type;
    private BigDecimal amount;
    private String category;
    private String description;
    private LocalDateTime date;
    private String walletId;
    private String sourceWalletId;
    private String statementId;
    private String idempotencyKey;
    private String relatedTransactionId;
}
