import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Users, Calendar, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  // In a real app, fetch analytics data from /api/analytics
  const metrics = {
    totalConversations: 142,
    activeConversations: 8,
    totalCustomers: 89,
    upcomingAppointments: 12,
  };

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
            <div className="text-2xl font-bold">{metrics.totalConversations}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.activeConversations} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              +12 this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.upcomingAppointments}</div>
            <p className="text-xs text-muted-foreground">
              upcoming this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98%</div>
            <p className="text-xs text-muted-foreground">
              +2% from last week
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
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Sarah Johnson</p>
                  <p className="text-sm text-muted-foreground">Asking about appointment availability</p>
                </div>
                <span className="text-sm text-muted-foreground">2m ago</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Mike Chen</p>
                  <p className="text-sm text-muted-foreground">Inquiry about services</p>
                </div>
                <span className="text-sm text-muted-foreground">15m ago</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Emily Rodriguez</p>
                  <p className="text-sm text-muted-foreground">Booking confirmation</p>
                </div>
                <span className="text-sm text-muted-foreground">1h ago</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Haircut - John Doe</p>
                  <p className="text-sm text-muted-foreground">Today at 2:00 PM</p>
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Confirmed</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Massage - Lisa White</p>
                  <p className="text-sm text-muted-foreground">Today at 4:30 PM</p>
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Confirmed</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Consultation - David Lee</p>
                  <p className="text-sm text-muted-foreground">Tomorrow at 10:00 AM</p>
                </div>
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">Pending</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
