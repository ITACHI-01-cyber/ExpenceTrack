package com.expensetracker.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.expensetracker.model.Wallet;
import com.expensetracker.repository.WalletRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class WalletService {

    private final WalletRepository walletRepository;

    public List<Wallet> getWallets(String userId) {
        return walletRepository.findByUserId(userId);
    }

    public Wallet addWallet(String userId, Wallet wallet) {
        wallet.setUserId(userId);
        wallet.setCvv(null);
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

        if (!userId.equals(wallet.getUserId())) {
            throw new RuntimeException("Unauthorized");
        }

        Double walletBalance = wallet.getBalance();
        double currentBalance = walletBalance == null ? 0.0 : walletBalance;
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
        wallet.setCvv(null);
        Double walletDetailsBalance = walletDetails.getBalance();
        wallet.setBalance(walletDetailsBalance == null ? 0.0 : walletDetailsBalance);
        wallet.setIsDefault(walletDetails.getIsDefault());
        wallet.setCardBrand(walletDetails.getCardBrand());
        wallet.setDesignPreset(walletDetails.getDesignPreset());
        wallet.setPrimaryColor(walletDetails.getPrimaryColor());
        wallet.setSecondaryColor(walletDetails.getSecondaryColor());
        wallet.setTextColor(walletDetails.getTextColor());

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
