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
        if (wallet.getBalance() == null) {
            wallet.setBalance(0.0);
        }
        return walletRepository.save(wallet);
    }

    public Wallet addMoney(String id, String userId, Double amount) {
        if (amount == null || amount <= 0) {
            throw new RuntimeException("Amount must be greater than zero");
        }

        Wallet wallet = walletRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));

        if (!wallet.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        double currentBalance = wallet.getBalance() == null ? 0.0 : wallet.getBalance();
        wallet.setBalance(currentBalance + amount);
        return walletRepository.save(wallet);
    }

    public Wallet updateWallet(String id, String userId, Wallet walletDetails) {
        Wallet wallet = walletRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));

        if (!wallet.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        wallet.setCardType(walletDetails.getCardType());
        wallet.setBankName(walletDetails.getBankName());
        wallet.setCardHolderName(walletDetails.getCardHolderName());
        wallet.setCardNumber(walletDetails.getCardNumber());
        wallet.setExpiryDate(walletDetails.getExpiryDate());
        wallet.setCvv(walletDetails.getCvv());
        wallet.setBalance(walletDetails.getBalance() == null ? 0.0 : walletDetails.getBalance());
        wallet.setIsDefault(walletDetails.getIsDefault());

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
