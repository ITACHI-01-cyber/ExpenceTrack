package com.expensetracker.service;

import com.expensetracker.model.Wallet;
import com.expensetracker.repository.WalletRepository;
import com.expensetracker.dto.WalletCustomizationRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WalletServiceTest {
    @Mock private WalletRepository walletRepository;
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
        when(walletRepository.save(any(Wallet.class))).thenAnswer(invocation -> invocation.getArgument(0));
        Wallet result = service.addWallet("user-1", configured);
        assertTrue(result.getCreditTermsConfigured());
        assertNull(result.getBalance());
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
    void refusesToDeleteCreditCardWithOutstandingLiability() {
        when(walletRepository.findById("credit")).thenReturn(Optional.of(
                Wallet.builder().id("credit").userId("user-1").cardType("credit")
                        .creditTermsConfigured(true)
                        .outstandingBalance(new java.math.BigDecimal("0.01")).build()));

        assertThrows(IllegalArgumentException.class, () -> service.deleteWallet("credit", "user-1"));
        verify(walletRepository, never()).delete(any(Wallet.class));
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
}
