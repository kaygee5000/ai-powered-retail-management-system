import React, { useState } from 'react';
import { 
  User, 
  Bell, 
  Database, 
  Shield, 
  Palette, 
  Globe,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'; // Removed SettingsIcon
import { useSettingsContext } from '../contexts/useSettingsContextHook'; // Updated import path
import { UserSettings } from '../hooks/useSettings'; // Import UserSettings
import { currencies, countries } from '../utils/currency';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  const {
    settings,
    loading,
    saving,
    // error, // Removed unused variable
    updateProfileData,
    updateNotificationPreferences,
    updateAISettings,
    updateSecuritySettings,
    updateAppearanceSettings
  } = useSettingsContext();

  const showSaveMessage = (type: 'success' | 'error', message: string) => {
    setSaveMessage({ type, message });
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'regional', label: 'Regional', icon: Globe },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'ai', label: 'AI Settings', icon: Database },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette }
  ];

  const handleProfileSave = async (formData: FormData) => {
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const role = formData.get('role') as string;

    const result = await updateProfileData({ name, phone, role });
    
    if (result.success) {
      showSaveMessage('success', 'Profile updated successfully!');
    } else {
      showSaveMessage('error', result.error || 'Failed to update profile');
    }
  };

  const handleNotificationToggle = async (key: string, value: boolean) => {
    const result = await updateNotificationPreferences({ [key]: value });
    
    if (!result.success) {
      showSaveMessage('error', result.error || 'Failed to update notifications');
    }
  };

  const handleAISettingChange = async <K extends keyof UserSettings['ai_settings']>(
    key: K,
    value: UserSettings['ai_settings'][K]
  ) => {
    const result = await updateAISettings({ [key]: value });
    
    if (!result.success) {
      showSaveMessage('error', result.error || 'Failed to update AI settings');
    }
  };

  const handleSecuritySettingChange = async <K extends keyof UserSettings['security_settings']>(
    key: K,
    value: UserSettings['security_settings'][K]
  ) => {
    const result = await updateSecuritySettings({ [key]: value });
    
    if (result.success) {
      showSaveMessage('success', 'Security settings updated!');
    } else {
      showSaveMessage('error', result.error || 'Failed to update security settings');
    }
  };

  const handleAppearanceChange = async <K extends keyof UserSettings['appearance_settings']>(
    key: K,
    value: UserSettings['appearance_settings'][K]
  ) => {
    const result = await updateAppearanceSettings({ [key]: value });
    
    if (result.success) {
      showSaveMessage('success', 'Appearance updated!');
    } else {
      showSaveMessage('error', result.error || 'Failed to update appearance');
    }
  };

  const renderProfileTab = () => (
    <form action={handleProfileSave} className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
          <input
            type="text"
            name="name"
            defaultValue={settings.profile_data.name}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
          <input
            type="tel"
            name="phone"
            defaultValue={settings.profile_data.phone}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
          <select
            name="role"
            defaultValue={settings.profile_data.role}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Store Owner">Store Owner</option>
            <option value="Manager">Manager</option>
            <option value="Assistant Manager">Assistant Manager</option>
            <option value="Staff">Staff</option>
          </select>
        </div>
      </div>

      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3">Change Password</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
            <input
              type="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter new password"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? 'Saving...' : 'Save Profile'}
      </button>
    </form>
  );

  const renderRegionalTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Regional Settings</h3>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
          <select
            value={settings.ai_settings.country}
            onChange={(e) => {
              const selectedCountry = countries.find(c => c.code === e.target.value);
              handleAISettingChange('country', e.target.value);
              // Auto-update currency when country changes
              if (selectedCountry) {
                handleAISettingChange('currency', selectedCountry.currency);
              }
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={saving}
          >
            {countries.map(country => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Your country affects default currency and regional settings</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
          <select
            value={settings.ai_settings.currency}
            onChange={(e) => handleAISettingChange('currency', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={saving}
          >
            {currencies.map(currency => (
              <option key={currency.code} value={currency.code}>
                {currency.symbol} {currency.name} ({currency.code})
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Currency used throughout the application for prices and sales</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
          <select
            value={settings.ai_settings.language}
            onChange={(e) => handleAISettingChange('language', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={saving}
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="it">Italian</option>
            <option value="pt">Portuguese</option>
            <option value="zh">Chinese</option>
            <option value="ja">Japanese</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
          <select
            value={settings.ai_settings.timezone}
            onChange={(e) => handleAISettingChange('timezone', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={saving}
          >
            <option value="Africa/Accra">Accra, Ghana (GMT+0)</option>
            <option value="America/New_York">Eastern Time (GMT-5)</option>
            <option value="America/Chicago">Central Time (GMT-6)</option>
            <option value="America/Denver">Mountain Time (GMT-7)</option>
            <option value="America/Los_Angeles">Pacific Time (GMT-8)</option>
            <option value="Europe/London">London (GMT+0)</option>
            <option value="Europe/Paris">Paris (GMT+1)</option>
            <option value="Europe/Berlin">Berlin (GMT+1)</option>
            <option value="Asia/Tokyo">Tokyo (GMT+9)</option>
            <option value="Asia/Shanghai">Shanghai (GMT+8)</option>
            <option value="Asia/Kolkata">Mumbai (GMT+5:30)</option>
            <option value="Australia/Sydney">Sydney (GMT+11)</option>
            <option value="Africa/Lagos">Lagos, Nigeria (GMT+1)</option>
            <option value="Africa/Cairo">Cairo, Egypt (GMT+2)</option>
            <option value="Africa/Johannesburg">Johannesburg, South Africa (GMT+2)</option>
          </select>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Preview</h4>
        <div className="space-y-1 text-sm text-blue-800">
          <p>Currency Format: <span className="font-mono">{currencies.find(c => c.code === settings.ai_settings.currency)?.symbol}1,234.56</span></p>
          <p>Country: <span className="font-medium">{countries.find(c => c.code === settings.ai_settings.country)?.name}</span></p>
          <p>Language: <span className="font-medium">{settings.ai_settings.language.toUpperCase()}</span></p>
        </div>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Notification Preferences</h3>
      
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Alert Notifications</h4>
        {[
          { key: 'lowStock', label: 'Low Stock Alerts', description: 'Get notified when items are running low' },
          { key: 'highSales', label: 'High Sales Activity', description: 'Alerts for unusual sales spikes' },
          { key: 'unusualActivity', label: 'Unusual Activity', description: 'Fraud detection and suspicious patterns' }
        ].map((item) => (
          <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h5 className="font-medium text-gray-900">{item.label}</h5>
              <p className="text-sm text-gray-600">{item.description}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notification_preferences[item.key as keyof typeof settings.notification_preferences] as boolean}
                onChange={(e) => handleNotificationToggle(item.key, e.target.checked)}
                className="sr-only peer"
                disabled={saving}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
            </label>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Report Notifications</h4>
        {[
          { key: 'dailyReports', label: 'Daily Reports', description: 'Automated daily summary reports' },
          { key: 'weeklyReports', label: 'Weekly Reports', description: 'Weekly performance analytics' }
        ].map((item) => (
          <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h5 className="font-medium text-gray-900">{item.label}</h5>
              <p className="text-sm text-gray-600">{item.description}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notification_preferences[item.key as keyof typeof settings.notification_preferences] as boolean}
                onChange={(e) => handleNotificationToggle(item.key, e.target.checked)}
                className="sr-only peer"
                disabled={saving}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
            </label>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Delivery Methods</h4>
        {[
          { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive notifications via email' },
          { key: 'smsNotifications', label: 'SMS Notifications', description: 'Receive notifications via text message' },
          { key: 'pushNotifications', label: 'Push Notifications', description: 'Browser and mobile push notifications' }
        ].map((item) => (
          <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h5 className="font-medium text-gray-900">{item.label}</h5>
              <p className="text-sm text-gray-600">{item.description}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notification_preferences[item.key as keyof typeof settings.notification_preferences] as boolean}
                onChange={(e) => handleNotificationToggle(item.key, e.target.changed)}
                className="sr-only peer"
                disabled={saving}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAITab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">AI Configuration</h3>
      
      <div className="grid md:grid-cols-1 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confidence Threshold ({settings.ai_settings.confidenceThreshold}%)
          </label>
          <input
            type="range"
            min="50"
            max="100"
            value={settings.ai_settings.confidenceThreshold}
            onChange={(e) => handleAISettingChange('confidenceThreshold', parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            disabled={saving}
          />
          <p className="text-xs text-gray-500 mt-1">Minimum confidence level for auto-processing reports</p>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">AI Features</h4>
        {[
          { key: 'autoProcessReports', label: 'Auto-Process Reports', description: 'Automatically process reports above confidence threshold' },
          { key: 'enableVoiceInput', label: 'Voice Input', description: 'Enable voice-to-text for report submission' }
        ].map((item) => (
          <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h5 className="font-medium text-gray-900">{item.label}</h5>
              <p className="text-sm text-gray-600">{item.description}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.ai_settings[item.key as keyof typeof settings.ai_settings] as boolean}
                onChange={(e) => handleAISettingChange(item.key, e.target.checked)}
                className="sr-only peer"
                disabled={saving}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Security Settings</h3>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Password Expiry (days)</label>
          <input
            type="number"
            value={settings.security_settings.passwordExpiry}
            onChange={(e) => handleSecuritySettingChange('passwordExpiry', parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={saving}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
          <input
            type="number"
            value={settings.security_settings.sessionTimeout}
            onChange={(e) => handleSecuritySettingChange('sessionTimeout', parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={saving}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Max Login Attempts</label>
          <input
            type="number"
            value={settings.security_settings.loginAttempts}
            onChange={(e) => handleSecuritySettingChange('loginAttempts', parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={saving}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Security Features</h4>
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h5 className="font-medium text-gray-900">Two-Factor Authentication</h5>
            <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.security_settings.twoFactorAuth}
              onChange={(e) => handleSecuritySettingChange('twoFactorAuth', e.target.checked)}
              className="sr-only peer"
              disabled={saving}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
          </label>
        </div>
      </div>
    </div>
  );

  const renderAppearanceTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Appearance Settings</h3>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
          <select
            value={settings.appearance_settings.theme}
            onChange={(e) => handleAppearanceChange('theme', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={saving}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
          <select
            value={settings.appearance_settings.primaryColor}
            onChange={(e) => handleAppearanceChange('primaryColor', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={saving}
          >
            <option value="blue">Blue</option>
            <option value="green">Green</option>
            <option value="purple">Purple</option>
            <option value="red">Red</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Layout Options</h4>
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h5 className="font-medium text-gray-900">Compact Mode</h5>
            <p className="text-sm text-gray-600">Use a more compact layout to fit more content</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.appearance_settings.compactMode}
              onChange={(e) => handleAppearanceChange('compactMode', e.target.checked)}
              className="sr-only peer"
              disabled={saving}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
          </label>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your account and application preferences</p>
        </div>
        {saveMessage && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            saveMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {saveMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span className="text-sm">{saveMessage.message}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-600 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  disabled={saving}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            {activeTab === 'profile' && renderProfileTab()}
            {activeTab === 'regional' && renderRegionalTab()}
            {activeTab === 'notifications' && renderNotificationsTab()}
            {activeTab === 'ai' && renderAITab()}
            {activeTab === 'security' && renderSecurityTab()}
            {activeTab === 'appearance' && renderAppearanceTab()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;