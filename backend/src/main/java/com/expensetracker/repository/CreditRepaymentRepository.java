package com.expensetracker.repository;

import com.expensetracker.model.CreditRepayment;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface CreditRepaymentRepository extends MongoRepository<CreditRepayment, String> {
    Optional<CreditRepayment> findByUserIdAndIdempotencyKey(String userId, String idempotencyKey);
    Optional<CreditRepayment> findByIdAndUserId(String id, String userId);
    List<CreditRepayment> findByUserIdAndWalletIdAndDateBetween(
            String userId, String walletId, LocalDateTime start, LocalDateTime end);
    List<CreditRepayment> findByUserIdAndWalletIdAndDateLessThanEqual(
            String userId, String walletId, LocalDateTime end);
    List<CreditRepayment> findByUserIdAndWalletIdOrderByDateDesc(String userId, String walletId);
    List<CreditRepayment> findByUserId(String userId);
    List<CreditRepayment> findByUserIdAndDateBetween(String userId, LocalDateTime start, LocalDateTime end);
    void deleteByUserIdAndWalletId(String userId, String walletId);
}
