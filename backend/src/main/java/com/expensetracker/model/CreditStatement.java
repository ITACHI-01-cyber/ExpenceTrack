package com.expensetracker.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "credit_statements")
@CompoundIndex(name = "uniq_credit_statement_wallet_period", def = "{'walletId': 1, 'periodEnd': 1}", unique = true)
public class CreditStatement {
    @Id
    private String id;
    private String userId;
    private String walletId;
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private LocalDateTime generatedAt;
    private String timezone;
    private Integer statementClosingDay;
    private LocalDate dueDate;
    private BigDecimal statementBalance;
    private BigDecimal minimumPaymentAmount;
}
