package com.expensetracker.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class CreditRefundRequest {
    private BigDecimal amount;
    private String idempotencyKey;
    private LocalDateTime date;
}
