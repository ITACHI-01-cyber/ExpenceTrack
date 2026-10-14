package com.expensetracker.service;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.YearMonth;

import static org.junit.jupiter.api.Assertions.assertEquals;

class CreditCardCycleTest {
    @Test
    void clampsClosingAndDueDaysToMonthAndLeapYear() {
        assertEquals(LocalDate.of(2024, 2, 29), CreditCardCycle.closingDate(YearMonth.of(2024, 2), 31));
        assertEquals(LocalDate.of(2023, 2, 28), CreditCardCycle.closingDate(YearMonth.of(2023, 2), 31));
        assertEquals(LocalDate.of(2024, 2, 29), CreditCardCycle.dueDate(LocalDate.of(2024, 1, 31), 31));
    }

    @Test
    void usesClosingBoundaryInLocalCalendarDate() {
        assertEquals(LocalDate.of(2024, 3, 31),
                CreditCardCycle.latestClosingDate(LocalDate.of(2024, 3, 31), 31));
        assertEquals(LocalDate.of(2024, 2, 29),
                CreditCardCycle.latestClosingDate(LocalDate.of(2024, 3, 30), 31));
        assertEquals(LocalDate.of(2024, 3, 1),
                CreditCardCycle.periodStart(LocalDate.of(2024, 3, 31), 29));
    }
}
