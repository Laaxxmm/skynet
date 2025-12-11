
import React, { useState } from 'react';
import { Save, Bell, Mail, Smartphone, Key, Globe } from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsProps {
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
}

export const Settings: React.FC<SettingsProps> = ({ settings, onSave }) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [saved, setSaved] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-center mb-6 border-b border-slate-100 pb-4">
          <div className="p-2 bg-indigo-50 rounded-lg mr-4">
             <Bell className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Notification Settings</h2>
            <p className="text-slate-500 text-sm">Configure WhatsApp and Email alerts for expiring agreements.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* WhatsApp Configuration */}
          <div>
            <h3 className="text-sm uppercase tracking-wide text-slate-400 font-bold mb-4 flex items-center">
              <Smartphone className="w-4 h-4 mr-2" /> WhatsApp API Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">API Endpoint URL</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    name="waApiUrl"
                    value={formData.waApiUrl}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="https://flyencart.in/api/send"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Instance ID</label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    name="waInstanceId"
                    value={formData.waInstanceId}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Access Token</label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    name="waAccessToken"
                    value={formData.waAccessToken}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div>
             <h3 className="text-sm uppercase tracking-wide text-slate-400 font-bold mb-4 flex items-center">
              <Mail className="w-4 h-4 mr-2" /> Notification Recipients
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Admin Email Address</label>
                <input
                  type="email"
                  name="adminEmail"
                  value={formData.adminEmail}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="admin@skynet.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Admin Phone (WhatsApp)</label>
                <input
                  type="text"
                  name="adminPhone"
                  value={formData.adminPhone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="919876543210"
                />
                <p className="text-xs text-slate-400 mt-1">Include country code (e.g. 91 for India) without + sign.</p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-end">
            {saved && <span className="text-green-600 font-medium mr-4 text-sm animate-fade-in">Settings Saved Successfully!</span>}
            <button 
              type="submit"
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center"
            >
              <Save className="w-4 h-4 mr-2" /> Save Configuration
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
