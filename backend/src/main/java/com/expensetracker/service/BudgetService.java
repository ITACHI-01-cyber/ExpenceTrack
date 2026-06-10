package com.expensetracker.service;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.Objects;

import org.springframework.stereotype.Service;

import com.expensetracker.dto.DashboardSummaryDTO;
import com.expensetracker.model.Budget;
import com.expensetracker.model.Transaction;
import com.expensetracker.model.Wallet;
import com.expensetracker.repository.BudgetRepository;
import com.expensetracker.repository.TransactionRepository;
import com.expensetracker.repository.WalletRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final TransactionRepository transactionRepository;
    private final WalletRepository walletRepository;

    public Budget getBudget(String userId, Integer month, Integer year) {
        return budgetRepository.findByUserIdAndMonthAndYear(userId, month, year)
                .orElse(null);
    }

    public Budget saveBudget(String userId, Budget budget) {
        budget.setUserId(userId);
        budget.setCreatedAt(LocalDateTime.now());

        var existingBudget = budgetRepository.findByUserIdAndMonthAndYear(userId, budget.getMonth(), budget.getYear());
        if (existingBudget.isPresent()) {
            Budget existing = existingBudget.get();
            if (budget.getMonthlyIncome() != null) existing.setMonthlyIncome(budget.getMonthlyIncome());
            if (budget.getBudgetLimit() != null) existing.setBudgetLimit(budget.getBudgetLimit());
            if (budget.getCategories() != null) existing.setCategories(budget.getCategories());
            if (budget.getSavingRate() != null) existing.setSavingRate(budget.getSavingRate());
            if (budget.getTotalBills() != null) existing.setTotalBills(budget.getTotalBills());
            return Objects.requireNonNull(budgetRepository.save(existing));
        }

        return Objects.requireNonNull(budgetRepository.save(budget));
    }

    public DashboardSummaryDTO getDashboardSummary(String userId, Integer month, Integer year) {
        List<Wallet> wallets = walletRepository.findByUserId(userId);
        double totalBalance = wallets.stream()
                .mapToDouble(w -> {
                    Double balance = w.getBalance();
                    return balance != null ? balance : 0.0;
                })
                .sum();

        LocalDateTime startDate = YearMonth.of(year, month).atDay(1).atStartOfDay();
        LocalDateTime endDate = YearMonth.of(year, month).atEndOfMonth().atTime(23, 59, 59);

        List<Transaction> transactions = transactionRepository.findByUserIdAndDateBetween(userId, startDate, endDate);

        Budget budget = getBudget(userId, month, year);

        Double manualIncome = (budget != null && budget.getMonthlyIncome() != null) ? budget.getMonthlyIncome() : null;

        double monthlyIncome = manualIncome != null ? manualIncome : transactions.stream()
                .filter(t -> "income".equals(t.getType()))
                .mapToDouble(t -> {
                    Double amount = t.getAmount();
                    return amount != null ? amount : 0.0;
                })
                .sum();

        double monthlySpent = transactions.stream()
                .filter(t -> "expense".equals(t.getType()))
                .mapToDouble(t -> {
                    Double amount = t.getAmount();
                    return amount != null ? amount : 0.0;
                })
                .sum();

        double monthlyBudgetLimit = 0.0;
        if (budget != null && budget.getBudgetLimit() != null) {
            monthlyBudgetLimit = budget.getBudgetLimit();
        }

        return DashboardSummaryDTO.builder()
                .availableBalance(totalBalance)
                .monthlyIncome(monthlyIncome)
                .monthlyBudgetLimit(monthlyBudgetLimit)
                .monthlySpent(monthlySpent)
                .build();
    }
}
