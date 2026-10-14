package com.expensetracker.service;

import com.expensetracker.dto.CreditRepaymentRequest;
import com.expensetracker.dto.CreditRefundRequest;
import com.expensetracker.model.CreditRepayment;
import com.expensetracker.model.CreditStatement;
import com.expensetracker.model.Transaction;
import com.expensetracker.model.Wallet;
import com.expensetracker.repository.CreditRepaymentRepository;
import com.expensetracker.repository.CreditStatementRepository;
import com.expensetracker.repository.TransactionRepository;
import com.expensetracker.repository.WalletRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CreditCardServiceTest {
    @Mock private WalletRepository walletRepository;
    @Mock private TransactionRepository transactionRepository;
    @Mock private CreditRepaymentRepository repaymentRepository;
    @Mock private CreditStatementRepository statementRepository;
    @InjectMocks private CreditCardService service;

    private Wallet card;

    @BeforeEach
    void setUp() {
        card = Wallet.builder()
                .id("credit-1").userId("user-1").cardType("credit")
                .creditTermsConfigured(true)
                .creditLimit(new BigDecimal("500.00"))
                .outstandingBalance(new BigDecimal("200.00"))
                .creditOpeningBalance(new BigDecimal("200.00"))
                .creditTermsConfiguredAt(LocalDateTime.of(2024, 1, 1, 0, 0))
                .statementClosingDay(31).paymentDueDay(21).timezone("UTC")
                .build();
    }

    @Test
    void recordsPurchaseAsSingleExpenseWithoutChangingWalletCash() {
        when(walletRepository.findById("credit-1")).thenReturn(Optional.of(card));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(walletRepository.save(any(Wallet.class))).thenAnswer(invocation -> invocation.getArgument(0));
        Transaction purchase = Transaction.builder()
                .walletId("credit-1").type("expense").amount(75.25).category("Food").build();

        Transaction saved = service.recordPurchase("user-1", purchase);

        assertEquals("purchase", saved.getTransactionKind());
        assertEquals("expense", saved.getType());
        assertEquals(0, card.getOutstandingBalance().compareTo(new BigDecimal("275.25")));
        assertNull(card.getBalance());
        verify(transactionRepository, times(1)).save(purchase);
    }

    @Test
    void rejectsUnconfiguredAndOverLimitPurchasesAndForeignCard() {
        when(walletRepository.findById("credit-1")).thenReturn(Optional.of(card));
        Transaction purchase = Transaction.builder().walletId("credit-1").type("expense").amount(350.0).build();
        assertThrows(IllegalArgumentException.class, () -> service.recordPurchase("user-1", purchase));

        card.setCreditTermsConfigured(false);
        purchase.setAmount(1.0);
        assertThrows(IllegalArgumentException.class, () -> service.recordPurchase("user-1", purchase));

        card.setCreditTermsConfigured(true);
        card.setUserId("somebody-else");
        assertThrows(IllegalArgumentException.class, () -> service.recordPurchase("user-1", purchase));
        verify(transactionRepository, never()).save(any());
    }

    @Test
    void recordsPartialAndFullRepaymentAndReplaysIdempotently() {
        Wallet source = Wallet.builder().id("cash-1").userId("user-1").cardType("cash").balance(300.0).build();
        when(walletRepository.findById("credit-1")).thenReturn(Optional.of(card));
        when(walletRepository.findById("cash-1")).thenReturn(Optional.of(source));
        when(repaymentRepository.findByUserIdAndIdempotencyKey("user-1", "first"))
                .thenReturn(Optional.empty());
        when(repaymentRepository.findByUserIdAndIdempotencyKey("user-1", "second"))
                .thenReturn(Optional.empty());
        when(repaymentRepository.save(any(CreditRepayment.class))).thenAnswer(invocation -> {
            CreditRepayment value = invocation.getArgument(0);
            value.setId("repay-" + value.getIdempotencyKey());
            return value;
        });
        when(walletRepository.save(any(Wallet.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CreditRepaymentRequest partial = request("50.00", "first");
        var first = service.repay("user-1", "credit-1", partial);
        assertFalse(first.isReplayed());
        assertEquals(0, first.getOutstandingBalance().compareTo(new BigDecimal("150.00")));
        assertEquals(250.0, source.getBalance());

        when(repaymentRepository.findByUserIdAndIdempotencyKey("user-1", "first"))
                .thenReturn(Optional.of(CreditRepayment.builder().id(first.getId()).userId("user-1")
                        .walletId("credit-1").sourceWalletId("cash-1").amount(new BigDecimal("50.00"))
                        .date(first.getDate()).transactionKind("repayment").idempotencyKey("first").build()));
        var replay = service.repay("user-1", "credit-1", partial);
        assertTrue(replay.isReplayed());
        assertEquals(250.0, source.getBalance());
        verify(repaymentRepository, times(1)).save(any(CreditRepayment.class));

        var full = service.repay("user-1", "credit-1", request("150.00", "second"));
        assertEquals(0, full.getOutstandingBalance().compareTo(BigDecimal.ZERO));
        assertEquals(100.0, source.getBalance());
    }

    @Test
    void refusesRepaymentFromAnotherUsersWallet() {
        Wallet source = Wallet.builder().id("cash-1").userId("other-user").balance(100.0).build();
        when(walletRepository.findById("credit-1")).thenReturn(Optional.of(card));
        when(walletRepository.findById("cash-1")).thenReturn(Optional.of(source));
        when(repaymentRepository.findByUserIdAndIdempotencyKey("user-1", "owned"))
                .thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> service.repay("user-1", "credit-1", request("10.00", "owned")));
        verify(repaymentRepository, never()).save(any());
    }

    @Test
    void recordsPartialRefundAgainstOriginalPurchaseAndAllowsCardCreditBalance() {
        card.setOutstandingBalance(new BigDecimal("50.00"));
        Transaction purchase = Transaction.builder()
                .id("purchase-1")
                .userId("user-1")
                .walletId("credit-1")
                .type("expense")
                .amount(100.0)
                .category("Travel")
                .description("Train")
                .date(LocalDateTime.of(2024, 3, 1, 10, 0))
                .transactionKind("purchase")
                .build();
        when(transactionRepository.findById("purchase-1")).thenReturn(Optional.of(purchase));
        when(transactionRepository.findByUserIdAndIdempotencyKey("user-1", "refund-key"))
                .thenReturn(Optional.empty());
        when(transactionRepository.findByUserIdAndRelatedTransactionIdAndTransactionKind(
                "user-1", "purchase-1", "refund")).thenReturn(java.util.List.of());
        when(walletRepository.findById("credit-1")).thenReturn(Optional.of(card));
        when(walletRepository.save(any(Wallet.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CreditRefundRequest request = new CreditRefundRequest();
        request.setAmount(new BigDecimal("80.00"));
        request.setIdempotencyKey("refund-key");
        request.setDate(LocalDateTime.of(2024, 3, 5, 12, 0));

        Transaction refund = service.recordRefund("user-1", "purchase-1", request);

        assertEquals("refund", refund.getTransactionKind());
        assertEquals("purchase-1", refund.getRelatedTransactionId());
        assertEquals("expense", refund.getType());
        assertEquals(-80.0, refund.getAmount(), 0.001);
        assertEquals(0, card.getOutstandingBalance().compareTo(new BigDecimal("-30.00")));

        when(transactionRepository.findByUserIdAndIdempotencyKey("user-1", "refund-key"))
                .thenReturn(Optional.of(refund));
        assertSame(refund, service.recordRefund("user-1", "purchase-1", request));
        verify(transactionRepository, times(1)).save(any(Transaction.class));
        verify(walletRepository, times(1)).save(any(Wallet.class));
    }

    @Test
    void generatesImmutableStatementSnapshotAtClampedClose() {
        when(walletRepository.findById("credit-1")).thenReturn(Optional.of(card));
        java.util.concurrent.atomic.AtomicReference<CreditStatement> stored =
                new java.util.concurrent.atomic.AtomicReference<>();
        when(statementRepository.findByWalletIdAndPeriodEnd("credit-1", LocalDate.of(2024, 2, 29)))
                .thenAnswer(invocation -> Optional.ofNullable(stored.get()));
        when(transactionRepository.findByUserIdAndWalletIdAndTransactionKindAndDateLessThanEqual(
                eq("user-1"), eq("credit-1"), eq("purchase"), any()))
                .thenReturn(java.util.List.of(Transaction.builder().type("expense").amount(100.0)
                        .date(LocalDateTime.of(2024, 2, 15, 12, 0)).build()));
        when(repaymentRepository.findByUserIdAndWalletIdAndDateBetween(eq("user-1"), eq("credit-1"), any(), any()))
                .thenReturn(java.util.List.of(CreditRepayment.builder().amount(new BigDecimal("20.00"))
                        .date(LocalDateTime.of(2024, 2, 20, 12, 0)).build()));
        when(statementRepository.save(any(CreditStatement.class))).thenAnswer(invocation -> {
            CreditStatement value = invocation.getArgument(0);
            value.setId("statement-1");
            stored.set(value);
            return value;
        });

        CreditStatement result = service.generateStatement("user-1", "credit-1", LocalDate.of(2024, 2, 29));

        assertEquals(LocalDate.of(2024, 2, 29), result.getPeriodEnd());
        assertEquals(LocalDate.of(2024, 2, 1), result.getPeriodStart());
        assertEquals(LocalDate.of(2024, 3, 21), result.getDueDate());
        assertEquals(0, result.getStatementBalance().compareTo(new BigDecimal("280.00")));
        CreditStatement repeated = service.generateStatement("user-1", "credit-1", LocalDate.of(2024, 2, 29));
        assertSame(result, repeated);
        ArgumentCaptor<CreditStatement> saved = ArgumentCaptor.forClass(CreditStatement.class);
        verify(statementRepository).save(saved.capture());
        assertNull(saved.getValue().getMinimumPaymentAmount());
    }

    @Test
    void testCreditCard50kLimitPurchase8kAndRepaymentScenarios() {
        Wallet fiftyKCard = Wallet.builder()
                .id("card-50k")
                .userId("user-1")
                .cardType("credit")
                .creditTermsConfigured(true)
                .creditLimit(new BigDecimal("50000.00"))
                .outstandingBalance(new BigDecimal("0.00"))
                .creditOpeningBalance(new BigDecimal("0.00"))
                .creditTermsConfiguredAt(LocalDateTime.of(2024, 1, 1, 0, 0))
                .statementClosingDay(30)
                .paymentDueDay(20)
                .timezone("Asia/Kolkata")
                .build();

        Wallet upiWallet = Wallet.builder()
                .id("upi-1")
                .userId("user-1")
                .cardType("upi")
                .balance(20000.0)
                .build();

        when(walletRepository.findById("card-50k")).thenReturn(Optional.of(fiftyKCard));
        when(walletRepository.findById("upi-1")).thenReturn(Optional.of(upiWallet));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(i -> i.getArgument(0));
        when(walletRepository.save(any(Wallet.class))).thenAnswer(i -> i.getArgument(0));
        when(repaymentRepository.save(any(CreditRepayment.class))).thenAnswer(i -> i.getArgument(0));

        // 1. Purchase of 8,000
        Transaction purchase = Transaction.builder()
                .walletId("card-50k")
                .type("expense")
                .amount(8000.0)
                .category("Electronics")
                .description("Smart Watch")
                .build();

        Transaction savedTx = service.recordPurchase("user-1", purchase);
        assertEquals("purchase", savedTx.getTransactionKind());
        assertEquals(0, fiftyKCard.getOutstandingBalance().compareTo(new BigDecimal("8000.00")));
        BigDecimal availableCredit = fiftyKCard.getCreditLimit().subtract(fiftyKCard.getOutstandingBalance());
        assertEquals(0, availableCredit.compareTo(new BigDecimal("42000.00")));

        // 2. Repay 8,000 from UPI
        CreditRepaymentRequest fullRepay = new CreditRepaymentRequest();
        fullRepay.setAmount(new BigDecimal("8000.00"));
        fullRepay.setSourceWalletId("upi-1");
        fullRepay.setIdempotencyKey("repay-8000-key");

        var repayResp = service.repay("user-1", "card-50k", fullRepay);
        assertEquals(0, fiftyKCard.getOutstandingBalance().compareTo(BigDecimal.ZERO));
        BigDecimal availableAfterRepay = fiftyKCard.getCreditLimit().subtract(fiftyKCard.getOutstandingBalance());
        assertEquals(0, availableAfterRepay.compareTo(new BigDecimal("50000.00")));
        assertEquals(12000.0, upiWallet.getBalance());

        // 3. Purchase 8,000 again, then partial repay 3,000
        service.recordPurchase("user-1", Transaction.builder().walletId("card-50k").type("expense").amount(8000.0).build());
        assertEquals(0, fiftyKCard.getOutstandingBalance().compareTo(new BigDecimal("8000.00")));

        CreditRepaymentRequest partialRepay = new CreditRepaymentRequest();
        partialRepay.setAmount(new BigDecimal("3000.00"));
        partialRepay.setSourceWalletId("upi-1");
        partialRepay.setIdempotencyKey("repay-3000-key");

        service.repay("user-1", "card-50k", partialRepay);
        assertEquals(0, fiftyKCard.getOutstandingBalance().compareTo(new BigDecimal("5000.00")));
        BigDecimal availablePartial = fiftyKCard.getCreditLimit().subtract(fiftyKCard.getOutstandingBalance());
        assertEquals(0, availablePartial.compareTo(new BigDecimal("45000.00")));
        assertEquals(9000.0, upiWallet.getBalance());
    }

    @Test
    void reverseRepaymentRestoresLiabilityAndCreditsFundingWallet() {
        Wallet source = Wallet.builder().id("cash-1").userId("user-1").cardType("cash").balance(250.0).build();
        when(walletRepository.findById("credit-1")).thenReturn(Optional.of(card));
        when(walletRepository.findById("cash-1")).thenReturn(Optional.of(source));

        CreditRepayment repayment = CreditRepayment.builder()
                .id("rep-123")
                .userId("user-1")
                .walletId("credit-1")
                .sourceWalletId("cash-1")
                .amount(new BigDecimal("50.00"))
                .build();

        when(repaymentRepository.findByIdAndUserId("rep-123", "user-1")).thenReturn(Optional.of(repayment));

        service.reverseRepayment("user-1", "credit-1", "rep-123");

        assertEquals(0, card.getOutstandingBalance().compareTo(new BigDecimal("250.00")));
        assertEquals(300.0, source.getBalance());
        verify(repaymentRepository).delete(repayment);
    }

    private CreditRepaymentRequest request(String amount, String key) {
        CreditRepaymentRequest request = new CreditRepaymentRequest();
        request.setAmount(new BigDecimal(amount));
        request.setSourceWalletId("cash-1");
        request.setIdempotencyKey(key);
        return request;
    }
}
