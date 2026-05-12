import React, { useState } from 'react';
import Button from './Button';
import Modal from './Modal';
import api from '../../services/api';

const AddGoalModal = ({ isOpen, onClose, onSaveSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    medium: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const now = new Date();
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
        month: now.getMonth() + 1,
        year: now.getFullYear()
      };

      const res = await api.post('/goals', payload);
      if (res.data.success) {
        setFormData({ title: '', amount: '', medium: '' });
        onSaveSuccess();
        onClose();
      }
    } catch (err) {
      console.error("Failed to add goal", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Set Savings/Investment Target">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1 text-neutral-muted">Target Name</label>
          <input 
            type="text" 
            name="title"
            required 
            placeholder="e.g. Invest in stock, Save for car"
            className="w-full border border-border rounded-input p-2 bg-white" 
            value={formData.title} 
            onChange={handleChange} 
          />
        </div>

        <div>
          <label className="block text-sm mb-1 text-neutral-muted">Amount (₹)</label>
          <input 
            type="number" 
            step="0.01"
            name="amount"
            required 
            placeholder="e.g. 2000"
            className="w-full border border-border rounded-input p-2 bg-white" 
            value={formData.amount} 
            onChange={handleChange} 
          />
        </div>

        <div>
          <label className="block text-sm mb-1 text-neutral-muted">Medium</label>
          <input 
            type="text" 
            name="medium"
            required 
            placeholder="e.g. Grow App, Mutual Funds, Bank Account"
            className="w-full border border-border rounded-input p-2 bg-white" 
            value={formData.medium} 
            onChange={handleChange} 
          />
        </div>

        <Button type="submit" className="w-full mt-4" disabled={loading}>
          {loading ? 'Saving...' : 'Set Target'}
        </Button>
      </form>
    </Modal>
  );
};

export default AddGoalModal;
