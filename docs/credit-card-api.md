# Credit-card API contract

All routes below are additive, authenticated (`Authorization: Bearer …`) APIs. Existing `/api/wallet` and `/api/transactions` routes remain available. Successful responses use the existing envelope `{ "success": true, "message": "...", "data": ... }`.

## Wallet DTO additions

`POST /api/wallet` and `PUT /api/wallet/{id}` accept and return the existing wallet fields plus:

```json
{
  "cardName": "Travel Rewards",
  "creditLimit": 5000.00,
  "outstandingBalance": 125.50,
  "statementClosingDay": 31,
  "paymentDueDay": 21,
  "minimumPaymentAmount": null,
  "creditTermsConfigured": true,
  "timezone": "Asia/Kolkata"
}
```

`bankName` remains the issuer; `cardName` is the user's display name. To configure a new credit card, submit `cardType: "credit"`, `creditTermsConfigured: true`, a positive `creditLimit`, an explicit nonnegative `outstandingBalance`, closing/due days from 1–31, and a valid IANA `timezone`. `minimumPaymentAmount` is optional and must come from the issuer; `null` means unavailable. Due day means the stated day in the calendar month following the closing date, clamped to that month's last day. A card configured once cannot be unconfigured through wallet update.

`date` values accepted by purchase and repayment requests are `LocalDateTime` values interpreted in the card's configured `timezone`; omit the field to use the current local time in that zone.

Omitted legacy fields serialize as `creditTermsConfigured: false`, with `creditLimit`, `outstandingBalance`, cycle days, minimum and `timezone` null. Existing legacy `cardType: "credit"` and `balance` are left untouched and never interpreted as a limit, debt, or available credit. `balance` is not used for configured credit-card liability. CVV is ignored, never saved, and never returned. The API only retains/returns the last four card-number digits (UPI identifiers remain UPI identifiers).

## Purchases

`POST /api/transactions` with the ordinary expense DTO:

```json
{
  "type": "expense",
  "walletId": "<configured-credit-wallet-id>",
  "amount": 35.25,
  "category": "Dining",
  "description": "Lunch",
  "date": "2026-10-10T12:30:00"
}
```

The response transaction has `transactionKind: "purchase"` and `idempotencyKey: null`; existing/unspecified transactions serialize as `"standard"`. Purchases need no idempotency key. They are ordinary expenses, counted once, and increase outstanding balance without debiting wallet cash. Unconfigured and over-limit credit cards reject purchases. They are internal records, not issuer authorizations.

## Linked purchase refunds

`POST /api/transactions/{purchaseId}/refunds` records a refund against an existing credit-card purchase. The authenticated owner must own the original purchase and its configured credit card.

```json
{
  "amount": 25.00,
  "idempotencyKey": "stable-client-generated-key",
  "date": "2026-10-18T12:00:00"
}
```

The request amount is positive. The server persists the refund as a negative-amount `expense` with `transactionKind: "refund"` and `relatedTransactionId` pointing to the original purchase. The refund reduces that purchase's net expense and the card's outstanding liability; it does not create income or debit a cash wallet. Refund totals cannot exceed the original purchase amount, and retries with the same idempotency key return the existing refund. A refund may reduce outstanding liability below zero, representing a card credit balance; available credit is then greater than the configured credit limit. Generic edit/delete of refund records and edits/deletes of refunded purchases are rejected to preserve ledger integrity.

## Repayment

`POST /api/wallet/{cardId}/repayments` request:

```json
{
  "sourceWalletId": "<owned-non-credit-wallet-id>",
  "amount": 40.00,
  "statementId": "<optional-statement-id>",
  "idempotencyKey": "unique-client-generated-key",
  "date": "2026-10-10T12:30:00"
}
```

`statementId` and `date` may be omitted/null. `idempotencyKey` is required (1–128 characters); retry the same request with the same key. Reusing that key with different request data is rejected. The response `data` DTO:

```json
{
  "id": "<repayment-id>",
  "walletId": "<credit-card-id>",
  "sourceWalletId": "<source-wallet-id>",
  "statementId": null,
  "amount": 40.00,
  "date": "2026-10-10T12:30:00",
  "transactionKind": "repayment",
  "idempotencyKey": "unique-client-generated-key",
  "outstandingBalance": 85.50,
  "sourceWalletBalance": 460.00,
  "replayed": false
}
```

Repayments live in their own model, not `/api/transactions`; they are internal transfers, never income/expenses, and do not imply a payment was sent to an issuer. `GET /api/wallet/{cardId}/activity` combines items with `transactionKind` values `purchase` and `repayment`; repayment items carry `sourceWalletId`, optional `statementId`, and `idempotencyKey`.

## Statements

`POST /api/wallet/{cardId}/statements/generate` accepts `{}` or `{"asOfDate":"2026-10-10"}` and returns the statement snapshot:

```json
{
  "id": "<statement-id>",
  "userId": "<owner-id>",
  "walletId": "<credit-card-id>",
  "periodStart": "2026-09-01",
  "periodEnd": "2026-09-30",
  "generatedAt": "2026-10-10T12:00:00",
  "timezone": "Asia/Kolkata",
  "statementClosingDay": 31,
  "dueDate": "2026-10-21",
  "statementBalance": 85.50,
  "minimumPaymentAmount": null
}
```

The latest closed local-calendar cycle is selected, with closing/due days clamped to month length (including leap years). Re-generating a card/period returns its original immutable snapshot. `GET /api/wallet/{cardId}/statements` returns these snapshots newest first. No issuer interest, fees, reminders, or minimum due are invented; this repository has no reliable reminder/delivery mechanism.

Wallet/source/statement ownership is checked on every operation. Multi-document writes require MongoDB transaction support (a replica set, including MongoDB Atlas).
