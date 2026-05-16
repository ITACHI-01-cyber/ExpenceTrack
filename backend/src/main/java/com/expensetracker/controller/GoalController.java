package com.expensetracker.controller;

import com.expensetracker.dto.ApiResponse;
import com.expensetracker.model.Goal;
import com.expensetracker.model.User;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.service.GoalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/goals")
@RequiredArgsConstructor
public class GoalController {

    private final GoalService goalService;
    private final UserRepository userRepository;

    private String getUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getId();
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Goal>> createGoal(@RequestBody Goal goal) {
        Goal saved = goalService.createGoal(getUserId(), goal);
        return ResponseEntity.ok(ApiResponse.success(saved, "Goal created successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Goal>>> getGoals(
            @RequestParam Integer month,
            @RequestParam Integer year
    ) {
        List<Goal> goals = goalService.getGoalsForMonth(getUserId(), month, year);
        return ResponseEntity.ok(ApiResponse.success(goals, "Goals fetched successfully"));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Goal>> updateGoalStatus(
            @PathVariable String id,
            @RequestParam Boolean completed
    ) {
        Goal updated = goalService.updateGoalStatus(id, getUserId(), completed);
        return ResponseEntity.ok(ApiResponse.success(updated, "Goal status updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteGoal(@PathVariable String id) {
        goalService.deleteGoal(id, getUserId());
        return ResponseEntity.ok(ApiResponse.success(null, "Goal deleted successfully"));
    }
}
