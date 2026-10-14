package com.expensetracker.service;

import com.expensetracker.dto.CreditRepaymentRequest;
import com.expensetracker.dto.CreditRepaymentResponse;
import com.expensetracker.dto.CreditRefundRequest;
import com.expensetracker.dto.CreditActivityItem;
import com.expensetracker.model.CreditRepayment;
import com.expensetracker.model.CreditStatement;
import com.expensetracker.model.Transaction;
import com.expensetracker.model.Wallet;
import com.expensetracker.repository.CreditRepaymentRepository;
import com.expensetracker.repository.CreditStatementRepository;
import com.expensetracker.repository.TransactionRepository;
import com.expensetracker.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class CreditCardService {
    private static final BigDecimal ZERO = BigDecimal.ZERO;

    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;
    private final CreditRepaymentRepository repaymentRepository;
    private final CreditStatementRepository statementRepository;

    @Transactional
    public Transaction recordPurchase(String userId, Transaction transaction) {
        if (!"expense".equalsIgnoreCase(transaction.getType())) {
            throw new IllegalArgumentException("Credit card purchases must be expenses");
        }
        BigDecimal amount = positiveMoney(transaction.getAmount(), "Purchase amount");
        Wallet card = ownedWallet(transaction.getWalletId(), userId);
        requireConfiguredCreditCard(card);

        LocalDateTime purchaseDate = transaction.getDate() == null
                ? LocalDateTime.now(zone(card)) : transaction.getDate();
        if (card.getCreditTermsConfiguredAt() != null
                && purchaseDate.isBefore(card.getCreditTermsConfiguredAt())) {
            throw new IllegalArgumentException("Purchase date cannot precede credit terms configuration");
        }
        BigDecimal nextBalance = money(card.getOutstandingBalance()).add(amount);
        if (nextBalance.compareTo(card.getCreditLimit()) > 0) {
            throw new IllegalArgumentException("Purchase exceeds available credit");
        }

        transaction.setType("expense");
        transaction.setTransactionKind("purchase");
        transaction.setIdempotencyKey(null);
        transaction.setUserId(userId);
        transaction.setDate(purchaseDate);
        transaction.setCreatedAt(LocalDateTime.now(zone(card)));
        card.setOutstandingBalance(nextBalance);
        transactionRepository.save(transaction);
        walletRepository.save(card);
        return transaction;
    }

    @Transactional
    public Transaction updatePurchase(String id, String userId, Transaction details) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Transaction not found"));
        if (!userId.equals(transaction.getUserId())) {
            throw new IllegalArgumentException("Unauthorized transaction access");
        }
        if (!"expense".equalsIgnoreCase(details.getType())
                || !Objects.equals(transaction.getWalletId(), details.getWalletId())) {
            throw new IllegalArgumentException("Credit purchases can only be edited on the same card");
        }
        if (!transactionRepository.findByUserIdAndRelatedTransactionIdAndTransactionKind(userId, id, "refund").isEmpty()) {
            throw new IllegalArgumentException("A purchase with recorded refunds cannot be edited");
        }
        BigDecimal nextAmount = positiveMoney(details.getAmount(), "Purchase amount");
        Wallet card = ownedWallet(transaction.getWalletId(), userId);
        requireConfiguredCreditCard(card);
        BigDecimal oldAmount = positiveMoney(transaction.getAmount(), "Purchase amount");
        BigDecimal nextBalance = money(card.getOutstandingBalance()).subtract(oldAmount).add(nextAmount);
        if (nextBalance.signum() < 0 || nextBalance.compareTo(card.getCreditLimit()) > 0) {
            throw new IllegalArgumentException("Updated purchase exceeds available credit");
        }
        transaction.setType("expense");
        transaction.setAmount(nextAmount.doubleValue());
        transaction.setCategory(details.getCategory());
        transaction.setDescription(details.getDescription());
        transaction.setDate(details.getDate() == null ? transaction.getDate() : details.getDate());
        transaction.setIsRecurring(details.getIsRecurring());
        transaction.setTransactionKind("purchase");
        card.setOutstandingBalance(nextBalance);
        walletRepository.save(card);
        return transactionRepository.save(transaction);
    }

    @Transactional
    public Transaction recordRefund(String userId, String purchaseId, CreditRefundRequest request) {
        if (request == null) throw new IllegalArgumentException("Refund request is required");
        BigDecimal amount = positiveMoney(request.getAmount(), "Refund amount");
        if (request.getIdempotencyKey() == null || request.getIdempotencyKey().isBlank()
                || request.getIdempotencyKey().trim().length() > 128) {
            throw new IllegalArgumentException("Idempotency key is required and must be at most 128 characters");
        }
        String idempotencyKey = request.getIdempotencyKey().trim();
        var previous = transactionRepository.findByUserIdAndIdempotencyKey(userId, idempotencyKey);
        if (previous.isPresent()) {
            Transaction saved = previous.get();
            if (!"refund".equals(saved.getTransactionKind())
                    || !Objects.equals(saved.getRelatedTransactionId(), purchaseId)
                    || BigDecimal.valueOf(Math.abs(saved.getAmount())).compareTo(amount) != 0
                    || (request.getDate() != null && !request.getDate().equals(saved.getDate()))) {
                throw new IllegalArgumentException("Idempotency key was already used for a different refund");
            }
            ownedWallet(saved.getWalletId(), userId);
            return saved;
        }

        Transaction purchase = transactionRepository.findById(purchaseId)
                .orElseThrow(() -> new IllegalArgumentException("Credit card purchase not found"));
        if (!userId.equals(purchase.getUserId())
                || !"purchase".equals(purchase.getTransactionKind())
                || !"expense".equalsIgnoreCase(purchase.getType())) {
            throw new IllegalArgumentException("Refunds must reference one of your credit card purchases");
        }
        if (purchase.getDate() == null) {
            throw new IllegalStateException("The original purchase has no transaction date");
        }
        Wallet card = ownedWallet(purchase.getWalletId(), userId);
        requireConfiguredCreditCard(card);

        BigDecimal alreadyRefunded = transactionRepository
                .findByUserIdAndRelatedTransactionIdAndTransactionKind(userId, purchaseId, "refund")
                .stream()
                .map(refund -> BigDecimal.valueOf(Math.abs(refund.getAmount())))
                .reduce(ZERO, BigDecimal::add);
        BigDecimal purchaseAmount = positiveMoney(purchase.getAmount(), "Purchase amount");
        if (alreadyRefunded.add(amount).compareTo(purchaseAmount) > 0) {
            throw new IllegalArgumentException("Refund amount exceeds the unrefunded purchase amount");
        }

        LocalDateTime refundDate = request.getDate() == null
                ? LocalDateTime.now(zone(card)) : request.getDate();
        if (refundDate.isBefore(purchase.getDate())) {
            throw new IllegalArgumentException("Refund date cannot precede the original purchase");
        }
        card.setOutstandingBalance(money(card.getOutstandingBalance()).subtract(amount));
        Transaction refund = Transaction.builder()
                .userId(userId)
                .type("expense")
                .category(purchase.getCategory())
                .amount(amount.negate().doubleValue())
                .description("Refund for " + Objects.requireNonNullElse(purchase.getDescription(), "credit card purchase"))
                .date(refundDate)
                .isRecurring(false)
                .walletId(card.getId())
                .transactionKind("refund")
                .idempotencyKey(idempotencyKey)
                .relatedTransactionId(purchaseId)
                .createdAt(LocalDateTime.now(zone(card)))
                .build();
        walletRepository.save(card);
        return transactionRepository.save(refund);
    }

    @Transactional
    public void deletePurchase(String id, String userId) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Transaction not found"));
        if (!userId.equals(transaction.getUserId())) {
            throw new IllegalArgumentException("Unauthorized transaction access");
        }
        if (!transactionRepository
                .findByUserIdAndRelatedTransactionIdAndTransactionKind(userId, id, "refund").isEmpty()) {
            throw new IllegalArgumentException("A purchase with recorded refunds cannot be deleted");
        }
        Wallet card = ownedWallet(transaction.getWalletId(), userId);
        BigDecimal amount = positiveMoney(transaction.getAmount(), "Purchase amount");
        BigDecimal nextBalance = money(card.getOutstandingBalance()).subtract(amount);
        if (nextBalance.signum() < 0) {
            throw new IllegalArgumentException("A purchase already repaid cannot be deleted from current liability");
        }
        card.setOutstandingBalance(nextBalance);
        walletRepository.save(card);
        transactionRepository.delete(transaction);
    }

    @Transactional
    public CreditRepaymentResponse repay(String userId, String cardId, CreditRepaymentRequest request) {
        validateRepaymentRequest(request);
        BigDecimal amount = request.getAmount().setScale(2, RoundingMode.UNNECESSARY);
        String idempotencyKey = request.getIdempotencyKey().trim();

        var previous = repaymentRepository.findByUserIdAndIdempotencyKey(userId, idempotencyKey);
        if (previous.isPresent()) {
            CreditRepayment saved = previous.get();
            if (!Objects.equals(saved.getWalletId(), cardId)
                    || !Objects.equals(saved.getSourceWalletId(), request.getSourceWalletId())
                    || !Objects.equals(saved.getStatementId(), blankToNull(request.getStatementId()))
                    || saved.getAmount().compareTo(amount) != 0
                    || (request.getDate() != null && !request.getDate().equals(saved.getDate()))) {
                throw new IllegalArgumentException("Idempotency key was already used for a different repayment");
            }
            Wallet card = ownedWallet(cardId, userId);
            Wallet source = ownedWallet(request.getSourceWalletId(), userId);
            return repaymentResponse(saved, card, source, true);
        }

        Wallet card = ownedWallet(cardId, userId);
        requireConfiguredCreditCard(card);
        Wallet source = ownedWallet(request.getSourceWalletId(), userId);
        if ("credit".equalsIgnoreCase(source.getCardType())) {
            throw new IllegalArgumentException("A credit card cannot be used as a repayment source");
        }
        if (request.getStatementId() != null && !request.getStatementId().isBlank()) {
            statementRepository.findByIdAndUserIdAndWalletId(request.getStatementId(), userId, cardId)
                    .orElseThrow(() -> new IllegalArgumentException("Statement not found for this card"));
        }

        BigDecimal currentLiability = money(card.getOutstandingBalance());
        if (amount.compareTo(currentLiability) > 0) {
            throw new IllegalArgumentException("Repayment cannot exceed outstanding balance");
        }
        BigDecimal sourceBalance = source.getBalance() == null
                ? ZERO : BigDecimal.valueOf(source.getBalance());
        if (amount.compareTo(sourceBalance) > 0) {
            throw new IllegalArgumentException("Insufficient source wallet balance");
        }

        LocalDateTime repaymentDate = request.getDate() == null
                ? LocalDateTime.now(zone(card)) : request.getDate();
        if (card.getCreditTermsConfiguredAt() != null
                && repaymentDate.isBefore(card.getCreditTermsConfiguredAt())) {
            throw new IllegalArgumentException("Repayment date cannot precede credit terms configuration");
        }
        card.setOutstandingBalance(currentLiability.subtract(amount));
        source.setBalance(sourceBalance.subtract(amount).doubleValue());
        CreditRepayment repayment = CreditRepayment.builder()
                .userId(userId)
                .walletId(cardId)
                .sourceWalletId(source.getId())
                .statementId(blankToNull(request.getStatementId()))
                .amount(amount)
                .date(repaymentDate)
                .createdAt(LocalDateTime.now(zone(card)))
                .timezone(card.getTimezone())
                .idempotencyKey(idempotencyKey)
                .transactionKind("repayment")
                .build();

        walletRepository.save(card);
        walletRepository.save(source);
        CreditRepayment saved = repaymentRepository.save(repayment);
        return repaymentResponse(saved, card, source, false);
    }

    @Transactional
    public void reverseRepayment(String userId, String cardId, String repaymentId) {
        CreditRepayment repayment = repaymentRepository.findByIdAndUserId(repaymentId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Repayment not found"));
        if (!Objects.equals(repayment.getWalletId(), cardId)) {
            throw new IllegalArgumentException("Repayment does not belong to this credit card");
        }
        Wallet card = ownedWallet(cardId, userId);
        requireConfiguredCreditCard(card);
        Wallet source = ownedWallet(repayment.getSourceWalletId(), userId);

        BigDecimal amount = repayment.getAmount();
        BigDecimal nextOutstanding = money(card.getOutstandingBalance()).add(amount);
        if (nextOutstanding.compareTo(card.getCreditLimit()) > 0) {
            throw new IllegalArgumentException("Reversing this repayment would cause card balance to exceed credit limit");
        }
        card.setOutstandingBalance(nextOutstanding);
        double currentSourceBalance = source.getBalance() == null ? 0.0 : source.getBalance();
        source.setBalance(currentSourceBalance + amount.doubleValue());

        walletRepository.save(card);
        walletRepository.save(source);
        repaymentRepository.delete(repayment);
    }

    @Transactional(readOnly = true)
    public List<CreditRepayment> getRepayments(String userId, LocalDateTime start, LocalDateTime end) {
        if (start != null && end != null) {
            return repaymentRepository.findByUserIdAndDateBetween(userId, start, end);
        }
        return repaymentRepository.findByUserId(userId);
    }

    @Transactional(readOnly = true)
    public List<CreditStatement> getStatements(String userId, String cardId) {
        Wallet card = ownedWallet(cardId, userId);
        requireConfiguredCreditCard(card);
        return statementRepository.findByUserIdAndWalletIdOrderByPeriodEndDesc(userId, cardId);
    }

    @Transactional(readOnly = true)
    public List<CreditActivityItem> getActivity(String userId, String cardId) {
        Wallet card = ownedWallet(cardId, userId);
        LocalDateTime cutoff = LocalDateTime.MAX;
        List<CreditActivityItem> items = new ArrayList<>();
        transactionRepository.findByUserIdAndWalletIdAndTransactionKindAndDateLessThanEqual(
                        userId, cardId, "purchase", cutoff)
                .forEach(tx -> items.add(CreditActivityItem.builder()
                        .id(tx.getId())
                        .transactionKind("purchase")
                        .type(tx.getType())
                        .amount(BigDecimal.valueOf(tx.getAmount()))
                        .category(tx.getCategory())
                        .description(tx.getDescription())
                        .date(tx.getDate())
                        .walletId(cardId)
                        .build()));
        repaymentRepository.findByUserIdAndWalletIdAndDateLessThanEqual(userId, cardId, cutoff)
                .forEach(repayment -> items.add(CreditActivityItem.builder()
                        .id(repayment.getId())
                        .transactionKind("repayment")
                        .amount(repayment.getAmount())
                        .description("Internal repayment")
                        .date(repayment.getDate())
                        .walletId(cardId)
                        .sourceWalletId(repayment.getSourceWalletId())
                        .statementId(repayment.getStatementId())
                        .idempotencyKey(repayment.getIdempotencyKey())
                        .build()));
        transactionRepository.findByUserIdAndWalletIdAndTransactionKindAndDateLessThanEqual(
                        userId, cardId, "refund", cutoff)
                .forEach(refund -> items.add(CreditActivityItem.builder()
                        .id(refund.getId())
                        .transactionKind("refund")
                        .type(refund.getType())
                        .amount(BigDecimal.valueOf(Math.abs(refund.getAmount())))
                        .category(refund.getCategory())
                        .description(refund.getDescription())
                        .date(refund.getDate())
                        .walletId(cardId)
                        .relatedTransactionId(refund.getRelatedTransactionId())
                        .build()));
        return items.stream().sorted(Comparator.comparing(CreditActivityItem::getDate).reversed()).toList();
    }

    @Transactional
    public CreditStatement generateStatement(String userId, String cardId, LocalDate asOfDate) {
        Wallet card = ownedWallet(cardId, userId);
        requireConfiguredCreditCard(card);
        ZoneId zone = zone(card);
        LocalDate asOf = asOfDate == null ? LocalDate.now(zone) : asOfDate;
        if (asOf.isAfter(LocalDate.now(zone))) {
            throw new IllegalArgumentException("A statement can only be generated for a closed local cycle");
        }
        LocalDate periodEnd = CreditCardCycle.latestClosingDate(asOf, card.getStatementClosingDay());

        var existing = statementRepository.findByWalletIdAndPeriodEnd(cardId, periodEnd);
        if (existing.isPresent()) return existing.get();
        if (card.getCreditTermsConfiguredAt() == null || card.getCreditOpeningBalance() == null) {
            throw new IllegalArgumentException("Credit balance history is not initialized for statements");
        }
        if (periodEnd.isBefore(card.getCreditTermsConfiguredAt().toLocalDate())) {
            throw new IllegalArgumentException("No statement cycle has closed since credit terms were configured");
        }

        LocalDateTime cutoff = periodEnd.atTime(LocalTime.MAX);
        BigDecimal purchases = transactionRepository
                .findByUserIdAndWalletIdAndTransactionKindAndDateLessThanEqual(
                        userId, cardId, "purchase", cutoff)
                .stream()
                .filter(tx -> !tx.getDate().isBefore(card.getCreditTermsConfiguredAt()))
                .map(tx -> BigDecimal.valueOf(tx.getAmount()))
                .reduce(ZERO, BigDecimal::add);
        BigDecimal refunds = transactionRepository
                .findByUserIdAndWalletIdAndTransactionKindAndDateLessThanEqual(
                        userId, cardId, "refund", cutoff)
                .stream()
                .filter(refund -> !refund.getDate().isBefore(card.getCreditTermsConfiguredAt()))
                .map(tx -> BigDecimal.valueOf(Math.abs(tx.getAmount())))
                .reduce(ZERO, BigDecimal::add);
        BigDecimal repayments = repaymentRepository.findByUserIdAndWalletIdAndDateBetween(
                        userId, cardId, card.getCreditTermsConfiguredAt(), cutoff)
                .stream()
                .map(CreditRepayment::getAmount)
                .reduce(ZERO, BigDecimal::add);
        BigDecimal snapshotBalance = card.getCreditOpeningBalance()
                .add(purchases)
                .subtract(refunds)
                .subtract(repayments);

        CreditStatement statement = CreditStatement.builder()
                .userId(userId)
                .walletId(cardId)
                .periodStart(CreditCardCycle.periodStart(periodEnd, card.getStatementClosingDay()))
                .periodEnd(periodEnd)
                .generatedAt(LocalDateTime.now(zone))
                .timezone(card.getTimezone())
                .statementClosingDay(card.getStatementClosingDay())
                .dueDate(CreditCardCycle.dueDate(periodEnd, card.getPaymentDueDay()))
                .statementBalance(snapshotBalance)
                .minimumPaymentAmount(card.getMinimumPaymentAmount())
                .build();
        return statementRepository.save(statement);
    }

    public static void requireConfiguredCreditCard(Wallet card) {
        if (!"credit".equalsIgnoreCase(card.getCardType())
                || !Boolean.TRUE.equals(card.getCreditTermsConfigured())
                || card.getCreditLimit() == null
                || card.getOutstandingBalance() == null
                || card.getStatementClosingDay() == null
                || card.getPaymentDueDay() == null
                || card.getTimezone() == null
                || card.getCreditLimit().signum() <= 0
                || card.getOutstandingBalance().compareTo(card.getCreditLimit()) > 0) {
            throw new IllegalArgumentException("Credit card terms are not configured");
        }
        try {
            ZoneId.of(card.getTimezone());
        } catch (Exception ex) {
            throw new IllegalArgumentException("Credit card timezone is invalid");
        }
    }

    private Wallet ownedWallet(String id, String userId) {
        if (id == null || id.isBlank()) throw new IllegalArgumentException("Wallet ID is required");
        Wallet wallet = walletRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Wallet not found"));
        if (!userId.equals(wallet.getUserId())) {
            throw new IllegalArgumentException("Unauthorized wallet access");
        }
        return wallet;
    }

    private CreditRepaymentResponse repaymentResponse(
            CreditRepayment repayment, Wallet card, Wallet source, boolean replayed) {
        return CreditRepaymentResponse.builder()
                .id(repayment.getId())
                .walletId(repayment.getWalletId())
                .sourceWalletId(repayment.getSourceWalletId())
                .statementId(repayment.getStatementId())
                .amount(repayment.getAmount())
                .date(repayment.getDate())
                .transactionKind(repayment.getTransactionKind())
                .idempotencyKey(repayment.getIdempotencyKey())
                .outstandingBalance(card.getOutstandingBalance())
                .sourceWalletBalance(source.getBalance() == null ? ZERO : BigDecimal.valueOf(source.getBalance()))
                .replayed(replayed)
                .build();
    }

    private void validateRepaymentRequest(CreditRepaymentRequest request) {
        if (request == null) throw new IllegalArgumentException("Repayment request is required");
        positiveMoney(request.getAmount(), "Repayment amount");
        if (request.getSourceWalletId() == null || request.getSourceWalletId().isBlank()) {
            throw new IllegalArgumentException("Source wallet ID is required");
        }
        if (request.getIdempotencyKey() == null || request.getIdempotencyKey().isBlank()
                || request.getIdempotencyKey().trim().length() > 128) {
            throw new IllegalArgumentException("Idempotency key is required and must be at most 128 characters");
        }
    }

    private BigDecimal positiveMoney(BigDecimal amount, String label) {
        if (amount == null || amount.signum() <= 0) {
            throw new IllegalArgumentException(label + " must be greater than zero");
        }
        try {
            return amount.setScale(2, RoundingMode.UNNECESSARY);
        } catch (ArithmeticException ex) {
            throw new IllegalArgumentException(label + " must use at most two decimal places");
        }
    }

    private BigDecimal positiveMoney(Double amount, String label) {
        if (amount == null || !Double.isFinite(amount) || amount <= 0) {
            throw new IllegalArgumentException(label + " must be greater than zero");
        }
        return positiveMoney(BigDecimal.valueOf(amount), label);
    }

    private BigDecimal money(BigDecimal amount) {
        return amount == null ? ZERO : amount;
    }

    private ZoneId zone(Wallet wallet) {
        return ZoneId.of(wallet.getTimezone());
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
