package com.expensetracker.repository;

import com.expensetracker.model.Goal;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GoalRepository extends MongoRepository<Goal, String> {
    List<Goal> findByUserIdAndMonthAndYear(String userId, Integer month, Integer year);
    List<Goal> findByUserId(String userId);
}
