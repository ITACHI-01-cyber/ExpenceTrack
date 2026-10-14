package com.expensetracker.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class CreditRepaymentResponse {
    private String id;
    private String walletId;
    private String sourceWalletId;
    private String statementId;
    private BigDecimal amount;
    private LocalDateTime date;
    private String transactionKind;
    private String idempotencyKey;
    private BigDecimal outstandingBalance;
    private BigDecimal sourceWalletBalance;
    private boolean replayed;
}
