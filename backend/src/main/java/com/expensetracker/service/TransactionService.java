package com.expensetracker.service;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;

import org.springframework.stereotype.Service;

import com.expensetracker.model.Transaction;
import com.expensetracker.dto.CreditRefundRequest;
import com.expensetracker.repository.TransactionRepository;
import com.expensetracker.repository.WalletRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final WalletRepository walletRepository;
    private final CreditCardService creditCardService;

    public List<Transaction> getTransactions(String userId, Integer month, Integer year, String type) {
        LocalDateTime startDate = YearMonth.of(year, month).atDay(1).atStartOfDay();
        LocalDateTime endDate = YearMonth.of(year, month).atEndOfMonth().atTime(23, 59, 59);

        return getTransactionsBetween(userId, startDate, endDate, type);
    }

    public List<Transaction> getTransactionsBetween(String userId, LocalDateTime startDate, LocalDateTime endDate, String type) {
        if (type != null && !type.isEmpty()) {
            return transactionRepository.findByUserIdAndTypeAndDateBetween(userId, type, startDate, endDate);
        }
        return transactionRepository.findByUserIdAndDateBetween(userId, startDate, endDate);
    }

    public Transaction addTransaction(String userId, Transaction transaction) {
        if (transaction.getWalletId() != null) {
            var wallet = walletRepository.findById(transaction.getWalletId());
            if (wallet.isPresent() && "credit".equalsIgnoreCase(wallet.get().getCardType())) {
                return creditCardService.recordPurchase(userId, transaction);
            }
        }
        transaction.setUserId(userId);
        transaction.setCreatedAt(LocalDateTime.now());
        transaction.setTransactionKind("standard");
        if (transaction.getDate() == null) {
            transaction.setDate(LocalDateTime.now());
        }

        applyTransactionToWallet(userId, transaction, false);

        return transactionRepository.save(transaction);
    }

    public Transaction recordCreditRefund(String userId, String purchaseId, CreditRefundRequest request) {
        return creditCardService.recordRefund(userId, purchaseId, request);
    }

    public Transaction updateTransaction(String id, String userId, Transaction transactionDetails) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        if (!userId.equals(transaction.getUserId())) {
            throw new RuntimeException("Unauthorized");
        }

        if ("purchase".equals(transaction.getTransactionKind())) {
            return creditCardService.updatePurchase(id, userId, transactionDetails);
        }
        if ("refund".equals(transaction.getTransactionKind())) {
            throw new IllegalArgumentException("Credit refunds cannot be edited; record a separate refund instead");
        }
        if (isCreditCard(transactionDetails.getWalletId())) {
            throw new IllegalArgumentException("Create a new credit purchase instead of converting an existing transaction");
        }

        applyTransactionToWallet(userId, transaction, true);

        transaction.setType(transactionDetails.getType());
        transaction.setCategory(transactionDetails.getCategory());
        transaction.setAmount(transactionDetails.getAmount());
        transaction.setDescription(transactionDetails.getDescription());
        transaction.setDate(transactionDetails.getDate());
        transaction.setIsRecurring(transactionDetails.getIsRecurring());
        transaction.setWalletId(transactionDetails.getWalletId());
        
        applyTransactionToWallet(userId, transaction, false);

        return transactionRepository.save(transaction);
    }

    public void deleteTransaction(String id, String userId) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        if (!userId.equals(transaction.getUserId())) {
            throw new RuntimeException("Unauthorized");
        }

        if ("purchase".equals(transaction.getTransactionKind())) {
            creditCardService.deletePurchase(id, userId);
            return;
        }
        if ("refund".equals(transaction.getTransactionKind())) {
            throw new IllegalArgumentException("Credit refunds cannot be deleted or reversed through this endpoint");
        }

        applyTransactionToWallet(userId, transaction, true);

        transactionRepository.delete(transaction);
    }

    private void applyTransactionToWallet(String userId, Transaction transaction, boolean reverse) {
        if (transaction.getWalletId() == null || transaction.getWalletId().isEmpty()) {
            return;
        }

        walletRepository.findById(transaction.getWalletId()).ifPresent(wallet -> {
            if (!wallet.getUserId().equals(userId)) {
                throw new RuntimeException("Unauthorized");
            }

            double amount = transaction.getAmount() == null ? 0 : transaction.getAmount();
            double currentBalance = wallet.getBalance() == null ? 0 : wallet.getBalance();
            double signedAmount = "expense".equals(transaction.getType()) ? -amount : amount;
            wallet.setBalance(currentBalance + (reverse ? -signedAmount : signedAmount));
            walletRepository.save(wallet);
        });
    }

    private boolean isCreditCard(String walletId) {
        return walletId != null && walletRepository.findById(walletId)
                .map(wallet -> "credit".equalsIgnoreCase(wallet.getCardType()))
                .orElse(false);
    }
}
