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
        if (goal.getCompleted() == null) {
            goal.setCompleted(false);
        }
        goal.setCreatedAt(LocalDateTime.now());
        return goalRepository.save(goal);
    }

    public List<Goal> getGoalsForMonth(String userId, Integer month, Integer year) {
        return goalRepository.findByUserIdAndMonthAndYear(userId, month, year);
    }

    public Goal updateGoalStatus(String goalId, String userId, Boolean completed) {
        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new RuntimeException("Goal not found"));

        if (!goal.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        goal.setCompleted(Boolean.TRUE.equals(completed));
        return goalRepository.save(goal);
    }

    public Goal updateGoal(String goalId, String userId, Goal goalDetails) {
        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new RuntimeException("Goal not found"));

        if (!goal.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        goal.setTitle(goalDetails.getTitle());
        goal.setAmount(goalDetails.getAmount());
        goal.setMedium(goalDetails.getMedium());
        if (goalDetails.getMonth() != null) {
            goal.setMonth(goalDetails.getMonth());
        }
        if (goalDetails.getYear() != null) {
            goal.setYear(goalDetails.getYear());
        }
        if (goalDetails.getCompleted() != null) {
            goal.setCompleted(goalDetails.getCompleted());
        }

        return goalRepository.save(goal);
    }

    public void deleteGoal(String goalId, String userId) {
        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new RuntimeException("Goal not found"));

        if (!goal.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        goalRepository.delete(goal);
    }
}
