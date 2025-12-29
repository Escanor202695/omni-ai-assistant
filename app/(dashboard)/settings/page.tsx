'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Settings, Save, Building, Bot, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Business } from '@/types';

export default function SettingsPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        setBusiness(data.business);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!business) return;
    setSaving(true);
    
    try {
      const res = await fetch('/api/businesses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(business),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success('Settings saved!');
        // Update local state with saved data
        setBusiness(data.business);
      } else {
        console.error('Save failed:', data);
        toast.error(data.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading settings...</div>;
  }

  if (!business) {
    return <div className="text-center py-10">Unable to load settings</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1">Configure your business and AI assistant</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="h-5 w-5 mr-2" />
              Business Information
            </CardTitle>
            <CardDescription>Basic details about your business</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Business Name</label>
                <Input 
                  value={business.name} 
                  onChange={(e) => setBusiness({ ...business, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input 
                  type="email"
                  value={business.email || ''} 
                  onChange={(e) => setBusiness({ ...business, email: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input 
                  value={business.phone || ''} 
                  onChange={(e) => setBusiness({ ...business, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Website</label>
                <Input 
                  value={business.website || ''} 
                  onChange={(e) => setBusiness({ ...business, website: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Address</label>
              <Input 
                value={business.address || ''} 
                onChange={(e) => setBusiness({ ...business, address: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bot className="h-5 w-5 mr-2" />
              AI Configuration
            </CardTitle>
            <CardDescription>Customize how your AI assistant behaves</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">AI Personality</label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={business.aiPersonality}
                onChange={(e) => setBusiness({ ...business, aiPersonality: e.target.value })}
              >
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="casual">Casual</option>
                <option value="formal">Formal</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Greeting Message</label>
              <Input 
                placeholder="Hi! How can I help you today?"
                value={business.aiGreeting || ''} 
                onChange={(e) => setBusiness({ ...business, aiGreeting: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Custom Instructions</label>
              <textarea 
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Add any specific instructions for your AI assistant..."
                value={business.aiInstructions || ''} 
                onChange={(e) => setBusiness({ ...business, aiInstructions: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Services Offered</label>
              <textarea 
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="e.g., Haircuts ($30), Massage ($80), Facials ($60)\nDescribe your services and pricing for the AI to reference"
                value={business.servicesOffered || ''} 
                onChange={(e) => setBusiness({ ...business, servicesOffered: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Business Hours</label>
              <textarea 
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="e.g., Mon-Fri 9AM-6PM, Sat 10AM-4PM, Closed Sunday"
                value={business.businessHoursText || ''} 
                onChange={(e) => setBusiness({ ...business, businessHoursText: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Timezone
            </CardTitle>
            <CardDescription>Set your business timezone for appointments</CardDescription>
          </CardHeader>
          <CardContent>
            <select 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={business.timezone}
              onChange={(e) => setBusiness({ ...business, timezone: e.target.value })}
            >
              <option value="America/New_York">Eastern Time (US)</option>
              <option value="America/Chicago">Central Time (US)</option>
              <option value="America/Denver">Mountain Time (US)</option>
              <option value="America/Los_Angeles">Pacific Time (US)</option>
              <option value="Europe/London">London (UK)</option>
              <option value="Europe/Paris">Paris (EU)</option>
              <option value="Asia/Tokyo">Tokyo (Japan)</option>
              <option value="Asia/Singapore">Singapore</option>
              <option value="Asia/Kolkata">India (IST)</option>
              <option value="Australia/Sydney">Sydney (Australia)</option>
            </select>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

