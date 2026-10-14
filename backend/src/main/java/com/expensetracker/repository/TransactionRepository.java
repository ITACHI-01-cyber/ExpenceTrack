package com.expensetracker.repository;

import com.expensetracker.model.Transaction;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.time.LocalDateTime;

public interface TransactionRepository extends MongoRepository<Transaction, String> {
    List<Transaction> findByUserIdAndDateBetween(String userId, java.time.LocalDateTime startDate, java.time.LocalDateTime endDate);
    List<Transaction> findByUserIdAndTypeAndDateBetween(String userId, String type, java.time.LocalDateTime startDate, java.time.LocalDateTime endDate);
    List<Transaction> findByUserIdAndWalletIdAndTransactionKindAndDateBetween(
            String userId, String walletId, String transactionKind, LocalDateTime startDate, LocalDateTime endDate);
    List<Transaction> findByUserIdAndWalletIdAndTransactionKindAndDateLessThanEqual(
            String userId, String walletId, String transactionKind, LocalDateTime endDate);
    java.util.Optional<Transaction> findByUserIdAndIdempotencyKey(String userId, String idempotencyKey);
    List<Transaction> findByUserIdAndRelatedTransactionIdAndTransactionKind(
            String userId, String relatedTransactionId, String transactionKind);
}
