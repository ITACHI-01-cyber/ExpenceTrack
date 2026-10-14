package com.expensetracker.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class CreditRepaymentRequest {
    private String sourceWalletId;
    private BigDecimal amount;
    private String statementId;
    private String idempotencyKey;
    private LocalDateTime date;
}
