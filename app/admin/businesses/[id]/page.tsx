'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, Building2, Users, MessageSquare, User, Calendar, Phone, Clock, Eye } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { CallLogDetails } from '@/components/CallLogDetails';

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
  const [calls, setCalls] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'calls' | 'appointments'>('overview');
  const [callsLoading, setCallsLoading] = useState(false);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [callDetailsOpen, setCallDetailsOpen] = useState(false);
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

  const fetchBusiness = useCallback(async () => {
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
  }, [params.id, router]);

  const fetchCalls = useCallback(async () => {
    if (!params.id) return;
    setCallsLoading(true);
    try {
      const res = await fetch(`/api/admin/calls?businessId=${params.id}&limit=50`);
      if (!res.ok) throw new Error('Failed to fetch calls');
      
      const data = await res.json();
      setCalls(data.data || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load calls');
    } finally {
      setCallsLoading(false);
    }
  }, [params.id]);

  const fetchAppointments = useCallback(async () => {
    if (!params.id) return;
    setAppointmentsLoading(true);
    try {
      const res = await fetch(`/api/admin/appointments?businessId=${params.id}&limit=50`);
      if (!res.ok) throw new Error('Failed to fetch appointments');
      
      const data = await res.json();
      setAppointments(data.data || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load appointments');
    } finally {
      setAppointmentsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchBusiness();
  }, [fetchBusiness]);

  useEffect(() => {
    if (activeTab === 'calls' && calls.length === 0) {
      fetchCalls();
    }
  }, [activeTab, calls.length, fetchCalls]);

  useEffect(() => {
    if (activeTab === 'appointments' && appointments.length === 0) {
      fetchAppointments();
    }
  }, [activeTab, appointments.length, fetchAppointments]);

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
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('calls')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'calls'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Call Logs ({business?._count.conversations || 0})
              </button>
              <button
                onClick={() => setActiveTab('appointments')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'appointments'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Appointments ({business?._count.appointments || 0})
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <>
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
            </>
          )}

          {activeTab === 'calls' && (
            <Card>
              <CardHeader>
                <CardTitle>Call Logs</CardTitle>
              </CardHeader>
              <CardContent>
                {callsLoading ? (
                  <div className="text-center py-4">Loading calls...</div>
                ) : calls.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Phone className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No call logs found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {calls.map((call) => (
                      <div key={call.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4 flex-1">
                            <div className="bg-green-100 h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0">
                              <Phone className="h-5 w-5 text-green-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium truncate">
                                  {call.customer?.name || call.customerName || 'Unknown Customer'}
                                </p>
                                <span className={`text-xs px-2 py-1 rounded ${
                                  call.status === 'ended' ? 'bg-green-100 text-green-700' :
                                  call.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                                  call.status === 'failed' ? 'bg-red-100 text-red-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {call.status || 'unknown'}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500 mb-2">
                                {call.customer?.phone || call.phoneNumber || 'No phone number'}
                              </p>
                              <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{call.startedAt ? new Date(call.startedAt).toLocaleString() : 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>
                                    {call.duration ? `${Math.floor(call.duration / 60)}m ${Math.floor(call.duration % 60)}s` : 'N/A'}
                                  </span>
                                </div>
                              </div>
                              {call.type && (
                                <div className="mt-2">
                                  <span className="text-xs text-gray-500">Type: </span>
                                  <span className="text-xs font-medium capitalize">{call.type}</span>
                                </div>
                              )}
                              {call.cost !== undefined && (
                                <div className="mt-1">
                                  <span className="text-xs text-gray-500">Cost: </span>
                                  <span className="text-xs font-medium">${call.cost.toFixed(4)}</span>
                                </div>
                              )}
                              {call.transcript && (
                                <div className="mt-2">
                                  <p className="text-xs text-gray-600 line-clamp-2">
                                    {call.transcript}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedCallId(call.id);
                              setCallDetailsOpen(true);
                            }}
                            className="flex-shrink-0"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'appointments' && (
            <Card>
              <CardHeader>
                <CardTitle>Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                {appointmentsLoading ? (
                  <div className="text-center py-4">Loading appointments...</div>
                ) : appointments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No appointments found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appointments.map((appointment) => (
                      <div key={appointment.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="bg-blue-100 h-10 w-10 rounded-full flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{appointment.customer?.name || 'Unknown Customer'}</p>
                            <p className="text-sm text-gray-500">{appointment.service?.name || 'Service'}</p>
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(appointment.startTime).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-xs px-2 py-1 rounded ${
                            appointment.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                            appointment.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' :
                            appointment.status === 'COMPLETED' ? 'bg-gray-100 text-gray-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {appointment.status}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {appointment.duration} min
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
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

      {/* Call Details Dialog */}
      <CallLogDetails
        callId={selectedCallId}
        open={callDetailsOpen}
        onOpenChange={setCallDetailsOpen}
      />
    </div>
  );
}

