import React, { useState } from 'react';
import { Building2, ArrowRight } from 'lucide-react';
import { BusinessType } from '../types';

interface CompanySetupProps {
  businessType: BusinessType;
  onCompanySetup: (companyName: string, industry: string) => void;
}

const CompanySetup: React.FC<CompanySetupProps> = ({ businessType, onCompanySetup }) => {
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCompanySetup(companyName, industry);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F5F5] via-[#DDDDDD] to-[#1A1A1A] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[#2D89C7] to-[#7D3083] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-[#1A1A1A] mb-3">Company Setup</h2>
          <p className="text-lg text-[#2D89C7]">Tell us about your company to personalize your experience</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">Company Name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-4 py-4 border border-[#DDDDDD] rounded-xl focus:ring-2 focus:ring-[#2D89C7] focus:border-transparent transition-all duration-200 text-lg"
              placeholder="Enter your company name"
              required
            />
          </div>

          {/* Industry selection only for marketing and both */}
          {(businessType === 'marketing' || businessType === 'both') && (
            <div>
              <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">Industry</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-4 py-4 border border-[#DDDDDD] rounded-xl focus:ring-2 focus:ring-[#2D89C7] focus:border-transparent transition-all duration-200 text-lg"
                required
              >
                <option value="">Select your industry</option>
                <option value="technology">Technology</option>
                <option value="retail">Retail</option>
                <option value="finance">Finance</option>
                <option value="healthcare">Healthcare</option>
                <option value="manufacturing">Manufacturing</option>
                <option value="education">Education</option>
                <option value="consulting">Consulting</option>
                <option value="other">Other</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#2D89C7] to-[#7D3083] text-white py-4 px-6 rounded-xl font-semibold hover:from-[#1A1A1A] hover:to-[#2D89C7] transition-all duration-200 text-lg shadow-lg hover:shadow-xl"
          >
            Continue
            <ArrowRight className="inline-block ml-2 h-5 w-5" />
          </button>
        </form>
        
        <div className="mt-8 text-center">
          <p className="text-sm text-[#2D89C7]">
            Your data is secure and will only be used to customize your analytics experience
          </p>
        </div>
      </div>
    </div>
  );
};

export default CompanySetup; 