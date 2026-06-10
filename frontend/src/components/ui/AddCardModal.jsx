import React, { useEffect, useState } from 'react';
import { ArrowLeft, Check, X } from 'lucide-react';
import WalletCard from '../dashboard/WalletCard';
import { CARD_DESIGNS, UPI_DESIGNS } from '../../utils/cardDesigns';
import Button from './Button';
import AddBalanceModal from './AddBalanceModal';

const getDefaultFormData = () => ({
  cardType: 'debit',
  cardBrand: 'visa',
  bankName: '',
  cardHolderName: '',
  cardNumber: '',
  expiryDate: '',
  balance: '',
  designPreset: 'midnight',
  primaryColor: '#111827',
  secondaryColor: '#312E81',
  textColor: '#FFFFFF'
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

const AddCardModal = ({ isOpen, onClose, onSave, initialData = null }) => {
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
  const availableDesigns = isUpi ? UPI_DESIGNS : CARD_DESIGNS;

  const updateField = (name, value) => {
    setFormData((current) => ({ ...current, [name]: value }));
    setError('');
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === 'cardType' && value !== formData.cardType) {
      const nextDesign = value === 'upi' ? UPI_DESIGNS[0] : CARD_DESIGNS[0];
      setFormData((current) => applyDesign({
        ...current,
        cardType: value,
        cardNumber: '',
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
    if (!formData.bankName.trim() || !formData.cardHolderName.trim() || !formData.cardNumber.trim()) {
      setError('Complete the bank, account holder, and card details.');
      return false;
    }
    const cardDigits = formData.cardNumber.replace(/\D/g, '');
    if (!isUpi && (cardDigits.length < 12 || cardDigits.length > 19)) {
      setError('Enter a valid card number using 12 to 19 digits.');
      return false;
    }
    if (!isUpi && !/^(0[1-9]|1[0-2])\/\d{2}$/.test(formData.expiryDate)) {
      setError('Enter the expiry date in MM/YY format.');
      return false;
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
        cardNumber: formData.cardNumber.trim(),
        balance: Number(formData.balance || 0),
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
                </select>
              </div>

              {!isUpi && (
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

              <div>
                <label className="mb-1.5 block text-sm font-medium">{isUpi ? 'Account Name' : 'Cardholder Name'}</label>
                <input name="cardHolderName" value={formData.cardHolderName} onChange={handleChange} className={inputClass} placeholder="Name shown on card" />
              </div>

              <div className={isUpi ? 'sm:col-span-2' : ''}>
                <label className="mb-1.5 block text-sm font-medium">{isUpi ? 'UPI ID' : 'Card Number'}</label>
                <input
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder={isUpi ? 'name@bank' : '0000-0000-0000-0000'}
                  inputMode={isUpi ? 'text' : 'numeric'}
                  autoComplete={isUpi ? 'off' : 'cc-number'}
                  maxLength={isUpi ? undefined : 23}
                />
              </div>

              {!isUpi && (
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

              <div>
                <label className="mb-1.5 block text-sm font-medium">Current Balance</label>
                <input type="number" name="balance" value={formData.balance} onChange={handleChange} className={inputClass} min="0" step="0.01" placeholder="0.00" />
              </div>
            </div>

            <p className="mt-5 rounded-xl bg-primary/5 p-3 text-xs text-neutral-muted">
              For your security, CVV is never requested or stored.
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
