"use client";

import React, { useState } from 'react';
import { 
    GoogleFormInput, 
    GoogleFormTextArea, 
    GoogleFormCard 
} from '@/components/ui/google-form/base';
import { GoogleFormFileUpload } from '@/components/ui/google-form/file-upload';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { SparklesIcon, HeartIcon } from 'lucide-react';

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
  onSubmit: (data: { 
      category: string; 
      item: string; 
      name: string; 
      email: string; 
      phone: string;
      momentFileUrl?: string;
      momentCaption?: string;
      amount?: number;
  }) => Promise<void>;
  submitting: boolean;
  error: string | null;
}

/**
 * Rebuilt Donation Form - Google Form Aesthetic
 * Minimalist, high-fidelity experience for alumni and donors.
 */
export const DonateForm: React.FC<DonateFormProps> = ({ categories, onSubmit, submitting, error }) => {
  const [category, setCategory] = useState('');
  const [item, setItem] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [form, setForm] = useState({ 
      name: '', 
      email: '', 
      phone: '',
      momentFileUrl: '',
      momentCaption: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name in form) setForm(f => ({ ...f, [name]: value }));
    else if (name === 'category') {
      setCategory(value);
      setItem('');
    } else if (name === 'item') setItem(value);
    else if (name === 'customAmount') setCustomAmount(value);
  };

  const handleMomentUpload = (path: string) => {
      setForm(f => ({ ...f, momentFileUrl: path }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Determine the donation amount
    const selectedCategory = categories.find(cat => cat.id === category);
    const selectedItem = selectedCategory?.items.find(it => it.id === item);
    const baseAmount = selectedItem?.targetAmount ? Number(selectedItem.targetAmount) : 0;
    
    // If the item doesn't have a target amount, use the custom input
    const finalAmount = baseAmount > 0 ? baseAmount : Number(customAmount);

    await onSubmit({ 
        category, 
        item, 
        ...form,
        amount: finalAmount
    });
  };

  const selectedCategory = categories.find(cat => cat.id === category);
  const selectedItem = selectedCategory?.items.find(it => it.id === item);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-5">
      
      {/* 1. Category Selection */}
      <GoogleFormCard title="Project Category" description="Please select a category to select from ot" required>
        <Combobox
            options={categories.map(cat => ({ value: cat.id, label: cat.name }))}
            value={category}
            onChange={(val) => { setCategory(val); setItem(''); }}
            placeholder="Select established category"
        />
      </GoogleFormCard>

      {/* 2. Item Selection */}
      <GoogleFormCard 
        title="Contribution Registry" 
        description="Select specific project item or fund within this category."
        required={!!category}
      >
        <Combobox 
            options={selectedCategory?.items.map(it => ({ value: it.id, label: `${it.icon ? it.icon + ' ' : ''}${it.name}${it.targetAmount ? ` (GHS ${Number(it.targetAmount).toFixed(2)})` : ''}` })) || []}
            value={item}
            onChange={setItem}
            placeholder={category ? "Select project item" : "Select a focus area first"}
            disabled={!category}
        />
        
        {/* If selected item has no target amount, show custom amount input */}
        {item && selectedItem && !selectedItem.targetAmount && (
            <div className="mt-6 animate-in fade-in slide-in-from-top-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#730303] mb-2 font-black">Designated Amount (GHS)</p>
                <GoogleFormInput 
                    name="customAmount" 
                    type="number" 
                    value={customAmount} 
                    onChange={handleChange} 
                    placeholder="0.00" 
                    required 
                />
            </div>
        )}
      </GoogleFormCard>

      {/* 3. Donor Identity */}
      <GoogleFormCard title="Donor Credentials" description="Tell us who is making this impact. Your name will be recorded in the institutional registry.">
        <div className="space-y-6">
            <div>
                <p className="text-sm">Full Legal Name</p>
                <GoogleFormInput 
                    name="name" 
                    value={form.name} 
                    onChange={handleChange} 
                    placeholder="Enter your name" 
                    required 
                />
            </div>
            <div>
                <p className="text-sm">Official Email Identifier</p>
                <GoogleFormInput 
                    name="email" 
                    type="email" 
                    value={form.email} 
                    onChange={handleChange} 
                    placeholder="formal.email@example.com" 
                    required 
                />
            </div>
            <div>
                <p className="text-sm">Contact Phone</p>
                <GoogleFormInput 
                    name="phone" 
                    type="tel" 
                    value={form.phone} 
                    onChange={handleChange} 
                    placeholder="+233 XX XXX XXXX" 
                    required 
                />
            </div>
        </div>
      </GoogleFormCard>

      {/* 4. Sharing a Moment */}
      <GoogleFormCard 
        title="Share a Moment" 
        description="Optional: Attach a photo and a brief memory or message of your time at Fijai SHS."
      >
        <div className="space-y-6">
            <GoogleFormFileUpload 
                value={form.momentFileUrl} 
                onChange={handleMomentUpload} 
                label="Upload a School Memory" 
            />
            
            <div className="mt-4">
                <p className="text-sm">Institutional Message</p>
                <GoogleFormTextArea 
                    name="momentCaption" 
                    value={form.momentCaption} 
                    onChange={handleChange} 
                    placeholder="A brief message on why you are contributing..." 
                />
            </div>
        </div>
      </GoogleFormCard>

      {/* Error & Submission */}
      {error && (
          <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-red-600 font-bold uppercase tracking-widest text-[10px] animate-bounce">
              {error}
          </div>
      )}

      <div className="flex justify-start">
        <Button 
            type="submit" 
            size='default'
            className="" 
            disabled={submitting}
        >
            {submitting ? 'Regsitering Impact...' : 'Commit Institutional Contribution'}
        </Button>
      </div>

    </form>
  );
};
