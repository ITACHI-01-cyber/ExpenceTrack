package com.expensetracker.controller;

import com.expensetracker.dto.ApiResponse;
import com.expensetracker.dto.DashboardSummaryDTO;
import com.expensetracker.model.User;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.service.BudgetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final BudgetService budgetService;
    private final UserRepository userRepository;

    private String getUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getId();
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<DashboardSummaryDTO>> getSummary() {
        LocalDate now = LocalDate.now();
        DashboardSummaryDTO summary = budgetService.getDashboardSummary(getUserId(), now.getMonthValue(), now.getYear());
        return ResponseEntity.ok(ApiResponse.success(summary, "Dashboard summary fetched"));
    }
}
