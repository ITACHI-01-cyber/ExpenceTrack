package com.expensetracker.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "budgets")
public class Budget {
    @Id
    private String id;
    private String userId;
    private Integer month; // 1-12
    private Integer year;
    private Double monthlyIncome;
    private Double budgetLimit;
    private List<CategoryBudget> categories;
    private Double savingRate;
    private Double totalBills;
    private LocalDateTime createdAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryBudget {
        private String name;
        private Double budgetAmount;
        private Double spentAmount;
    }
}
