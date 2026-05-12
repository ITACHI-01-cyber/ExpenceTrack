package com.expensetracker.controller;

import com.expensetracker.dto.ApiResponse;
import com.expensetracker.model.Budget;
import com.expensetracker.model.User;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.service.BudgetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/budget")
@RequiredArgsConstructor
public class BudgetController {

    private final BudgetService budgetService;
    private final UserRepository userRepository;

    private String getUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getId();
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Budget>> getBudget(
            @RequestParam Integer month,
            @RequestParam Integer year
    ) {
        Budget budget = budgetService.getBudget(getUserId(), month, year);
        return ResponseEntity.ok(ApiResponse.success(budget, "Budget fetched"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Budget>> saveBudget(@RequestBody Budget budget) {
        Budget saved = budgetService.saveBudget(getUserId(), budget);
        return ResponseEntity.ok(ApiResponse.success(saved, "Budget saved"));
    }
}
