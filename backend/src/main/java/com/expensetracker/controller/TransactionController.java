package com.expensetracker.controller;

import com.expensetracker.dto.ApiResponse;
import com.expensetracker.model.Transaction;
import com.expensetracker.model.User;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;
    private final UserRepository userRepository;

    private String getUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getId();
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Transaction>>> getTransactions(
            @RequestParam Integer month,
            @RequestParam Integer year,
            @RequestParam(required = false) String type
    ) {
        List<Transaction> transactions = transactionService.getTransactions(getUserId(), month, year, type);
        return ResponseEntity.ok(ApiResponse.success(transactions, "Transactions fetched"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Transaction>> addTransaction(@RequestBody Transaction transaction) {
        Transaction created = transactionService.addTransaction(getUserId(), transaction);
        return ResponseEntity.ok(ApiResponse.success(created, "Transaction added"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Transaction>> updateTransaction(
            @PathVariable String id,
            @RequestBody Transaction transaction) {
        Transaction updated = transactionService.updateTransaction(id, getUserId(), transaction);
        return ResponseEntity.ok(ApiResponse.success(updated, "Transaction updated"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTransaction(@PathVariable String id) {
        transactionService.deleteTransaction(id, getUserId());
        return ResponseEntity.ok(ApiResponse.success(null, "Transaction deleted"));
    }
}
