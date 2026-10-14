import React, { useEffect, useState } from 'react';
import { ArrowLeft, Check, X, Lock } from 'lucide-react';
import WalletCard from '../dashboard/WalletCard';
import { CARD_DESIGNS, UPI_DESIGNS, CASH_DESIGNS, SCENIC_DESIGNS, DC_DESIGNS, getCardBackground } from '../../utils/cardDesigns';
import CARD_ICONS, { CardIconRenderer } from '../../utils/cardIcons';
import Button from './Button';
import AddBalanceModal from './AddBalanceModal';
import { formatCurrency } from '../../utils/formatCurrency';

const getDefaultFormData = () => ({
  cardType: 'debit',
  cardBrand: 'visa',
  bankName: '',
  cardName: '',
  cardHolderName: '',
  cardNumber: '',
  expiryDate: '',
  balance: '',
  creditLimit: '',
  outstandingBalance: '',
  statementClosingDay: '',
  paymentDueDay: '',
  minimumPaymentAmount: '',
  creditTermsConfigured: false,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  designPreset: 'midnight',
  primaryColor: '#4F2A8A',
  secondaryColor: '#6D4BC3',
  textColor: '#FFFFFF',
  cardIcon: 'none',
  backSignatureText: 'Not Valid without Authorized Signature',
  backContactInfo: 'support@bank.com | 1-800-555-0199'
});

const inputClass = 'w-full rounded-lg border border-border bg-white px-4 py-2.5 text-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

const formatCardNumber = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 19);
  return digits.match(/.{1,4}/g)?.join('-') || '';
};

