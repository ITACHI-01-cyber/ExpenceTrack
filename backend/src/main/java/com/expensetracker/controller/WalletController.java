package com.expensetracker.controller;

import com.expensetracker.dto.ApiResponse;
import com.expensetracker.dto.CreditActivityItem;
import com.expensetracker.dto.CreditRepaymentRequest;
import com.expensetracker.dto.CreditRepaymentResponse;
import com.expensetracker.dto.CreditStatementRequest;
import com.expensetracker.dto.WalletCustomizationRequest;
import com.expensetracker.model.CreditRepayment;
import com.expensetracker.model.CreditStatement;
import com.expensetracker.model.User;
import com.expensetracker.model.Wallet;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.service.WalletService;
import com.expensetracker.service.CreditCardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/wallet")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;
    private final CreditCardService creditCardService;
    private final UserRepository userRepository;

    private String getUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getId();
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Wallet>>> getWallets() {
        List<Wallet> wallets = walletService.getWallets(getUserId());
        return ResponseEntity.ok(ApiResponse.success(wallets, "Wallets fetched"));
    }

    @GetMapping("/repayments")
    public ResponseEntity<ApiResponse<List<CreditRepayment>>> getAllRepayments(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        LocalDateTime start = startDate != null ? LocalDate.parse(startDate).atStartOfDay() : null;
        LocalDateTime end = endDate != null ? LocalDate.parse(endDate).atTime(LocalTime.MAX) : null;
        List<CreditRepayment> repayments = creditCardService.getRepayments(getUserId(), start, end);
        return ResponseEntity.ok(ApiResponse.success(repayments, "Credit repayments fetched"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Wallet>> addWallet(@RequestBody Wallet wallet) {
        Wallet created = walletService.addWallet(getUserId(), wallet);
        return ResponseEntity.ok(ApiResponse.success(created, "Wallet added"));
    }

    @PatchMapping("/{id}/add-money")
    public ResponseEntity<ApiResponse<Wallet>> addMoney(@PathVariable String id, @RequestParam Double amount) {
        Wallet updated = walletService.addMoney(id, getUserId(), amount);
        return ResponseEntity.ok(ApiResponse.success(updated, "Money added to wallet"));
    }

    @PostMapping("/{id}/repayments")
    public ResponseEntity<ApiResponse<CreditRepaymentResponse>> repay(
            @PathVariable String id, @RequestBody CreditRepaymentRequest request) {
        CreditRepaymentResponse result = creditCardService.repay(getUserId(), id, request);
        return ResponseEntity.ok(ApiResponse.success(result, "Internal repayment recorded"));
    }

    @DeleteMapping("/{id}/repayments/{repaymentId}")
    public ResponseEntity<ApiResponse<Void>> reverseRepayment(
            @PathVariable String id, @PathVariable String repaymentId) {
        creditCardService.reverseRepayment(getUserId(), id, repaymentId);
        return ResponseEntity.ok(ApiResponse.success(null, "Repayment reversed successfully"));
    }

    @GetMapping("/{id}/statements")
    public ResponseEntity<ApiResponse<List<CreditStatement>>> getStatements(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(
                creditCardService.getStatements(getUserId(), id), "Credit statements fetched"));
    }

    @PostMapping("/{id}/statements/generate")
    public ResponseEntity<ApiResponse<CreditStatement>> generateStatement(
            @PathVariable String id, @RequestBody(required = false) CreditStatementRequest request) {
        LocalDate asOfDate = request == null ? null : request.getAsOfDate();
        return ResponseEntity.ok(ApiResponse.success(
                creditCardService.generateStatement(getUserId(), id, asOfDate), "Credit statement generated"));
    }

    @GetMapping("/{id}/activity")
    public ResponseEntity<ApiResponse<List<CreditActivityItem>>> getCreditActivity(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(
                creditCardService.getActivity(getUserId(), id), "Credit card activity fetched"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Wallet>> updateWallet(@PathVariable String id, @RequestBody Wallet wallet) {
        Wallet updated = walletService.updateWallet(id, getUserId(), wallet);
        return ResponseEntity.ok(ApiResponse.success(updated, "Wallet updated"));
    }

    @PatchMapping("/{id}/customization")
    public ResponseEntity<ApiResponse<Wallet>> updateCustomization(
            @PathVariable String id, @RequestBody Map<String, Object> fields) {
        Wallet updated = walletService.updateCustomization(id, getUserId(), new WalletCustomizationRequest(fields));
        return ResponseEntity.ok(ApiResponse.success(updated, "Wallet customization updated"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteWallet(@PathVariable String id) {
        walletService.deleteWallet(id, getUserId());
        return ResponseEntity.ok(ApiResponse.success(null, "Wallet deleted"));
    }
}
