package com.expensetracker.service;

import com.expensetracker.model.Goal;
import com.expensetracker.repository.GoalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GoalService {

    private final GoalRepository goalRepository;

    public Goal createGoal(String userId, Goal goal) {
        goal.setUserId(userId);
        goal.setCreatedAt(LocalDateTime.now());
        return goalRepository.save(goal);
    }

    public List<Goal> getGoalsForMonth(String userId, Integer month, Integer year) {
        return goalRepository.findByUserIdAndMonthAndYear(userId, month, year);
    }

    public void deleteGoal(String goalId) {
        goalRepository.deleteById(goalId);
    }
}
