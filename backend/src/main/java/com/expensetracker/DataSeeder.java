package com.expensetracker;

import com.expensetracker.model.Budget;
import com.expensetracker.model.Transaction;
import com.expensetracker.model.User;
import com.expensetracker.model.Wallet;
import com.expensetracker.repository.BudgetRepository;
import com.expensetracker.repository.TransactionRepository;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final BudgetRepository budgetRepository;
    private final WalletRepository walletRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.enabled:false}")
    private boolean seedEnabled;

    @Override
    public void run(String... args) throws Exception {
        if (!seedEnabled) {
            return;
        }

        if (userRepository.count() == 0) {
            System.out.println("Seeding database...");

            User demoUser = User.builder()
                    .name("Rachel Simmons")
                    .email("rachel@demo.com")
                    .passwordHash(passwordEncoder.encode("password123"))
                    .createdAt(LocalDateTime.now())
                    .build();
            userRepository.save(demoUser);

            String userId = demoUser.getId();

            // Transactions (September 2022)
            List<Transaction> transactions = List.of(
                    Transaction.builder().userId(userId).type("income").category("Project Bonus").amount(5000.0).currency("NGN").description("Project Bonus").date(LocalDateTime.of(2022, 9, 1, 10, 30)).isRecurring(false).createdAt(LocalDateTime.now()).build(),
                    Transaction.builder().userId(userId).type("expense").category("Gadgets").amount(172000.0).currency("NGN").description("New Phone").date(LocalDateTime.of(2022, 9, 2, 14, 30)).isRecurring(false).createdAt(LocalDateTime.now()).build(),
                    Transaction.builder().userId(userId).type("expense").category("Housekeeping").amount(5000.0).currency("NGN").description("Cleaning").date(LocalDateTime.of(2022, 9, 3, 16, 30)).isRecurring(true).createdAt(LocalDateTime.now()).build(),
                    Transaction.builder().userId(userId).type("expense").category("Daily Savings").amount(1500.0).currency("NGN").description("Auto Save").date(LocalDateTime.of(2022, 9, 6, 12, 21)).isRecurring(true).createdAt(LocalDateTime.now()).build()
                    // add more as needed
            );
            transactionRepository.saveAll(transactions);

            // Budget (January)
            Budget demoBudget = Budget.builder()
                    .userId(userId)
                    .month(1)
                    .year(LocalDateTime.now().getYear())
                    .monthlyIncome(3005.0)
                    .budgetLimit(4000.0)
                    .savingRate(32.0)
                    .totalBills(1381.0)
                    .categories(List.of(
                            new Budget.CategoryBudget("Housing", 1000.0, 338.0),
                            new Budget.CategoryBudget("Personal Care", 200.0, 97.0)
                    ))
                    .createdAt(LocalDateTime.now())
                    .build();
            budgetRepository.save(demoBudget);

            // Wallets
            List<Wallet> wallets = List.of(
                    Wallet.builder().userId(userId).cardNumber("3922").cardType("mastercard").balance(321500.09).bankName("Access Bank").isDefault(true).build(),
                    Wallet.builder().userId(userId).cardNumber("1234").cardType("visa").balance(15000.00).bankName("GTBank").isDefault(false).build()
            );
            walletRepository.saveAll(wallets);

            System.out.println("Database seeding completed.");
        }
    }
}
