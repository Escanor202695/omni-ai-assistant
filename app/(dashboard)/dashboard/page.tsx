"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Users, Calendar, TrendingUp } from 'lucide-react';

interface DashboardMetrics {
  summary: {
    totalCustomers: number;
    totalConversations: number;
    activeConversations: number;
    totalAppointments: number;
    upcomingAppointments: number;
    recentConversations: number;
    recentAppointments: number;
  };
  trends: {
    conversations: any[];
    appointments: any[];
  };
}

interface Conversation {
  id: string;
  customer: { name: string | null; email: string | null };
  messages: Array<{ content: string; role: string }>;
  updatedAt: string;
}

interface Appointment {
  id: string;
  serviceName: string;
  startTime: string;
  status: string;
  customer: { name: string | null; email: string | null };
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentConversations, setRecentConversations] = useState<Conversation[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [analyticsRes, conversationsRes, appointmentsRes] = await Promise.all([
          fetch('/api/analytics'),
          fetch('/api/conversations?page=1&limit=3'),
          fetch('/api/appointments?page=1&limit=3&status=SCHEDULED,CONFIRMED'),
        ]);

        const [analyticsData, conversationsData, appointmentsData] = await Promise.all([
          analyticsRes.json(),
          conversationsRes.json(),
          appointmentsRes.json(),
        ]);

        setMetrics(analyticsData);
        setRecentConversations(conversationsData.data || []);
        setUpcomingAppointments(appointmentsData.data || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statusColors: Record<string, string> = {
    SCHEDULED: 'bg-blue-100 text-blue-700',
    CONFIRMED: 'bg-green-100 text-green-700',
    COMPLETED: 'bg-gray-100 text-gray-700',
    CANCELED: 'bg-red-100 text-red-700',
    NO_SHOW: 'bg-yellow-100 text-yellow-700',
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Overview</h1>
          <p className="text-gray-500 mt-1">Loading dashboard data...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="py-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Overview</h1>
        <p className="text-gray-500 mt-1">Welcome back! Here's your business overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.summary.totalConversations || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.summary.activeConversations || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.summary.totalCustomers || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{metrics?.summary.recentConversations || 0} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.summary.upcomingAppointments || 0}</div>
            <p className="text-xs text-muted-foreground">
              upcoming this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.summary.totalAppointments || 0}</div>
            <p className="text-xs text-muted-foreground">
              all time
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            {recentConversations.length === 0 ? (
              <p className="text-muted-foreground text-sm">No recent conversations</p>
            ) : (
              <div className="space-y-4">
                {recentConversations.map((conversation) => (
                  <div key={conversation.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {conversation.customer?.name || conversation.customer?.email || 'Unknown Customer'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {conversation.messages[0]?.content?.substring(0, 50) || 'No messages yet'}...
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(conversation.updatedAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length === 0 ? (
              <p className="text-muted-foreground text-sm">No upcoming appointments</p>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {appointment.serviceName} - {appointment.customer?.name || appointment.customer?.email || 'Unknown'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(appointment.startTime).toLocaleDateString()} at{' '}
                        {new Date(appointment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${statusColors[appointment.status] || 'bg-gray-100'}`}>
                      {appointment.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
