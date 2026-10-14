package com.expensetracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DashboardSummaryDTO {
    private Double availableBalance;
    private Double monthlyIncome;
    private Double monthlyBudgetLimit;
    private Double monthlySpent;
    private Double totalCreditDebt;
    private Double totalCreditLimit;
    private Double availableCredit;
    private Double creditUtilization;
    private Double creditRepaymentsThisMonth;
}
