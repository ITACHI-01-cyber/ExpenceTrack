package com.expensetracker.repository;

import com.expensetracker.model.Transaction;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface TransactionRepository extends MongoRepository<Transaction, String> {
    List<Transaction> findByUserIdAndDateBetween(String userId, java.time.LocalDateTime startDate, java.time.LocalDateTime endDate);
    List<Transaction> findByUserIdAndTypeAndDateBetween(String userId, String type, java.time.LocalDateTime startDate, java.time.LocalDateTime endDate);
}
