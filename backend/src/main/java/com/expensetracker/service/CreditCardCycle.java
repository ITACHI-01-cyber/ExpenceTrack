package com.expensetracker.service;

import java.time.LocalDate;
import java.time.YearMonth;

public final class CreditCardCycle {
    private CreditCardCycle() {}

    public static LocalDate closingDate(YearMonth month, int closingDay) {
        return month.atDay(Math.min(closingDay, month.lengthOfMonth()));
    }

    public static LocalDate latestClosingDate(LocalDate asOfDate, int closingDay) {
        YearMonth month = YearMonth.from(asOfDate);
        LocalDate close = closingDate(month, closingDay);
        if (close.isAfter(asOfDate)) {
            close = closingDate(month.minusMonths(1), closingDay);
        }
        return close;
    }

    public static LocalDate periodStart(LocalDate periodEnd, int closingDay) {
        return closingDate(YearMonth.from(periodEnd).minusMonths(1), closingDay).plusDays(1);
    }

    public static LocalDate dueDate(LocalDate periodEnd, int paymentDueDay) {
        return closingDate(YearMonth.from(periodEnd).plusMonths(1), paymentDueDay);
    }
}
