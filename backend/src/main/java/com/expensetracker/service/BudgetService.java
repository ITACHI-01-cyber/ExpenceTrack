package com.expensetracker.service;

import com.expensetracker.dto.DashboardSummaryDTO;
import com.expensetracker.model.Budget;
import com.expensetracker.model.Transaction;
import com.expensetracker.model.Wallet;
import com.expensetracker.repository.BudgetRepository;
import com.expensetracker.repository.TransactionRepository;
import com.expensetracker.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;

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
        
        return budgetRepository.findByUserIdAndMonthAndYear(userId, budget.getMonth(), budget.getYear())
                .map(existing -> {
                    if (budget.getMonthlyIncome() != null) existing.setMonthlyIncome(budget.getMonthlyIncome());
                    if (budget.getBudgetLimit() != null) existing.setBudgetLimit(budget.getBudgetLimit());
                    if (budget.getCategories() != null) existing.setCategories(budget.getCategories());
                    if (budget.getSavingRate() != null) existing.setSavingRate(budget.getSavingRate());
                    if (budget.getTotalBills() != null) existing.setTotalBills(budget.getTotalBills());
                    return budgetRepository.save(existing);
                })
                .orElseGet(() -> budgetRepository.save(budget));
    }

    public DashboardSummaryDTO getDashboardSummary(String userId, Integer month, Integer year) {
        List<Wallet> wallets = walletRepository.findByUserId(userId);
        Double totalBalance = wallets.stream()
                .filter(w -> w.getBalance() != null)
                .mapToDouble(Wallet::getBalance)
                .sum();

        LocalDateTime startDate = YearMonth.of(year, month).atDay(1).atStartOfDay();
        LocalDateTime endDate = YearMonth.of(year, month).atEndOfMonth().atTime(23, 59, 59);
        
        List<Transaction> transactions = transactionRepository.findByUserIdAndDateBetween(userId, startDate, endDate);
        
        Budget budget = getBudget(userId, month, year);
        
        Double manualIncome = (budget != null && budget.getMonthlyIncome() != null) ? budget.getMonthlyIncome() : null;
        
        Double monthlyIncome = manualIncome != null ? manualIncome : transactions.stream()
                .filter(t -> "income".equals(t.getType()))
                .mapToDouble(Transaction::getAmount)
                .sum();
                
        Double monthlySpent = transactions.stream()
                .filter(t -> "expense".equals(t.getType()))
                .mapToDouble(Transaction::getAmount)
                .sum();
                
        Double monthlyBudgetLimit = (budget != null && budget.getBudgetLimit() != null) ? budget.getBudgetLimit() : 0.0;

        return DashboardSummaryDTO.builder()
                .availableBalance(totalBalance)
                .monthlyIncome(monthlyIncome)
                .monthlyBudgetLimit(monthlyBudgetLimit)
                .monthlySpent(monthlySpent)
                .build();
    }
}
