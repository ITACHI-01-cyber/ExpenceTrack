package com.expensetracker.service;

import com.expensetracker.model.Wallet;
import com.expensetracker.repository.WalletRepository;
import com.expensetracker.repository.TransactionRepository;
import com.expensetracker.repository.CreditRepaymentRepository;
import com.expensetracker.repository.CreditStatementRepository;
import com.expensetracker.dto.WalletCustomizationRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.Map;
import java.util.NoSuchElementException;

import org.springframework.security.access.AccessDeniedException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WalletServiceTest {
    @Mock private WalletRepository walletRepository;
    @Mock private TransactionRepository transactionRepository;
    @Mock private CreditRepaymentRepository creditRepaymentRepository;
    @Mock private CreditStatementRepository creditStatementRepository;
    @InjectMocks private WalletService service;

    @Test
    void legacyCreditWalletKeepsAmbiguousBalanceAndNullTerms() {
        Wallet legacy = Wallet.builder().id("legacy").userId("user-1").cardType("credit")
                .balance(1234.56).cardNumber("4111111111119876").build();
        when(walletRepository.save(any(Wallet.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Wallet saved = service.addWallet("user-1", legacy);

        assertFalse(saved.getCreditTermsConfigured());
        assertNull(saved.getCreditLimit());
        assertNull(saved.getOutstandingBalance());
        assertEquals(1234.56, saved.getBalance());
        assertEquals("9876", saved.getCardNumber());
        assertNull(saved.getCvv());
        verify(walletRepository).save(any(Wallet.class));
    }

    @Test
    void refusesIncompleteCreditTermsButAcceptsExplicitConfiguration() {
        Wallet incomplete = Wallet.builder().cardType("credit").creditTermsConfigured(true).build();
        assertThrows(IllegalArgumentException.class, () -> service.addWallet("user-1", incomplete));

        Wallet configured = Wallet.builder().cardType("credit").creditTermsConfigured(true)
                .creditLimit(new java.math.BigDecimal("100"))
                .outstandingBalance(new java.math.BigDecimal("25"))
                .statementClosingDay(31).paymentDueDay(21).timezone("UTC").build();
        java.util.concurrent.atomic.AtomicReference<Double> storedBalance = new java.util.concurrent.atomic.AtomicReference<>();
        when(walletRepository.save(any(Wallet.class))).thenAnswer(invocation -> {
            Wallet persisted = invocation.getArgument(0);
            storedBalance.set(persisted.getBalance());
            return persisted;
        });
        Wallet result = service.addWallet("user-1", configured);
        assertTrue(result.getCreditTermsConfigured());
        assertEquals(0.0, result.getBalance());
        assertNull(storedBalance.get());
    }

    @Test
    void rejectsUpdatingWalletOwnedByAnotherUser() {
        when(walletRepository.findById("wallet")).thenReturn(Optional.of(
                Wallet.builder().id("wallet").userId("owner").cardType("debit").build()));
        assertThrows(RuntimeException.class,
                () -> service.updateWallet("wallet", "attacker", Wallet.builder().cardType("credit").build()));
        verify(walletRepository, never()).save(any());
    }

    @Test
    void deletesCreditCardWithPositiveOutstandingBalanceAndCleansUpAssociatedData() {
        Wallet creditWallet = Wallet.builder().id("credit").userId("user-1").cardType("credit")
                .creditTermsConfigured(true)
                .outstandingBalance(new java.math.BigDecimal("1500.00")).build();
        when(walletRepository.findById("credit")).thenReturn(Optional.of(creditWallet));

        service.deleteWallet("credit", "user-1");

        verify(transactionRepository).deleteByUserIdAndWalletId("user-1", "credit");
        verify(creditRepaymentRepository).deleteByUserIdAndWalletId("user-1", "credit");
        verify(creditStatementRepository).deleteByUserIdAndWalletId("user-1", "credit");
        verify(walletRepository).delete(creditWallet);
    }

    @Test
    void deletesCreditCardWithZeroBalanceAndCleansUpAssociatedData() {
        Wallet creditWallet = Wallet.builder().id("credit-zero").userId("user-1").cardType("credit")
                .creditTermsConfigured(true)
                .outstandingBalance(java.math.BigDecimal.ZERO).build();
        when(walletRepository.findById("credit-zero")).thenReturn(Optional.of(creditWallet));

        service.deleteWallet("credit-zero", "user-1");

        verify(transactionRepository).deleteByUserIdAndWalletId("user-1", "credit-zero");
        verify(creditRepaymentRepository).deleteByUserIdAndWalletId("user-1", "credit-zero");
        verify(creditStatementRepository).deleteByUserIdAndWalletId("user-1", "credit-zero");
        verify(walletRepository).delete(creditWallet);
    }

    @Test
    void doesNotDeleteTransactionsFromOtherWallets() {
        Wallet wallet = Wallet.builder().id("target-card").userId("user-1").cardType("credit").build();
        when(walletRepository.findById("target-card")).thenReturn(Optional.of(wallet));

        service.deleteWallet("target-card", "user-1");

        verify(transactionRepository).deleteByUserIdAndWalletId("user-1", "target-card");
        verify(transactionRepository, never()).deleteByUserIdAndWalletId(eq("user-1"), eq("other-card"));
        verify(walletRepository).delete(wallet);
    }

    @Test
    void deletesAnOwnedNonCreditWallet() {
        Wallet wallet = Wallet.builder().id("debit").userId("user-1").cardType("debit").build();
        when(walletRepository.findById("debit")).thenReturn(Optional.of(wallet));

        service.deleteWallet("debit", "user-1");

        verify(transactionRepository).deleteByUserIdAndWalletId("user-1", "debit");
        verify(walletRepository).delete(wallet);
    }

    @Test
    void reportsMissingAndForeignWalletsWithoutDeletingThem() {
        assertThrows(IllegalArgumentException.class, () -> service.deleteWallet(" ", "user-1"));
        when(walletRepository.findById("missing")).thenReturn(Optional.empty());
        assertThrows(NoSuchElementException.class, () -> service.deleteWallet("missing", "user-1"));

        Wallet foreign = Wallet.builder().id("foreign").userId("owner").cardType("debit").build();
        when(walletRepository.findById("foreign")).thenReturn(Optional.of(foreign));
        assertThrows(AccessDeniedException.class, () -> service.deleteWallet("foreign", "user-1"));
        verify(walletRepository, never()).delete(foreign);
    }

    @Test
    void serializesLegacyCreditTermsAsFalseWithoutSensitiveCredentials() throws Exception {
        Wallet legacy = Wallet.builder().cardType("credit").cardNumber("9876").cvv("123").build();
        String json = new ObjectMapper().findAndRegisterModules().writeValueAsString(legacy);
        assertTrue(json.contains("\"creditTermsConfigured\":false"));
        assertTrue(json.contains("\"creditLimit\":null"));
        assertFalse(json.contains("cvv"));
        assertFalse(json.contains("123"));
    }

    @Test
    void normalWalletUpdateDoesNotClearOmittedCustomization() {
        Wallet existing = Wallet.builder().id("wallet").userId("user-1").cardType("debit")
                .balance(10.0).designPreset("cyber").primaryColor("#18181B")
                .secondaryColor("#A855F7").textColor("#FFFFFF").accentColor("#22D3EE")
                .artwork("native-artwork").cardStyle("glass").build();
        when(walletRepository.findById("wallet")).thenReturn(Optional.of(existing));
        when(walletRepository.save(any(Wallet.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Wallet saved = service.updateWallet("wallet", "user-1", Wallet.builder()
                .cardType("debit").balance(25.0).build());

        assertEquals("cyber", saved.getDesignPreset());
        assertEquals("#18181B", saved.getPrimaryColor());
        assertEquals("#22D3EE", saved.getAccentColor());
        assertEquals("native-artwork", saved.getArtwork());
        assertEquals("glass", saved.getCardStyle());
        assertEquals(25.0, saved.getBalance());
    }

    @Test
    void customizationPatchChangesOnlySpecifiedFieldsAndCanClearAField() {
        Wallet existing = Wallet.builder().id("wallet").userId("user-1").cardType("debit")
                .designPreset("broco").primaryColor("#166534").secondaryColor("#84CC16")
                .textColor("#FFFFFF").accentColor("#D9F99D").build();
        when(walletRepository.findById("wallet")).thenReturn(Optional.of(existing));
        when(walletRepository.save(any(Wallet.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Wallet saved = service.updateCustomization("wallet", "user-1",
                new WalletCustomizationRequest(Map.of("accentColor", "#000000")));
        assertEquals("broco", saved.getDesignPreset());
        assertEquals("#166534", saved.getPrimaryColor());
        assertEquals("#000000", saved.getAccentColor());

        saved = service.updateCustomization("wallet", "user-1",
                new WalletCustomizationRequest(java.util.Collections.singletonMap("artwork", null)));
        assertNull(saved.getArtwork());
    }

    @Test
    void acceptsAllAndroidCardDesignPresets() {
        Wallet existing = Wallet.builder().id("wallet").userId("user-1").cardType("debit").build();
        when(walletRepository.findById("wallet")).thenReturn(Optional.of(existing));
        when(walletRepository.save(any(Wallet.class))).thenAnswer(invocation -> invocation.getArgument(0));

        String[] androidPresets = {"bredo", "drino", "wuhu", "yo", "ocean", "forest", "broco", "tonot", "kocheng", "cyber", "midnight", "aurora", "sunset"};
        for (String preset : androidPresets) {
            Wallet saved = service.updateCustomization("wallet", "user-1",
                    new WalletCustomizationRequest(Map.of("designPreset", preset)));
            assertEquals(preset, saved.getDesignPreset());
        }
    }

    @Test
    void sanitizesNonCreditWalletNullBalanceToZero() {
        Wallet nullBalanceDebit = Wallet.builder().id("debit1").userId("user-1").cardType("debit").balance(null).build();
        when(walletRepository.findByUserId("user-1")).thenReturn(java.util.List.of(nullBalanceDebit));

        java.util.List<Wallet> wallets = service.getWallets("user-1");
        assertEquals(1, wallets.size());
        assertEquals(0.0, wallets.get(0).getBalance());
    }

    @Test
    void returnsNumericCompatibilityBalanceForConfiguredCreditWalletWithoutWritingIt() {
        Wallet configuredCredit = Wallet.builder().id("credit1").userId("user-1").cardType("credit")
                .creditTermsConfigured(true).creditLimit(new java.math.BigDecimal("1000.00"))
                .outstandingBalance(new java.math.BigDecimal("250.00")).balance(null).build();
        when(walletRepository.findByUserId("user-1")).thenReturn(java.util.List.of(configuredCredit));

        Wallet wallet = service.getWallets("user-1").get(0);

        assertEquals(0.0, wallet.getBalance());
        assertEquals(new java.math.BigDecimal("250.00"), wallet.getOutstandingBalance());
        verify(walletRepository, never()).save(any(Wallet.class));
    }
}
