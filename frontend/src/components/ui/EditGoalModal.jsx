import React, { useState, useEffect } from 'react';
import Button from './Button';
import Modal from './Modal';
import api from '../../services/api';
import guestStorage from '../../services/guestStorage';

const EditGoalModal = ({ isOpen, onClose, onSaveSuccess, goal, isGuest }) => {
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    medium: '',
    completed: 'false'
  });
  const [loading, setLoading] = useState(false);

  // Sync state with selected goal
  useEffect(() => {
    if (goal) {
      setFormData({
        title: goal.title || '',
        amount: goal.amount?.toString() || '',
        medium: goal.medium || '',
        completed: goal.completed ? 'true' : 'false'
      });
    }
  }, [goal, isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!goal) return;
    setLoading(true);
    try {
      const payload = {
        ...goal,
        title: formData.title,
        amount: parseFloat(formData.amount),
        completed: formData.completed === 'true',
        medium: formData.medium
      };

      if (isGuest) {
        guestStorage.goals.update(goal.id, payload);
        onSaveSuccess();
        onClose();
      } else {
        const res = await api.put(`/goals/${goal.id}`, payload);
        if (res.data.success) {
          onSaveSuccess();
          onClose();
        }
      }
    } catch (err) {
      console.error("Failed to update goal", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Savings/Investment Target">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1 text-neutral-muted">Target Name</label>
          <input 
            type="text" 
            name="title"
            required 
            placeholder="e.g. Invest in stock, Save for car"
            className="w-full border border-border rounded-input p-2 bg-white text-neutral-text" 
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
            className="w-full border border-border rounded-input p-2 bg-white text-neutral-text" 
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
            className="w-full border border-border rounded-input p-2 bg-white text-neutral-text" 
            value={formData.medium} 
            onChange={handleChange} 
          />
        </div>

        <div>
          <label className="block text-sm mb-2 text-neutral-muted">Status</label>
          <div className="grid grid-cols-2 gap-3">
            <label className={`cursor-pointer rounded-input border p-3 text-center text-sm font-medium transition-colors ${formData.completed === 'false' ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-white text-neutral-muted'}`}>
              <input
                type="radio"
                name="completed"
                value="false"
                checked={formData.completed === 'false'}
                onChange={handleChange}
                className="sr-only"
              />
              Not done
            </label>
            <label className={`cursor-pointer rounded-input border p-3 text-center text-sm font-medium transition-colors ${formData.completed === 'true' ? 'border-success bg-success/10 text-success' : 'border-border bg-white text-neutral-muted'}`}>
              <input
                type="radio"
                name="completed"
                value="true"
                checked={formData.completed === 'true'}
                onChange={handleChange}
                className="sr-only"
              />
              Done
            </label>
          </div>
        </div>

        <Button type="submit" className="w-full mt-4" disabled={loading}>
          {loading ? 'Saving...' : 'Update Target'}
        </Button>
      </form>
    </Modal>
  );
};

export default EditGoalModal;
