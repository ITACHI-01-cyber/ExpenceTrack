package com.expensetracker.repository;

import com.expensetracker.model.Wallet;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface WalletRepository extends MongoRepository<Wallet, String> {
    List<Wallet> findByUserId(String userId);
}
