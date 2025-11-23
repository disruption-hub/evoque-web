'use client';

import * as React from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { getBrandColor } from '@/config/brand-colors';

export function JoinUsForm() {
  const [formData, setFormData] = React.useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    resume: null as File | null,
    coverLetter: '',
  });
  const [errors, setErrors] = React.useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.position.trim()) {
      newErrors.position = 'Position is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const { [field]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, resume: file }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    try {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // For now, just log the form data
      console.log('Join us form submission:', formData);
      
      // In a real app, you would handle the response here
      alert('Thank you for your interest! We will review your application and get back to you soon.');
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        position: '',
        resume: null,
        coverLetter: '',
      });
    } catch (error) {
      console.error('Form submission error:', error);
      alert('There was an error submitting your application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="w-full max-w-2xl mx-auto p-8 rounded-lg shadow-lg"
      style={{
        backgroundColor: getBrandColor('white'),
        border: `1px solid #e5e7eb`,
      }}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              type="text"
              placeholder="John"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              required
            />
            {errors.firstName && <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>}
          </div>

          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              type="text"
              placeholder="Doe"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              required
            />
            {errors.lastName && <p className="text-sm text-red-500 mt-1">{errors.lastName}</p>}
          </div>
        </div>

        <div>
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            required
          />
          {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
        </div>

        <div>
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+1 (555) 123-4567"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            required
          />
          {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
        </div>

        <div>
          <Label htmlFor="position">Position Applied For</Label>
          <Input
            id="position"
            type="text"
            placeholder="e.g., Customer Service Representative"
            value={formData.position}
            onChange={(e) => handleInputChange('position', e.target.value)}
            required
          />
          {errors.position && <p className="text-sm text-red-500 mt-1">{errors.position}</p>}
        </div>

        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: getBrandColor('deepNavy') }}
          >
            Resume (PDF, DOC, DOCX)
          </label>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileChange}
            className="w-full px-4 py-2 rounded-md border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{
              borderColor: '#e5e7eb',
              color: getBrandColor('black'),
              backgroundColor: getBrandColor('white'),
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = getBrandColor('secondaryBlue');
              e.currentTarget.style.boxShadow = `0 0 0 3px ${getBrandColor('secondaryBlue')}33`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>

        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: getBrandColor('deepNavy') }}
          >
            Cover Letter (Optional)
          </label>
          <textarea
            placeholder="Tell us why you'd like to join our team..."
            value={formData.coverLetter}
            onChange={(e) => handleInputChange('coverLetter', e.target.value)}
            rows={5}
            className="w-full px-4 py-2 rounded-md border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 resize-none"
            style={{
              borderColor: '#e5e7eb',
              color: getBrandColor('black'),
              backgroundColor: getBrandColor('white'),
              fontSize: '1rem',
              lineHeight: '1.5',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = getBrandColor('secondaryBlue');
              e.currentTarget.style.boxShadow = `0 0 0 3px ${getBrandColor('secondaryBlue')}33`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>

        <Button
          type="submit"
          variant="default"
          size="lg"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Application'}
        </Button>
      </form>
    </div>
  );
}

