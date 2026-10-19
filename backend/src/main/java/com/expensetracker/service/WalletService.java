package com.expensetracker.service;

import java.util.List;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.NoSuchElementException;

import org.springframework.stereotype.Service;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.transaction.annotation.Transactional;
import com.expensetracker.repository.TransactionRepository;
import com.expensetracker.repository.CreditRepaymentRepository;
import com.expensetracker.repository.CreditStatementRepository;

import com.expensetracker.model.Wallet;
import com.expensetracker.repository.WalletRepository;
import com.expensetracker.dto.WalletCustomizationRequest;

import lombok.RequiredArgsConstructor;

import java.util.Set;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class WalletService {

    private static final Set<String> CUSTOMIZATION_FIELDS = Set.of(
            "designPreset", "primaryColor", "secondaryColor", "textColor", "accentColor", "artwork", "cardStyle");
    private static final Set<String> KNOWN_PRESETS = Set.of(
            "midnight", "sunset", "aurora", "berry", "silver", "custom",
            "upi-pulse", "upi-mint", "upi-saffron", "upi-ocean", "upi-night", "upi-custom",
            "cash-pop", "cash-neon", "cash-gold",
            "dc-superman", "dc-wonderwoman", "dc-batman",
            "scenic-alpine", "scenic-ocean", "scenic-northern", "scenic-sahara", "scenic-tropical", "scenic-neon-city", "scenic-cherry", "scenic-volcano",
            "broco", "tonot", "bredo", "kocheng", "drino", "wuhu", "yo", "ocean", "forest", "cyber");
    private static final Pattern HEX_COLOR = Pattern.compile("^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$");
    private static final Pattern ARTWORK_ID = Pattern.compile("^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$");
    private static final Pattern CARD_STYLE = Pattern.compile("^[a-zA-Z][a-zA-Z0-9_-]{0,31}$");

    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;
    private final CreditRepaymentRepository creditRepaymentRepository;
    private final CreditStatementRepository creditStatementRepository;

    public List<Wallet> getWallets(String userId) {
        return walletRepository.findByUserId(userId).stream()
                .map(this::sanitizeForResponse)
                .toList();
    }

    public Wallet addWallet(String userId, Wallet wallet) {
        wallet.setUserId(userId);
        copyCustomizationIfPresent(wallet, wallet);
        configureCreditTerms(wallet, null, wallet);
        if (wallet.getBalance() == null
                && !Boolean.TRUE.equals(wallet.getCreditTermsConfigured())
                && !"credit".equalsIgnoreCase(wallet.getCardType())) {
            wallet.setBalance(0.0);
        }
        return sanitizeForResponse(walletRepository.save(sanitizeForStorage(wallet)));
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
        if ("credit".equalsIgnoreCase(wallet.getCardType())) {
            throw new IllegalArgumentException("Credit card balances can only change through purchases and repayments");
        }

        Double walletBalance = wallet.getBalance();
        double currentBalance = walletBalance == null ? 0.0 : walletBalance;
        wallet.setBalance(currentBalance + amount);
        return sanitizeForResponse(walletRepository.save(sanitizeForStorage(wallet)));
    }

    public Wallet updateWallet(String id, String userId, Wallet walletDetails) {
        Wallet wallet = walletRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));

        if (!wallet.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }
        if (Boolean.TRUE.equals(wallet.getCreditTermsConfigured())
                && !"credit".equalsIgnoreCase(walletDetails.getCardType())) {
            throw new IllegalArgumentException("Configured credit cards cannot change account type");
        }

        configureCreditTerms(wallet, wallet, walletDetails);
        wallet.setCardType(walletDetails.getCardType());
        wallet.setBankName(walletDetails.getBankName());
        wallet.setCardName(walletDetails.getCardName());
        wallet.setCardHolderName(walletDetails.getCardHolderName());
        wallet.setCardNumber(walletDetails.getCardNumber());
        wallet.setExpiryDate(walletDetails.getExpiryDate());
        wallet.setCvv(null);
        Double walletDetailsBalance = walletDetails.getBalance();
        if (!Boolean.TRUE.equals(wallet.getCreditTermsConfigured())) {
            if ("credit".equalsIgnoreCase(wallet.getCardType())
                    && "credit".equalsIgnoreCase(walletDetails.getCardType())) {
                wallet.setBalance(walletDetails.getBalance() == null ? wallet.getBalance() : walletDetailsBalance);
            } else {
                wallet.setBalance(walletDetailsBalance == null ? 0.0 : walletDetailsBalance);
            }
        }
        wallet.setIsDefault(walletDetails.getIsDefault());
        wallet.setCardBrand(walletDetails.getCardBrand());
        // PUT remains compatible with existing clients, but omitted customization
        // must not erase a persisted design. Explicit clearing is available via PATCH.
        copyCustomizationIfPresent(wallet, walletDetails);
        wallet.setCardIcon(walletDetails.getCardIcon());
        wallet.setBackSignatureText(walletDetails.getBackSignatureText());
        wallet.setBackContactInfo(walletDetails.getBackContactInfo());

        return sanitizeForResponse(walletRepository.save(sanitizeForStorage(wallet)));
    }

    public Wallet updateCustomization(String id, String userId, WalletCustomizationRequest request) {
        Wallet wallet = walletRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));
        if (!userId.equals(wallet.getUserId())) {
            throw new RuntimeException("Unauthorized");
        }
        if (request.fields() == null || request.fields().isEmpty()) {
            return sanitizeForResponse(wallet);
        }
        for (String field : request.fields().keySet()) {
            if (!CUSTOMIZATION_FIELDS.contains(field)) {
                throw new IllegalArgumentException("Unsupported customization field: " + field);
            }
        }
        if (request.contains("designPreset")) wallet.setDesignPreset(validatePreset(request.value("designPreset")));
        if (request.contains("primaryColor")) wallet.setPrimaryColor(validateColor(request.value("primaryColor"), "primaryColor"));
        if (request.contains("secondaryColor")) wallet.setSecondaryColor(validateColor(request.value("secondaryColor"), "secondaryColor"));
        if (request.contains("textColor")) wallet.setTextColor(validateColor(request.value("textColor"), "textColor"));
        if (request.contains("accentColor")) wallet.setAccentColor(validateColor(request.value("accentColor"), "accentColor"));
        if (request.contains("artwork")) wallet.setArtwork(validateArtwork(request.value("artwork")));
        if (request.contains("cardStyle")) wallet.setCardStyle(validateCardStyle(request.value("cardStyle")));
        return sanitizeForResponse(walletRepository.save(sanitizeForStorage(wallet)));
    }

    private void copyCustomizationIfPresent(Wallet target, Wallet requested) {
        if (requested.getDesignPreset() != null) target.setDesignPreset(validatePreset(requested.getDesignPreset()));
        if (requested.getPrimaryColor() != null) target.setPrimaryColor(validateColor(requested.getPrimaryColor(), "primaryColor"));
        if (requested.getSecondaryColor() != null) target.setSecondaryColor(validateColor(requested.getSecondaryColor(), "secondaryColor"));
        if (requested.getTextColor() != null) target.setTextColor(validateColor(requested.getTextColor(), "textColor"));
        if (requested.getAccentColor() != null) target.setAccentColor(validateColor(requested.getAccentColor(), "accentColor"));
        if (requested.getArtwork() != null) target.setArtwork(validateArtwork(requested.getArtwork()));
        if (requested.getCardStyle() != null) target.setCardStyle(validateCardStyle(requested.getCardStyle()));
    }

    private String validatePreset(Object value) {
        String preset = nullableString(value, "designPreset");
        if (preset != null && !KNOWN_PRESETS.contains(preset)) throw new IllegalArgumentException("Unknown card design preset");
        return preset;
    }

    private String validateColor(Object value, String field) {
        String color = nullableString(value, field);
        if (color != null && !HEX_COLOR.matcher(color).matches()) throw new IllegalArgumentException(field + " must be a hexadecimal color");
        return color;
    }

    private String validateArtwork(Object value) {
        String artwork = nullableString(value, "artwork");
        if (artwork != null && !(ARTWORK_ID.matcher(artwork).matches() || artwork.matches("^https://[^\\s]{1,2048}$"))) {
            throw new IllegalArgumentException("artwork must be an identifier or HTTPS URL");
        }
        return artwork;
    }

    private String validateCardStyle(Object value) {
        String style = nullableString(value, "cardStyle");
        if (style != null && !CARD_STYLE.matcher(style).matches()) throw new IllegalArgumentException("cardStyle is invalid");
        return style;
    }

    private String nullableString(Object value, String field) {
        if (value == null) return null;
        if (!(value instanceof String string)) throw new IllegalArgumentException(field + " must be a string");
        String trimmed = string.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    @Transactional
    public void deleteWallet(String id, String userId) {
        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("Wallet ID is required");
        }
        Wallet wallet = walletRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Wallet not found"));
                
        if (!userId.equals(wallet.getUserId())) {
            throw new AccessDeniedException("You are not authorized to delete this wallet");
        }
        // Delete all transactions explicitly associated with this card
        transactionRepository.deleteByUserIdAndWalletId(userId, id);
        // Clean up credit repayments associated with this card
        creditRepaymentRepository.deleteByUserIdAndWalletId(userId, id);
        // Clean up credit statements associated with this card
        creditStatementRepository.deleteByUserIdAndWalletId(userId, id);
        // Delete the wallet itself
        walletRepository.delete(wallet);
    }

    private void configureCreditTerms(Wallet wallet, Wallet existing, Wallet requested) {
        boolean credit = "credit".equalsIgnoreCase(requested.getCardType());
        boolean alreadyConfigured = existing != null && Boolean.TRUE.equals(existing.getCreditTermsConfigured());
        if (!credit) {
            if (Boolean.TRUE.equals(requested.getCreditTermsConfigured())) {
                throw new IllegalArgumentException("Credit terms can only be configured on credit cards");
            }
            if (alreadyConfigured) {
                throw new IllegalArgumentException("Configured credit cards cannot change account type");
            }
            clearCreditTerms(wallet);
            return;
        }

        if (!Boolean.TRUE.equals(requested.getCreditTermsConfigured())) {
            if (alreadyConfigured) {
                if (Boolean.FALSE.equals(requested.getCreditTermsConfigured())) {
                    throw new IllegalArgumentException("Credit terms cannot be disabled");
                }
                preserveCreditTerms(wallet, existing);
            } else {
                clearCreditTerms(wallet);
            }
            return;
        }

        BigDecimal limit = requested.getCreditLimit() != null
                ? requested.getCreditLimit() : alreadyConfigured ? existing.getCreditLimit() : null;
        BigDecimal outstanding = alreadyConfigured
                ? existing.getOutstandingBalance() : requested.getOutstandingBalance();
        Integer closingDay = requested.getStatementClosingDay() != null
                ? requested.getStatementClosingDay() : alreadyConfigured ? existing.getStatementClosingDay() : null;
        Integer dueDay = requested.getPaymentDueDay() != null
                ? requested.getPaymentDueDay() : alreadyConfigured ? existing.getPaymentDueDay() : null;
        String timezone = requested.getTimezone() != null && !requested.getTimezone().isBlank()
                ? requested.getTimezone() : alreadyConfigured ? existing.getTimezone() : null;
        BigDecimal minimumPayment = requested.getMinimumPaymentAmount() != null
                ? requested.getMinimumPaymentAmount() : alreadyConfigured ? existing.getMinimumPaymentAmount() : null;

        if (limit == null || limit.signum() <= 0 || outstanding == null || outstanding.signum() < 0
                || outstanding.compareTo(limit) > 0 || closingDay == null || closingDay < 1 || closingDay > 31
                || dueDay == null || dueDay < 1 || dueDay > 31 || timezone == null) {
            throw new IllegalArgumentException("Credit cards require a positive limit, opening balance, cycle days and timezone");
        }
        limit = toCents(limit, "Credit limit");
        outstanding = toCents(outstanding, "Outstanding balance");
        if (minimumPayment != null && minimumPayment.signum() <= 0) {
            throw new IllegalArgumentException("Issuer-supplied minimum payment must be greater than zero");
        }
        if (minimumPayment != null) {
            minimumPayment = toCents(minimumPayment, "Minimum payment");
        }
        try {
            ZoneId.of(timezone);
        } catch (Exception ex) {
            throw new IllegalArgumentException("Credit card timezone is invalid");
        }

        wallet.setCreditLimit(limit);
        wallet.setOutstandingBalance(outstanding);
        wallet.setStatementClosingDay(closingDay);
        wallet.setPaymentDueDay(dueDay);
        wallet.setMinimumPaymentAmount(minimumPayment);
        wallet.setCreditTermsConfigured(true);
        wallet.setTimezone(timezone);
        if (alreadyConfigured) {
            if (limit.compareTo(existing.getOutstandingBalance()) < 0) {
                throw new IllegalArgumentException("Credit limit cannot be below current outstanding balance");
            }
            wallet.setCreditOpeningBalance(existing.getCreditOpeningBalance());
            wallet.setCreditTermsConfiguredAt(existing.getCreditTermsConfiguredAt());
        } else {
            wallet.setCreditOpeningBalance(outstanding);
            wallet.setCreditTermsConfiguredAt(LocalDateTime.now(ZoneId.of(timezone)));
            wallet.setBalance(null);
        }
    }

    private void preserveCreditTerms(Wallet wallet, Wallet existing) {
        wallet.setCreditLimit(existing.getCreditLimit());
        wallet.setOutstandingBalance(existing.getOutstandingBalance());
        wallet.setStatementClosingDay(existing.getStatementClosingDay());
        wallet.setPaymentDueDay(existing.getPaymentDueDay());
        wallet.setMinimumPaymentAmount(existing.getMinimumPaymentAmount());
        wallet.setCreditTermsConfigured(true);
        wallet.setTimezone(existing.getTimezone());
        wallet.setCreditOpeningBalance(existing.getCreditOpeningBalance());
        wallet.setCreditTermsConfiguredAt(existing.getCreditTermsConfiguredAt());
    }

    private void clearCreditTerms(Wallet wallet) {
        wallet.setCreditLimit(null);
        wallet.setOutstandingBalance(null);
        wallet.setStatementClosingDay(null);
        wallet.setPaymentDueDay(null);
        wallet.setMinimumPaymentAmount(null);
        wallet.setCreditTermsConfigured(false);
        wallet.setTimezone(null);
        wallet.setCreditOpeningBalance(null);
        wallet.setCreditTermsConfiguredAt(null);
    }

    private Wallet sanitizeForStorage(Wallet wallet) {
        wallet.setCvv(null);
        wallet.setCardNumber(safeCardNumber(wallet));
        if (wallet.getBalance() == null
                && !Boolean.TRUE.equals(wallet.getCreditTermsConfigured())
                && !"credit".equalsIgnoreCase(wallet.getCardType())) {
            wallet.setBalance(0.0);
        }
        return wallet;
    }

    private Wallet sanitizeForResponse(Wallet wallet) {
        wallet.setCvv(null);
        wallet.setCardNumber(safeCardNumber(wallet));
        // `outstandingBalance` remains the source of truth for configured credit
        // cards. `balance` is retained as a numeric compatibility field because
        // older clients deserialize it as a non-null double. This is response-only:
        // it deliberately does not backfill or overwrite the MongoDB document.
        if (wallet.getBalance() == null) {
            wallet.setBalance(0.0);
        }
        return wallet;
    }

    private String safeCardNumber(Wallet wallet) {
        String number = wallet.getCardNumber();
        if (number == null || "upi".equalsIgnoreCase(wallet.getCardType())) return number;
        String digits = number.replaceAll("\\D", "");
        return digits.length() <= 4 ? digits : digits.substring(digits.length() - 4);
    }

    private BigDecimal toCents(BigDecimal value, String label) {
        try {
            return value.setScale(2, java.math.RoundingMode.UNNECESSARY);
        } catch (ArithmeticException ex) {
            throw new IllegalArgumentException(label + " must use at most two decimal places");
        }
    }
}
