package com.expensetracker.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class CreditStatementRequest {
    private LocalDate asOfDate;
}
