package com.expensetracker.service;

import com.expensetracker.model.Transaction;
import com.expensetracker.repository.TransactionRepository;
import com.expensetracker.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final WalletRepository walletRepository;

    public List<Transaction> getTransactions(String userId, Integer month, Integer year, String type) {
        LocalDateTime startDate = YearMonth.of(year, month).atDay(1).atStartOfDay();
        LocalDateTime endDate = YearMonth.of(year, month).atEndOfMonth().atTime(23, 59, 59);
        
        if (type != null && !type.isEmpty()) {
            return transactionRepository.findByUserIdAndTypeAndDateBetween(userId, type, startDate, endDate);
        }
        return transactionRepository.findByUserIdAndDateBetween(userId, startDate, endDate);
    }

    public Transaction addTransaction(String userId, Transaction transaction) {
        transaction.setUserId(userId);
        transaction.setCreatedAt(LocalDateTime.now());
        if (transaction.getDate() == null) {
            transaction.setDate(LocalDateTime.now());
        }

        if (transaction.getWalletId() != null && !transaction.getWalletId().isEmpty()) {
            walletRepository.findById(transaction.getWalletId()).ifPresent(wallet -> {
                double amount = transaction.getAmount() == null ? 0 : transaction.getAmount();
                double currentBalance = wallet.getBalance() == null ? 0 : wallet.getBalance();
                if ("expense".equals(transaction.getType())) {
                    wallet.setBalance(currentBalance - amount);
                } else if ("income".equals(transaction.getType())) {
                    wallet.setBalance(currentBalance + amount);
                }
                walletRepository.save(wallet);
            });
        }

        return transactionRepository.save(transaction);
    }

    public Transaction updateTransaction(String id, String userId, Transaction transactionDetails) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));
                
        if (!transaction.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        // Revert old transaction effect on wallet
        if (transaction.getWalletId() != null && !transaction.getWalletId().isEmpty()) {
            walletRepository.findById(transaction.getWalletId()).ifPresent(wallet -> {
                double amount = transaction.getAmount() == null ? 0 : transaction.getAmount();
                double currentBalance = wallet.getBalance() == null ? 0 : wallet.getBalance();
                if ("expense".equals(transaction.getType())) {
                    wallet.setBalance(currentBalance + amount);
                } else if ("income".equals(transaction.getType())) {
                    wallet.setBalance(currentBalance - amount);
                }
                walletRepository.save(wallet);
            });
        }

        transaction.setType(transactionDetails.getType());
        transaction.setCategory(transactionDetails.getCategory());
        transaction.setAmount(transactionDetails.getAmount());
        transaction.setDescription(transactionDetails.getDescription());
        transaction.setDate(transactionDetails.getDate());
        transaction.setIsRecurring(transactionDetails.getIsRecurring());
        transaction.setWalletId(transactionDetails.getWalletId());
        
        // Apply new transaction effect on wallet
        if (transaction.getWalletId() != null && !transaction.getWalletId().isEmpty()) {
            walletRepository.findById(transaction.getWalletId()).ifPresent(wallet -> {
                double amount = transaction.getAmount() == null ? 0 : transaction.getAmount();
                double currentBalance = wallet.getBalance() == null ? 0 : wallet.getBalance();
                if ("expense".equals(transaction.getType())) {
                    wallet.setBalance(currentBalance - amount);
                } else if ("income".equals(transaction.getType())) {
                    wallet.setBalance(currentBalance + amount);
                }
                walletRepository.save(wallet);
            });
        }

        return transactionRepository.save(transaction);
    }

    public void deleteTransaction(String id, String userId) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));
                
        if (!transaction.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        if (transaction.getWalletId() != null && !transaction.getWalletId().isEmpty()) {
            walletRepository.findById(transaction.getWalletId()).ifPresent(wallet -> {
                double amount = transaction.getAmount() == null ? 0 : transaction.getAmount();
                double currentBalance = wallet.getBalance() == null ? 0 : wallet.getBalance();
                if ("expense".equals(transaction.getType())) {
                    wallet.setBalance(currentBalance + amount);
                } else if ("income".equals(transaction.getType())) {
                    wallet.setBalance(currentBalance - amount);
                }
                walletRepository.save(wallet);
            });
        }

        transactionRepository.delete(transaction);
    }
}
