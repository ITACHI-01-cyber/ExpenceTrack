package com.expensetracker.repository;

import com.expensetracker.model.CreditStatement;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface CreditStatementRepository extends MongoRepository<CreditStatement, String> {
    Optional<CreditStatement> findByWalletIdAndPeriodEnd(String walletId, LocalDate periodEnd);
    Optional<CreditStatement> findByIdAndUserIdAndWalletId(String id, String userId, String walletId);
    List<CreditStatement> findByUserIdAndWalletIdOrderByPeriodEndDesc(String userId, String walletId);
}
