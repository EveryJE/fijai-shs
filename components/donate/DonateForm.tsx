import React, { useState } from 'react';

interface CategoryItem {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  targetAmount?: string;
  displayOrder?: number;
}
interface Category {
  id: string;
  name: string;
  color: string;
  displayOrder: number;
  items: CategoryItem[];
}
interface DonateFormProps {
  categories: Category[];
  onSubmit: (data: { category: string; item: string; name: string; email: string; phone: string }) => Promise<void>;
  submitting: boolean;
  error: string | null;
}

export const DonateForm: React.FC<DonateFormProps> = ({ categories, onSubmit, submitting, error }) => {
  const [category, setCategory] = useState('');
  const [item, setItem] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name in form) setForm(f => ({ ...f, [name]: value }));
    else if (name === 'category') {
      setCategory(value);
      setItem('');
    } else if (name === 'item') setItem(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ category, item, ...form });
  };

  const selectedCategory = categories.find(cat => cat.id === category);
  const selectedItem = selectedCategory?.items.find(it => it.id === item);

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: 16 }}>
        <label>Category<br />
          <select name="category" value={category} onChange={handleChange} required style={{ width: '100%', padding: 8 }}>
            <option value="">Select category</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id} style={{ color: cat.color }}>{cat.name}</option>
            ))}
          </select>
        </label>
        {category && selectedCategory && (
          <div style={{ marginTop: 8, color: selectedCategory.color }}>
            <strong>Category Details:</strong> {selectedCategory.name}
          </div>
        )}
      </div>
      <div style={{ marginBottom: 16 }}>
        <label>Item<br />
          <select name="item" value={item} onChange={handleChange} required style={{ width: '100%', padding: 8 }} disabled={!category}>
            <option value="">{category ? 'Select item' : 'Select a category first'}</option>
            {selectedCategory?.items.map(it => (
              <option key={it.id} value={it.id} style={{ color: it.color }}>{it.icon ? `${it.icon} ` : ''}{it.name}</option>
            ))}
          </select>
        </label>
        {item && selectedItem && (
          <div style={{ marginTop: 8, color: selectedItem.color }}>
            <strong>Item Details:</strong> {selectedItem.icon && <span>{selectedItem.icon} </span>}{selectedItem.name}
            {selectedItem.targetAmount && (
              <span> &mdash; Target: {selectedItem.targetAmount}</span>
            )}
          </div>
        )}
      </div>
      <div style={{ marginBottom: 16 }}>
        <label>Your Name<br />
          <input name="name" value={form.name} onChange={handleChange} required style={{ width: '100%', padding: 8 }} />
        </label>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label>Email<br />
          <input name="email" type="email" value={form.email} onChange={handleChange} required style={{ width: '100%', padding: 8 }} />
        </label>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label>Phone<br />
          <input name="phone" type="tel" value={form.phone} onChange={handleChange} required style={{ width: '100%', padding: 8 }} />
        </label>
      </div>
      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
      <button type="submit" style={{ width: '100%', padding: 12, background: '#4285f4', color: '#fff', border: 'none', borderRadius: 4 }} disabled={submitting}>
        {submitting ? 'Processing...' : 'Continue to Payment'}
      </button>
    </form>
  );
};
