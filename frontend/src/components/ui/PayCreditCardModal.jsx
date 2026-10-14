import React, { useState, useEffect } from 'react';
import { 
  X, 
  CreditCard, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Banknote, 
  Calendar, 
  FileText, 
  Sparkles,
  ShieldCheck,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import Button from './Button';
import { formatCurrency } from '../../utils/formatCurrency';

const PayCreditCardModal = ({
  isOpen,
  onClose,
  card,
  allWallets = [],
  statements = [],
  onPay,
  isGuest = false
}) => {
  const [amount, setAmount] = useState('');
  const [sourceWalletId, setSourceWalletId] = useState('');
  const [statementId, setStatementId] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [step, setStep] = useState(1); // 1 = Details, 2 = Confirmation
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successResult, setSuccessResult] = useState(null);

  // Eligible funding accounts: excludes credit cards and the card being repaid
  const eligibleSources = allWallets.filter(
    (w) => w.id !== card?.id && w.cardType?.toLowerCase() !== 'credit'
  );

  const selectedSource = eligibleSources.find((w) => w.id === sourceWalletId) || null;

  const outstanding = Math.max(0, Number(card?.outstandingBalance || 0));
  const creditLimit = Math.max(0, Number(card?.creditLimit || 0));
  const currentAvailable = Math.max(0, creditLimit - outstanding);
  const minimumDue = card?.minimumPaymentAmount != null ? Number(card.minimumPaymentAmount) : null;

  const numAmount = parseFloat(amount) || 0;
  const remainingOutstanding = Math.max(0, outstanding - numAmount);
  const newAvailableCredit = Math.min(creditLimit, currentAvailable + numAmount);
  const sourceBalance = selectedSource ? Number(selectedSource.balance || 0) : 0;
  const remainingSourceBalance = sourceBalance - numAmount;

  // Reset form when modal opens
  useEffect(() => {
    if (!isOpen || !card) return;
    setAmount(outstanding > 0 ? String(outstanding) : '');
    // Default to first eligible source with sufficient balance if available
    const firstEligible = eligibleSources.find((s) => (s.balance || 0) >= (outstanding || 1)) || eligibleSources[0];
    setSourceWalletId(firstEligible?.id || '');
    setStatementId('');
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setNote('');
    setStep(1);
    setError('');
    setSubmitting(false);
    setSuccessResult(null);
  }, [isOpen, card?.id]);

  if (!isOpen || !card) return null;

  const validateStep1 = () => {
    setError('');
    if (!sourceWalletId) {
      setError('Please select a payment source (Bank, Debit, UPI, or Cash).');
      return false;
    }
    if (!selectedSource) {
      setError('Selected payment source was not found.');
      return false;
    }
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid payment amount greater than zero.');
      return false;
    }
    if (numAmount > outstanding) {
      setError(`Repayment cannot exceed your outstanding balance of ${formatCurrency(outstanding)}.`);
      return false;
    }
    if (numAmount > sourceBalance) {
      setError(`Insufficient funds in ${selectedSource.bankName || selectedSource.cardType}. Available balance: ${formatCurrency(sourceBalance)}.`);
      return false;
    }
    return true;
  };

  const handleContinueToConfirm = (e) => {
    e.preventDefault();
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleFinalSubmit = async () => {
    if (!validateStep1()) {
      setStep(1);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const idempotencyKey = globalThis.crypto?.randomUUID?.() ||
        `repay-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

      const requestPayload = {
        sourceWalletId,
        amount: numAmount,
        statementId: statementId || null,
        paymentDate,
        note: note.trim() || undefined,
        idempotencyKey
      };

      const result = await onPay(card.id, requestPayload);
      setSuccessResult({
        amount: numAmount,
        sourceName: selectedSource.bankName || selectedSource.cardType || 'Funding Account',
        cardName: card.cardName || card.bankName || 'Credit Card',
        remainingOutstanding,
        newAvailableCredit,
        remainingSourceBalance
      });
    } catch (err) {
      console.error('Repayment error:', err);
      const msg = err.response?.data?.message || err.message || 'Payment failed. Please try again.';
      setError(msg);
      setStep(1); // Return to step 1 so user can correct
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4 backdrop-blur-sm animate-[fade-in_0.2s_ease-out]">
      <div 
        className="relative max-h-[94vh] w-full max-w-xl overflow-hidden rounded-t-3xl border border-border/80 bg-surface shadow-2xl sm:rounded-3xl flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pay-credit-card-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-background/80 px-6 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CreditCard size={20} />
            </div>
            <div>
              <h2 id="pay-credit-card-title" className="text-base font-bold text-neutral-text sm:text-lg">
                Pay Credit Card
              </h2>
              <p className="text-xs text-neutral-muted">
                {card.cardName || card.bankName || 'Credit Card'} (•••• {String(card.cardNumber || '').slice(-4)})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-neutral-muted transition-colors hover:bg-white/10 hover:text-neutral-text"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {successResult ? (
            /* Success View */
            <div className="py-6 text-center animate-[fade-in_0.3s_ease-out]">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                <CheckCircle2 size={36} />
              </div>
              <h3 className="text-xl font-bold text-neutral-text">Payment Completed!</h3>
              <p className="mt-1 text-sm text-neutral-muted">
                {formatCurrency(successResult.amount)} has been paid from {successResult.sourceName} to {successResult.cardName}.
              </p>

              <div className="mx-auto mt-6 max-w-md rounded-2xl border border-border bg-background/50 p-4 text-left space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-neutral-muted">New Outstanding Balance:</span>
                  <span className="font-bold text-neutral-text">{formatCurrency(successResult.remainingOutstanding)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-muted">Restored Available Credit:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(successResult.newAvailableCredit)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2">
                  <span className="text-neutral-muted">{successResult.sourceName} Balance:</span>
                  <span className="font-bold text-neutral-text">{formatCurrency(successResult.remainingSourceBalance)}</span>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <Button onClick={onClose} className="px-8">
                  Done
                </Button>
              </div>
            </div>
          ) : step === 1 ? (
            /* Step 1: Input Form */
            <form onSubmit={handleContinueToConfirm} className="space-y-5">
              {/* Card Summary Banner */}
              <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4">
                <div className="grid grid-cols-2 gap-3 text-left">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-muted">
                      Total Outstanding
                    </span>
                    <p className="text-lg font-black tracking-tight text-danger">
                      {formatCurrency(outstanding)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-muted">
                      Available Credit
                    </span>
                    <p className="text-lg font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(currentAvailable)}
                    </p>
                  </div>
                </div>

                {minimumDue != null && minimumDue > 0 && (
                  <div className="mt-3 flex items-center justify-between border-t border-primary/10 pt-2 text-xs">
                    <span className="text-neutral-muted">Minimum Due:</span>
                    <span className="font-bold text-neutral-text">{formatCurrency(minimumDue)}</span>
                  </div>
                )}
              </div>

              {/* Quick Select Chips */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-neutral-muted">
                  Quick Amount
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAmount(String(outstanding));
                      setError('');
                    }}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                      numAmount === outstanding && outstanding > 0
                        ? 'bg-primary text-white shadow-sm'
                        : 'border border-border bg-background hover:border-primary/40 text-neutral-text'
                    }`}
                  >
                    Full Balance ({formatCurrency(outstanding)})
                  </button>

                  {minimumDue != null && minimumDue > 0 && minimumDue < outstanding && (
                    <button
                      type="button"
                      onClick={() => {
                        setAmount(String(minimumDue));
                        setError('');
                      }}
                      className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                        numAmount === minimumDue
                          ? 'bg-primary text-white shadow-sm'
                          : 'border border-border bg-background hover:border-primary/40 text-neutral-text'
                      }`}
                    >
                      Minimum Due ({formatCurrency(minimumDue)})
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setAmount('');
                      setError('');
                    }}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                      numAmount !== outstanding && numAmount !== minimumDue
                        ? 'bg-primary/15 text-primary border border-primary/30'
                        : 'border border-border bg-background hover:border-primary/40 text-neutral-text'
                    }`}
                  >
                    Custom Amount
                  </button>
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral-text">
                  Amount to Pay <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-neutral-muted">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0.01"
                    max={outstanding}
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setError('');
                    }}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-border bg-background pl-8 pr-4 py-2.5 text-base font-bold tabular-nums text-neutral-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Payment Source Selector */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral-text">
                  Payment Source <span className="text-danger">*</span>
                </label>
                {eligibleSources.length === 0 ? (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/40 p-3 text-xs text-amber-800 dark:text-amber-200">
                    No eligible payment sources found (Debit Card, UPI, Bank Account, or Cash). Please add one in your Wallet first.
                  </div>
                ) : (
                  <div className="space-y-2">
                    <select
                      value={sourceWalletId}
                      onChange={(e) => {
                        setSourceWalletId(e.target.value);
                        setError('');
                      }}
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-neutral-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Select funding account...</option>
                      {eligibleSources.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.cardName || s.bankName || s.cardType?.toUpperCase()} · (•••• {String(s.cardNumber || '').slice(-4) || '—'}) — Available: {formatCurrency(s.balance || 0)}
                        </option>
                      ))}
                    </select>

                    {selectedSource && (
                      <div className="flex items-center justify-between rounded-xl bg-background/60 px-3.5 py-2 text-xs border border-border/50">
                        <span className="text-neutral-muted">Source Available Balance:</span>
                        <span className={`font-bold tabular-nums ${sourceBalance >= numAmount ? 'text-emerald-600 dark:text-emerald-400' : 'text-danger'}`}>
                          {formatCurrency(sourceBalance)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Statement Association (Optional) */}
              {statements.length > 0 && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-neutral-text">
                    Link to Statement <span className="text-[10px] font-normal text-neutral-muted">(optional)</span>
                  </label>
                  <select
                    value={statementId}
                    onChange={(e) => setStatementId(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2 text-xs text-neutral-text focus:border-primary focus:outline-none"
                  >
                    <option value="">Auto / Current Outstanding Liability</option>
                    {statements.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.periodStart} – {st.periodEnd} · Due {st.dueDate} ({formatCurrency(st.statementBalance)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date & Note Grid */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-neutral-muted">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-neutral-text focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-neutral-muted">
                    Note <span className="text-[10px] font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Monthly bill settlement"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-neutral-text focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Live Preview Cards */}
              {numAmount > 0 && (
                <div className="rounded-2xl border border-border bg-background/50 p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-muted">Card Liability After Payment:</span>
                    <span className="font-bold tabular-nums text-neutral-text">
                      {formatCurrency(remainingOutstanding)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-muted">Available Credit After Payment:</span>
                    <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(newAvailableCredit)}
                    </span>
                  </div>
                  {selectedSource && (
                    <div className="flex items-center justify-between border-t border-border pt-1.5">
                      <span className="text-neutral-muted">Source Remaining Balance:</span>
                      <span className={`font-bold tabular-nums ${remainingSourceBalance >= 0 ? 'text-neutral-text' : 'text-danger'}`}>
                        {formatCurrency(remainingSourceBalance)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs font-medium text-danger">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={!sourceWalletId || numAmount <= 0 || numAmount > outstanding || numAmount > sourceBalance}
                  className="gap-1.5"
                >
                  Review Payment <ArrowRight size={15} />
                </Button>
              </div>
            </form>
          ) : (
            /* Step 2: Final Confirmation Step */
            <div className="space-y-5 animate-[fade-in_0.2s_ease-out]">
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-muted">
                  You are settling
                </p>
                <p className="mt-1 text-2xl font-black text-primary tabular-nums">
                  {formatCurrency(numAmount)}
                </p>
                <p className="mt-1 text-xs text-neutral-muted">
                  from {selectedSource?.bankName || selectedSource?.cardType} to {card.cardName || card.bankName || 'Credit Card'}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-background/50 p-4 space-y-3 text-xs">
                <h4 className="font-bold uppercase tracking-wider text-neutral-muted text-[10px]">
                  Accounting & Transfer Summary
                </h4>
                
                <div className="flex justify-between">
                  <span className="text-neutral-muted">Payment Source:</span>
                  <span className="font-semibold text-neutral-text">
                    {selectedSource?.bankName || selectedSource?.cardType} (•••• {String(selectedSource?.cardNumber || '').slice(-4) || '—'})
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-neutral-muted">Source Deduction:</span>
                  <span className="font-semibold text-danger">−{formatCurrency(numAmount)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-neutral-muted">Source Balance Afterwards:</span>
                  <span className="font-bold text-neutral-text">{formatCurrency(remainingSourceBalance)}</span>
                </div>

                <div className="border-t border-border pt-2 flex justify-between">
                  <span className="text-neutral-muted">Destination Credit Card:</span>
                  <span className="font-semibold text-neutral-text">{card.cardName || card.bankName}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-neutral-muted">Liability Reduction:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">−{formatCurrency(numAmount)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-neutral-muted">New Outstanding Balance:</span>
                  <span className="font-bold text-neutral-text">{formatCurrency(remainingOutstanding)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-neutral-muted">New Available Credit:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(newAvailableCredit)}</span>
                </div>

                <div className="border-t border-border pt-2 flex justify-between">
                  <span className="text-neutral-muted">Payment Date:</span>
                  <span className="font-semibold text-neutral-text">{paymentDate}</span>
                </div>

                {note && (
                  <div className="flex justify-between">
                    <span className="text-neutral-muted">Note:</span>
                    <span className="font-semibold text-neutral-text">{note}</span>
                  </div>
                )}
              </div>

              <div className="rounded-xl bg-primary/5 p-3 text-[11px] text-neutral-muted flex items-start gap-2">
                <ShieldCheck size={16} className="shrink-0 text-primary mt-0.5" />
                <span>
                  This transfer records an internal liability settlement between your accounts. It decreases debt without duplicating monthly expense totals.
                </span>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs font-medium text-danger">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setStep(1)}
                  disabled={submitting}
                >
                  Back
                </Button>
                <Button 
                  type="button" 
                  onClick={handleFinalSubmit} 
                  disabled={submitting}
                  className="gap-2 px-6"
                >
                  {submitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} /> Confirm & Pay {formatCurrency(numAmount)}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PayCreditCardModal;
