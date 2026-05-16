package com.expensetracker.controller;

import com.expensetracker.dto.ApiResponse;
import com.expensetracker.model.User;
import com.expensetracker.model.Wallet;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/wallet")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;
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

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Wallet>> updateWallet(@PathVariable String id, @RequestBody Wallet wallet) {
        Wallet updated = walletService.updateWallet(id, getUserId(), wallet);
        return ResponseEntity.ok(ApiResponse.success(updated, "Wallet updated"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteWallet(@PathVariable String id) {
        walletService.deleteWallet(id, getUserId());
        return ResponseEntity.ok(ApiResponse.success(null, "Wallet deleted"));
    }
}
