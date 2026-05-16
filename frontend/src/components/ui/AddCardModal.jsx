import React, { useEffect, useState } from 'react';
import Button from './Button';

const getDefaultFormData = () => ({
    cardType: 'debit',
    bankName: '',
    cardHolderName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    balance: ''
});

const AddCardModal = ({ isOpen, onClose, onSave, initialData = null }) => {
  const [formData, setFormData] = useState(getDefaultFormData);
  
  const [showWarning, setShowWarning] = useState(false);
  const isEditing = Boolean(initialData);

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setFormData({
        cardType: initialData.cardType || 'debit',
        bankName: initialData.bankName || '',
        cardHolderName: initialData.cardHolderName || '',
        cardNumber: initialData.cardNumber || '',
        expiryDate: initialData.expiryDate || '',
        cvv: initialData.cvv || '',
        balance: initialData.balance ?? ''
      });
    } else {
      setFormData(getDefaultFormData());
    }

    setShowWarning(false);
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.cvv) {
      setShowWarning(true);
    } else {
      onSave({ ...formData, balance: Number(formData.balance || 0) });
      onClose();
    }
  };

  const handleConfirmWarning = () => {
    setShowWarning(false);
    onSave({ ...formData, balance: Number(formData.balance || 0) });
    onClose();
  };

  const isUpi = formData.cardType === 'upi';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className="bg-background rounded-t-2xl max-h-[92vh] max-w-md w-full shadow-2xl overflow-y-auto relative sm:rounded-2xl">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold text-primary">{isEditing ? 'Edit Card' : 'Add New Card'}</h2>
          <p className="text-sm text-neutral-muted mt-1">
            {isEditing ? 'Update the saved details for this card.' : 'Fill in the details to add a new card to your wallet.'}
          </p>
        </div>
        
        {showWarning ? (
          <div className="p-6">
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-yellow-500 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h3 className="font-bold text-yellow-800">Security Warning</h3>
                  <p className="text-sm mt-1">Your personal information (CVV) is being shared and will be stored. Do you wish to proceed?</p>
                </div>
              </div>
            </div>
            <div className="flex gap-4 justify-end">
              <Button variant="outline" onClick={() => setShowWarning(false)}>Cancel</Button>
              <Button onClick={handleConfirmWarning}>Proceed & Save</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Card Type</label>
                <select 
                  name="cardType" 
                  value={formData.cardType} 
                  onChange={handleChange}
                  className="w-full bg-white border border-border rounded-lg px-4 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="debit">Debit Card</option>
                  <option value="credit">Credit Card</option>
                  <option value="upi">UPI ID</option>
                  <option value="personal">Personal Info (ID)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{isUpi ? 'Provider / Bank Name' : 'Bank Name'}</label>
                <input 
                  type="text" 
                  name="bankName" 
                  value={formData.bankName} 
                  onChange={handleChange}
                  placeholder={isUpi ? "e.g. Google Pay" : "e.g. Chase Bank"}
                  className="w-full bg-white border border-border rounded-lg px-4 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{isUpi ? 'Account Name' : 'Cardholder Name'}</label>
                <input 
                  type="text" 
                  name="cardHolderName" 
                  value={formData.cardHolderName} 
                  onChange={handleChange}
                  className="w-full bg-white border border-border rounded-lg px-4 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{isUpi ? 'UPI ID' : 'Card / ID Number'}</label>
                <input 
                  type="text" 
                  name="cardNumber" 
                  value={formData.cardNumber} 
                  onChange={handleChange}
                  placeholder={isUpi ? "e.g. username@bank" : "0000 0000 0000 0000"}
                  className="w-full bg-white border border-border rounded-lg px-4 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              {!isUpi && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Expiry Date</label>
                    <input 
                      type="text" 
                      name="expiryDate" 
                      value={formData.expiryDate} 
                      onChange={handleChange}
                      placeholder="MM/YY"
                      className="w-full bg-white border border-border rounded-lg px-4 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">CVV</label>
                    <input 
                      type="password" 
                      name="cvv" 
                      value={formData.cvv} 
                      onChange={handleChange}
                      placeholder="***"
                      maxLength="4"
                      className="w-full bg-white border border-border rounded-lg px-4 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Current Money in Card</label>
                <input
                  type="number"
                  name="balance"
                  value={formData.balance}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full bg-white border border-border rounded-lg px-4 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="mt-8 flex gap-4 justify-end">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit">{isEditing ? 'Update Card' : 'Save Card'}</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AddCardModal;
