package com.expensetracker.service;

import com.expensetracker.model.Wallet;
import com.expensetracker.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WalletService {

    private final WalletRepository walletRepository;

    public List<Wallet> getWallets(String userId) {
        return walletRepository.findByUserId(userId);
    }

    public Wallet addWallet(String userId, Wallet wallet) {
        wallet.setUserId(userId);
        return walletRepository.save(wallet);
    }

    public void deleteWallet(String id, String userId) {
        Wallet wallet = walletRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));
                
        if (!wallet.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }
        walletRepository.delete(wallet);
    }
}
