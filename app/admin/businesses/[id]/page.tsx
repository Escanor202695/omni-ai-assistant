'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, Building2, Users, MessageSquare, User, Calendar } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Business {
  id: string;
  name: string;
  slug: string;
  industry: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  subscriptionTier: string;
  subscriptionStatus: string;
  messagesLimit: number;
  voiceMinutesLimit: number;
  createdAt: string;
  _count: {
    users: number;
    customers: number;
    conversations: number;
    integrations: number;
    appointments: number;
    services: number;
    knowledgeDocs: number;
  };
  users: Array<{
    id: string;
    email: string;
    name: string | null;
    role: string;
    createdAt: string;
  }>;
}

export default function BusinessDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    industry: '',
    email: '',
    phone: '',
    website: '',
    subscriptionTier: '',
    subscriptionStatus: '',
    messagesLimit: 1000,
    voiceMinutesLimit: 100,
  });

  useEffect(() => {
    fetchBusiness();
  }, [params.id]);

  const fetchBusiness = async () => {
    try {
      const res = await fetch(`/api/admin/businesses/${params.id}`);
      if (!res.ok) throw new Error('Failed to fetch business');
      
      const data = await res.json();
      setBusiness(data);
      setFormData({
        name: data.name || '',
        slug: data.slug || '',
        industry: data.industry || '',
        email: data.email || '',
        phone: data.phone || '',
        website: data.website || '',
        subscriptionTier: data.subscriptionTier || '',
        subscriptionStatus: data.subscriptionStatus || '',
        messagesLimit: data.messagesLimit || 1000,
        voiceMinutesLimit: data.voiceMinutesLimit || 100,
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to load business');
      router.push('/admin/businesses');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/businesses/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          email: formData.email || null,
          phone: formData.phone || null,
          website: formData.website || null,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update business');
      }

      const updated = await res.json();
      setBusiness(updated);
      toast.success('Business updated successfully');
      fetchBusiness();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update business');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  if (!business) {
    return null;
  }

  const industries = ['MEDSPA', 'SALON', 'DENTAL', 'FITNESS', 'HEALTHCARE', 'HOME_SERVICES', 'OTHER'];
  const tiers = ['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'];
  const statuses = ['TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/businesses">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{business.name}</h1>
            <p className="text-gray-500 mt-1">Business details and settings</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Business Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Slug</label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Industry</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                >
                  {industries.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Website</label>
                <Input
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Subscription & Limits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Subscription Tier</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.subscriptionTier}
                    onChange={(e) => setFormData({ ...formData, subscriptionTier: e.target.value })}
                  >
                    {tiers.map((tier) => (
                      <option key={tier} value={tier}>
                        {tier}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.subscriptionStatus}
                    onChange={(e) => setFormData({ ...formData, subscriptionStatus: e.target.value })}
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Messages Limit</label>
                  <Input
                    type="number"
                    value={formData.messagesLimit}
                    onChange={(e) => setFormData({ ...formData, messagesLimit: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Voice Minutes Limit</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.voiceMinutesLimit}
                    onChange={(e) => setFormData({ ...formData, voiceMinutesLimit: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Users</span>
                </div>
                <span className="font-medium">{business._count.users}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Customers</span>
                </div>
                <span className="font-medium">{business._count.customers}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Conversations</span>
                </div>
                <span className="font-medium">{business._count.conversations}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Appointments</span>
                </div>
                <span className="font-medium">{business._count.appointments}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Integrations</span>
                </div>
                <span className="font-medium">{business._count.integrations}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {business.users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                    <div>
                      <p className="font-medium text-sm">{user.name || user.email}</p>
                      <p className="text-xs text-gray-500">{user.role}</p>
                    </div>
                  </div>
                ))}
                {business.users.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-2">No users</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


