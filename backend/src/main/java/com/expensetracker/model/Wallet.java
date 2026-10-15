package com.expensetracker.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import com.fasterxml.jackson.annotation.JsonGetter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "wallets")
public class Wallet {
    @Id
    private String id;
    private String userId;
    @ToString.Exclude
    private String cardNumber; // last four digits or UPI ID
    private String cardType; // "debit", "credit", "upi", "personal"
    @JsonIgnore
    @ToString.Exclude
    private String cvv;
    private String expiryDate;
    private String cardHolderName;
    private Double balance;
    private String bankName;
    private String cardName;
    private BigDecimal creditLimit;
    private BigDecimal outstandingBalance;
    private Integer statementClosingDay;
    private Integer paymentDueDay;
    private BigDecimal minimumPaymentAmount;
    private Boolean creditTermsConfigured;
    private String timezone;
    @JsonIgnore
    private BigDecimal creditOpeningBalance;
    @JsonIgnore
    private LocalDateTime creditTermsConfiguredAt;
    private Boolean isDefault;
    private String cardBrand;
    private String designPreset;
    private String primaryColor;
    private String secondaryColor;
    private String textColor;
    private String accentColor;
    private String artwork;
    private String cardStyle;
    private String cardIcon;
    private String backSignatureText;
    private String backContactInfo;

    @JsonGetter("creditTermsConfigured")
    public Boolean getCreditTermsConfigured() {
        return creditTermsConfigured == null ? Boolean.FALSE : creditTermsConfigured;
    }
}
