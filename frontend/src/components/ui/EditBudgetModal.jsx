import React, { useState, useEffect } from 'react';
import Button from './Button';
import api from '../../services/api';

const EditBudgetModal = ({ isOpen, onClose, currentBudgetLimit, currentIncome, onSaveSuccess }) => {
  const [formData, setFormData] = useState({
    budgetLimit: currentBudgetLimit || '',
    monthlyIncome: currentIncome || ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        budgetLimit: currentBudgetLimit || '',
        monthlyIncome: currentIncome || ''
      });
    }
  }, [isOpen, currentBudgetLimit, currentIncome]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const now = new Date();
      const payload = {
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        budgetLimit: parseFloat(formData.budgetLimit),
        monthlyIncome: parseFloat(formData.monthlyIncome)
      };

      const res = await api.post('/budget', payload);
      if (res.data.success) {
        onSaveSuccess();
        onClose();
      }
    } catch (err) {
      console.error("Failed to save budget", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden relative">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold text-primary">Set Monthly Limits</h2>
          <p className="text-sm text-neutral-muted mt-1">Manually set your expected monthly income and budget limit.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Expected Monthly Income (₹)</label>
              <input 
                type="number" 
                step="0.01"
                name="monthlyIncome" 
                value={formData.monthlyIncome} 
                onChange={handleChange}
                placeholder="e.g. 50000"
                className="w-full bg-white border border-border rounded-lg px-4 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Monthly Budget Limit (₹)</label>
              <input 
                type="number" 
                step="0.01"
                name="budgetLimit" 
                value={formData.budgetLimit} 
                onChange={handleChange}
                placeholder="e.g. 35000"
                className="w-full bg-white border border-border rounded-lg px-4 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>
          </div>

          <div className="mt-8 flex gap-4 justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBudgetModal;