const formatExpiryDate = (value, inputType = '') => {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length < 2) return digits;
  if (digits.length === 2) {
    return inputType === 'deleteContentBackward' ? digits : `${digits}/`;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

const applyDesign = (formData, design) => ({
  ...formData,
  designPreset: design.id,
  primaryColor: design.primaryColor,
  secondaryColor: design.secondaryColor,
  textColor: design.textColor
});

const AddCardModal = ({ isOpen, onClose, onSave, initialData = null, isGuest }) => {
  const [formData, setFormData] = useState(getDefaultFormData);
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const isEditing = Boolean(initialData);

  useEffect(() => {
    if (!isOpen) return;
    setFormData(initialData ? {
      ...getDefaultFormData(),
      ...initialData,
      cardNumber: initialData.cardType === 'upi'
        ? initialData.cardNumber || ''
        : formatCardNumber(initialData.cardNumber || ''),
      creditTermsConfigured: Boolean(initialData.creditTermsConfigured),
      timezone: initialData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      expiryDate: formatExpiryDate(initialData.expiryDate || ''),
      cvv: undefined
    } : getDefaultFormData());
    setStep(1);
    setError('');
    setSaving(false);
    setShowBalanceModal(false);
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const isUpi = formData.cardType === 'upi';
  const isCash = formData.cardType === 'cash';
  const availableDesigns = isUpi ? UPI_DESIGNS : (isCash ? CASH_DESIGNS : CARD_DESIGNS);

  const updateField = (name, value) => {
    setFormData((current) => ({ ...current, [name]: value }));
    setError('');
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === 'cardType' && value !== formData.cardType) {
      const nextDesign = value === 'upi' ? UPI_DESIGNS[0] : (value === 'cash' ? CASH_DESIGNS[0] : CARD_DESIGNS[0]);
      setFormData((current) => applyDesign({
        ...current,
        cardType: value,
        cardNumber: '',
        creditTermsConfigured: value === 'credit',
        expiryDate: value === 'upi' ? '' : current.expiryDate
      }, nextDesign));
      setError('');
      return;
    }

    if (name === 'cardNumber' && !isUpi) {
      updateField(name, formatCardNumber(value));
      return;
    }

    if (name === 'expiryDate') {
      updateField(name, formatExpiryDate(value, event.nativeEvent.inputType));
      return;
    }

    updateField(name, value);
  };

  const validateDetails = () => {
    if (!formData.cardHolderName.trim()) {
      setError('Please enter the account or cardholder name.');
      return false;
    }

    if (!isCash) {
      if (!formData.bankName.trim() || !formData.cardNumber.trim()) {
        setError('Complete the bank, account holder, and card details.');
        return false;
      }
      const cardDigits = String(formData.cardNumber).replace(/\D/g, '');
      if (!isUpi && (cardDigits.length < 12 || cardDigits.length > 19)) {
        setError('Enter a valid card number using 12 to 19 digits.');
        return false;
      }
      if (!isUpi && !/^(0[1-9]|1[0-2])\/\d{2}$/.test(formData.expiryDate)) {
        setError('Enter the expiry date in MM/YY format.');
        return false;
      }
    }

    if (formData.cardType === 'credit' && formData.creditTermsConfigured) {
      if (!Number.isFinite(Number(formData.creditLimit)) || Number(formData.creditLimit) <= 0
          || formData.outstandingBalance === '' || !Number.isFinite(Number(formData.outstandingBalance)) || Number(formData.outstandingBalance) < 0
          || Number(formData.outstandingBalance) > Number(formData.creditLimit)) {
        setError('Enter a positive credit limit and an outstanding balance between zero and that limit.');
        return false;
      }
      if (!Number.isInteger(Number(formData.statementClosingDay)) || Number(formData.statementClosingDay) < 1 || Number(formData.statementClosingDay) > 31
          || !Number.isInteger(Number(formData.paymentDueDay)) || Number(formData.paymentDueDay) < 1 || Number(formData.paymentDueDay) > 31
          || !formData.timezone.trim()) {
        setError('Enter statement and due days (1–31) and a valid timezone.');
        return false;
      }
      if (formData.minimumPaymentAmount !== '' && (!Number.isFinite(Number(formData.minimumPaymentAmount)) || Number(formData.minimumPaymentAmount) <= 0)) {
        setError('The issuer-supplied minimum payment must be positive, or leave it unavailable.');
        return false;
      }
    }
    return true;
  };

  const goToDesign = (event) => {
    event.preventDefault();
    if (validateDetails()) setStep(2);
  };

  const selectDesign = (design) => {
    setFormData((current) => ({
      ...current,
      designPreset: design.id,
      primaryColor: design.primaryColor,
      secondaryColor: design.secondaryColor,
      textColor: design.textColor
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await onSave({
        ...formData,
        cardNumber: isUpi ? formData.cardNumber.trim() : formData.cardNumber.replace(/\D/g, '').slice(-4),
        balance: formData.cardType === 'credit' && formData.creditTermsConfigured
          ? null : Number(formData.balance || 0),
        creditLimit: formData.creditTermsConfigured ? Number(formData.creditLimit) : null,
        outstandingBalance: formData.creditTermsConfigured ? Number(formData.outstandingBalance) : null,
        statementClosingDay: formData.creditTermsConfigured ? Number(formData.statementClosingDay) : null,
        paymentDueDay: formData.creditTermsConfigured ? Number(formData.paymentDueDay) : null,
        minimumPaymentAmount: formData.minimumPaymentAmount === '' ? null : Number(formData.minimumPaymentAmount),
        creditTermsConfigured: formData.cardType === 'credit' && Boolean(formData.creditTermsConfigured),
        timezone: formData.creditTermsConfigured ? formData.timezone : null,
        cvv: null
      });
      onClose();
    } catch (saveError) {
      const message = saveError.message || 'Could not save this card in browser storage.';
      setError(message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4">
      <div className="relative max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-background shadow-2xl sm:rounded-3xl">
        <div className="sticky top-0 z-20 flex items-start justify-between border-b border-border bg-background/95 p-5 backdrop-blur sm:px-7">
          <div>
            <h2 className="text-xl font-bold text-primary">{isEditing ? 'Edit card' : 'Add a new card'}</h2>
            <p className="mt-1 text-sm text-neutral-muted">
              Step {step} of 2: {step === 1 ? (isUpi ? 'UPI details' : 'Card details') : (isUpi ? 'Choose your UPI style' : 'Choose your card design')}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-neutral-muted hover:bg-white hover:text-primary" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 pt-5 sm:px-7">
          <div className="grid grid-cols-2 gap-2">
            <div className={`h-1.5 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-border'}`} />
            <div className={`h-1.5 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-border'}`} />
          </div>
        </div>

        {step === 1 ? (
          <form onSubmit={goToDesign} className="p-5 sm:p-7">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Account Type</label>
                <select name="cardType" value={formData.cardType} onChange={handleChange} className={inputClass}>
                  <option value="debit">Debit Card</option>
                  <option value="credit">Credit Card</option>
                  <option value="upi">UPI Account</option>
                  <option value="personal">Personal Card</option>
                  <option value="cash">Cash Account</option>
                </select>
              </div>

              {!isUpi && !isCash && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Card Network</label>
                  <select name="cardBrand" value={formData.cardBrand} onChange={handleChange} className={inputClass}>
                    <option value="visa">Visa</option>
                    <option value="mastercard">Mastercard</option>
                    <option value="rupay">RuPay</option>
                    <option value="amex">American Express</option>
                  </select>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium">{isUpi ? 'Provider / Bank' : 'Bank Name'}</label>
                <input name="bankName" value={formData.bankName} onChange={handleChange} className={inputClass} placeholder={isUpi ? 'Google Pay or bank' : 'Your bank'} />
              </div>

              {!isUpi && !isCash && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Card Name (optional)</label>
                  <input name="cardName" value={formData.cardName || ''} onChange={handleChange} className={inputClass} placeholder="e.g. Travel Rewards" />
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium">{isUpi ? 'Account Name' : 'Cardholder Name'}</label>
                <input name="cardHolderName" value={formData.cardHolderName} onChange={handleChange} className={inputClass} placeholder="Name shown on card" />
              </div>

              {!isCash && (
                <div className={isUpi ? 'sm:col-span-2' : ''}>
                  <label className="mb-1.5 block text-sm font-medium">{isUpi ? 'UPI ID' : 'Card Number'}</label>
                  <input
                    name="cardNumber"
                    value={formData.cardNumber}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder={isUpi ? 'name@bank' : '0000-0000-0000-0000'}
                    inputMode={isUpi ? 'text' : 'numeric'}
                    autoComplete="off"
                    maxLength={isUpi ? undefined : 23}
                  />
                </div>
              )}

              {!isUpi && !isCash && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Expiry Date</label>
                  <input
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="MM/YY"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    maxLength={5}
                  />
                </div>
              )}

              {formData.cardType !== 'credit' && (
              <div>
                <label className="mb-1.5 block text-sm font-medium">Current Balance</label>
                <input type="number" name="balance" value={formData.balance} onChange={handleChange} className={inputClass} min="0" step="0.01" placeholder="0.00" />
              </div>
              )}

              {formData.cardType === 'credit' && (
                <div className="sm:col-span-2 rounded-xl border border-primary/15 bg-primary/5 p-4">
                  <label className="flex items-center gap-2 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.creditTermsConfigured)}
                      disabled={Boolean(initialData?.creditTermsConfigured)}
                      onChange={(event) => updateField('creditTermsConfigured', event.target.checked)}
                    />
                    Configure credit limit and cycle terms
                  </label>
                  {formData.creditTermsConfigured ? (
                    <div className="mt-4 space-y-4">
                      {/* Live Calculated Available Credit Display */}
                      {(() => {
                        const limit = parseFloat(formData.creditLimit) || 0;
                        const debt = parseFloat(formData.outstandingBalance) || 0;
                        const avail = Math.max(0, limit - debt);
                        const util = limit > 0 ? (debt / limit) * 100 : 0;
                        return (
                          <div className="rounded-xl border border-primary/20 bg-background/80 p-3.5 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-neutral-muted uppercase tracking-wider text-[10px]">
                                Available Credit & Utilization Preview
                              </span>
                              <span className="font-bold text-neutral-text">
                                Utilization: {limit > 0 ? util.toFixed(1) : 0}%
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div>
                                <span className="text-neutral-muted">Available Credit (Auto):</span>
                                <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                                  {formatCurrency(avail)}
                                </p>
                              </div>
                              <div>
                                <span className="text-neutral-muted">Calculation:</span>
                                <p className="text-[11px] font-medium text-neutral-muted">
                                  Limit ({formatCurrency(limit)}) − Debt ({formatCurrency(debt)})
                                </p>
                              </div>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  util > 80 ? 'bg-danger' : util > 50 ? 'bg-amber-500' : 'bg-primary'
                                }`}
                                style={{ width: `${Math.min(100, Math.max(0, util))}%` }}
                              />
                            </div>
                            {debt > limit && limit > 0 && (
                              <p className="text-xs font-semibold text-danger">
                                ⚠️ Outstanding balance cannot exceed configured credit limit!
                              </p>
                            )}
                          </div>
                        );
                      })()}

                      <div className="grid gap-4 sm:grid-cols-2">
                        {[
                          ['creditLimit', 'Credit limit (user configurable)', 'e.g. 50000'],
                          ['outstandingBalance', initialData?.creditTermsConfigured ? 'Current outstanding balance' : 'Opening outstanding balance', 'e.g. 0'],
                          ['statementClosingDay', 'Statement closing day (1–31)', 'e.g. 30'],
                          ['paymentDueDay', 'Payment due day (next month, 1–31)', 'e.g. 20'],
                          ['minimumPaymentAmount', 'Issuer-supplied minimum (optional)', 'Leave blank if unavailable'],
                          ['timezone', 'Timezone (IANA)', 'e.g. Asia/Kolkata'],
                        ].map(([name, label, placeholder]) => (
                          <label key={name} className="text-xs font-medium text-neutral-text">
                            {label}
                            <input
                              name={name}
                              type={name === 'timezone' ? 'text' : 'number'}
                              min={name.includes('Day') ? 1 : name === 'outstandingBalance' ? 0 : undefined}
                              max={name.includes('Day') ? 31 : undefined}
                              step={name.includes('Day') ? 1 : '0.01'}
                              disabled={name === 'outstandingBalance' && Boolean(initialData?.creditTermsConfigured)}
                              value={formData[name] ?? ''}
                              onChange={handleChange}
                              className={`${inputClass} mt-1`}
                              placeholder={placeholder}
                            />
                          </label>
                        ))}
                        {initialData?.creditTermsConfigured && (
                          <p className="text-xs text-neutral-muted sm:col-span-2">
                            Outstanding balance changes only through confirmed purchases and repayments.
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-neutral-muted">
                      This card remains unconfigured and cannot record purchases until explicit terms are provided.
                    </p>
                  )}
                  <p className="mt-3 text-xs text-neutral-muted">
                    Interest, fees and minimum due are not estimated; leave the issuer minimum blank if unavailable. Available credit is never treated as cash.
                  </p>
                </div>
              )}

              {/* Back side customization section */}
              <div className="sm:col-span-2 border-t border-border pt-4 mt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-muted mb-3">Back Side Details</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium">Signature Strip Text</label>
                    <input
                      name="backSignatureText"
                      value={formData.backSignatureText || ''}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="e.g. Not Valid without Authorized Signature"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium">Contact / Disclaimer Info</label>
                    <input
                      name="backContactInfo"
                      value={formData.backContactInfo || ''}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="e.g. support@bank.com | 1-800-555-0199"
                    />
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-5 rounded-xl bg-primary/5 p-3 text-xs text-neutral-muted">
              {isGuest
                ? 'Preview mode — card data is stored locally in your browser.'
                : 'For your security, CVV is never requested or stored.'}
            </p>
            {error && <p className="mt-3 text-sm font-medium text-danger">{error}</p>}

            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit">Customize Card</Button>
            </div>
          </form>
        ) : (
          <div className="grid gap-7 p-5 sm:p-7 lg:grid-cols-[340px_1fr]">
            <div>
              <p className="mb-3 text-sm font-semibold text-neutral-text">Live Preview</p>
              <WalletCard
                wallet={formData}
                interactive={false}
                preview
                onAddMoney={() => setShowBalanceModal(true)}
              />
              <p className="mt-3 text-xs text-neutral-muted">Your saved wallet card will use this appearance.</p>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold text-neutral-text">{isUpi ? 'UPI Style Gallery' : 'Design Gallery'}</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2">
                {availableDesigns.map((design) => (
                  <button
                    key={design.id}
                    type="button"
                    onClick={() => selectDesign(design)}
                    className={`relative h-20 overflow-hidden rounded-xl border-2 p-3 text-left transition-all ${formData.designPreset === design.id ? 'border-primary shadow-md' : 'border-transparent hover:border-primary/40'}`}
                    style={{ background: `linear-gradient(135deg, ${design.primaryColor}, ${design.secondaryColor})`, color: design.textColor }}
                  >
                    <span className="text-xs font-bold">{design.name}</span>
                    {formData.designPreset === design.id && <Check className="absolute right-2 top-2" size={16} />}
                  </button>
                ))}
              </div>

              {/* Scenic / Illustrated Cards Section */}
              <div className="mt-5">
                <p className="mb-3 text-sm font-semibold text-neutral-text">🎨 Scenic Cards</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2">
                  {SCENIC_DESIGNS.map((design) => {
                    const scenicBg = getCardBackground({ designPreset: design.id, primaryColor: design.primaryColor, secondaryColor: design.secondaryColor, textColor: design.textColor });
                    return (
                      <button
                        key={design.id}
                        type="button"
                        onClick={() => selectDesign(design)}
                        className={`relative h-24 overflow-hidden rounded-xl border-2 p-3 text-left transition-all ${formData.designPreset === design.id ? 'border-primary shadow-md ring-2 ring-primary/30' : 'border-transparent hover:border-primary/40'}`}
                        style={{ ...scenicBg, backgroundSize: 'cover' }}
                      >
                        <span className="relative z-10 text-xs font-bold drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">{design.name}</span>
                        {formData.designPreset === design.id && <Check className="absolute right-2 top-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" size={16} />}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* DC Superhero Cards Section */}
              <div className="mt-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-neutral-text">🦸‍♂️ DC Superhero Cards</p>
                  {isGuest && (
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      Locked for Guests
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2 relative">
                  {DC_DESIGNS.map((design) => {
                    const dcBg = getCardBackground({ designPreset: design.id, primaryColor: design.primaryColor, secondaryColor: design.secondaryColor, textColor: design.textColor });
                    return (
                      <button
                        key={design.id}
                        type="button"
                        onClick={() => {
                          if (isGuest) {
                            alert("Sign up to unlock DC Superhero card customizations!");
                            return;
                          }
                          selectDesign(design);
                        }}
                        className={`relative h-24 overflow-hidden rounded-xl border-2 p-3 text-left transition-all ${
                          isGuest 
                            ? 'border-transparent opacity-60 cursor-not-allowed' 
                            : formData.designPreset === design.id 
                              ? 'border-primary shadow-md ring-2 ring-primary/30' 
                              : 'border-transparent hover:border-primary/40'
                        }`}
                        style={{ ...dcBg, backgroundSize: 'cover' }}
                      >
                        <span className="relative z-10 text-xs font-bold drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">{design.name}</span>
                        {isGuest ? (
                          <div className="absolute inset-0 bg-black/45 flex items-center justify-center backdrop-blur-[1px]">
                            <Lock size={20} className="text-white drop-shadow-md" />
                          </div>
                        ) : (
                          formData.designPreset === design.id && <Check className="absolute right-2 top-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" size={16} />
                        )}
                      </button>
                    );
                  })}
                </div>
                {isGuest && (
                  <p className="mt-2 text-xs font-medium text-amber-600 flex items-center gap-1.5">
                    <Lock size={12} /> Sign up to unlock DC Superhero card customizations!
                  </p>
                )}
              </div>

              {/* Card Icon Picker */}
              <div className="mt-5">
                <p className="mb-3 text-sm font-semibold text-neutral-text">✨ Card Logo</p>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 lg:grid-cols-4">
                  {CARD_ICONS.map((icon) => (
                    <button
                      key={icon.id}
                      type="button"
                      onClick={() => updateField('cardIcon', icon.id)}
                      className={`relative flex flex-col items-center justify-center gap-1 rounded-xl border-2 p-2.5 transition-all duration-200 ${
                        formData.cardIcon === icon.id
                          ? 'border-primary bg-primary/10 shadow-md ring-2 ring-primary/25'
                          : 'border-border bg-white hover:border-primary/40 hover:shadow-sm'
                      }`}
                      style={{ minHeight: '68px' }}
                    >
                      {icon.component ? (
                        <CardIconRenderer iconId={icon.id} size={32} />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
                          <X size={14} />
                        </div>
                      )}
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-neutral-muted">{icon.name}</span>
                      {formData.cardIcon === icon.id && (
                        <Check className="absolute right-1.5 top-1.5 text-primary" size={12} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <p className="mb-3 text-sm font-semibold text-neutral-text">{isUpi ? 'Personalize UPI Colors' : 'Fine-tune Colors'}</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    ['primaryColor', 'Primary'],
                    ['secondaryColor', 'Accent'],
                    ['textColor', 'Text']
                  ].map(([name, label]) => (
                    <label key={name} className="text-xs text-neutral-muted">
                      {label}
                      <input
                        type="color"
                        value={formData[name]}
                        onChange={(event) => updateField(name, event.target.value)}
                        className="mt-1 block h-11 w-full cursor-pointer rounded-lg border border-border bg-white p-1"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {error && <p className="mt-3 text-sm font-medium text-danger">{error}</p>}
              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(1)}><ArrowLeft size={17} /> Back</Button>
                <Button type="button" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : (isEditing ? 'Update Card' : 'Save Card')}</Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <AddBalanceModal
        wallet={formData}
        isOpen={showBalanceModal}
        onClose={() => setShowBalanceModal(false)}
        onConfirm={(amount) => {
          setFormData((current) => ({
            ...current,
            balance: Number(current.balance || 0) + amount
          }));
        }}
      />
    </div>
  );
};

export default AddCardModal;
