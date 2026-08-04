package com.expensetracker.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "wallets")
public class Wallet {
    @Id
    private String id;
    private String userId;
    private String cardNumber; // full card number or UPI ID
    private String cardType; // "debit", "credit", "upi", "personal"
    private String cvv;
    private String expiryDate;
    private String cardHolderName;
    private Double balance;
    private String bankName;
    private Boolean isDefault;
    private String cardBrand;
    private String designPreset;
    private String primaryColor;
    private String secondaryColor;
    private String textColor;
    private String cardIcon;
    private String backSignatureText;
    private String backContactInfo;
}
