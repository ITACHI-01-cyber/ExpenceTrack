package com.expensetracker.repository;

import com.expensetracker.model.Budget;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface BudgetRepository extends MongoRepository<Budget, String> {
    Optional<Budget> findByUserIdAndMonthAndYear(String userId, Integer month, Integer year);
}
