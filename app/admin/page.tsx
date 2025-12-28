import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building2,
  Users,
  MessageSquare,
  User,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
  // Get platform stats
  const [
    businessCount,
    userCount,
    conversationCount,
    customerCount,
    activeBusinesses,
    totalMessages,
  ] = await Promise.all([
    db.business.count(),
    db.user.count(),
    db.conversation.count(),
    db.customer.count(),
    db.business.count({ where: { subscriptionStatus: "ACTIVE" } }),
    db.message.count(),
  ]);

  // Get recent businesses
  const recentBusinesses = await db.business.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          users: true,
          customers: true,
          conversations: true,
        },
      },
    },
  });

  const stats = [
    {
      label: "Total Businesses",
      value: businessCount,
      change: `${activeBusinesses} active`,
      icon: Building2,
      href: "/admin/businesses",
    },
    {
      label: "Total Users",
      value: userCount,
      change: "across all businesses",
      icon: Users,
      href: "/admin/users",
    },
    {
      label: "Total Conversations",
      value: conversationCount,
      change: `${totalMessages} messages`,
      icon: MessageSquare,
      href: "/admin/businesses",
    },
    {
      label: "Total Customers",
      value: customerCount,
      change: "all businesses",
      icon: User,
      href: "/admin/businesses",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Platform overview and management</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.label}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stat.value.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.change}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Recent Businesses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Businesses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentBusinesses.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No businesses yet
                </p>
              ) : (
                recentBusinesses.map((business) => (
                  <Link
                    key={business.id}
                    href={`/admin/businesses/${business.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{business.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {business._count.users} users •{" "}
                        {business._count.customers} customers •{" "}
                        {business._count.conversations} conversations
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(business.createdAt).toLocaleDateString()}
                    </span>
                  </Link>
                ))
              )}
              <Link
                href="/admin/businesses"
                className="block text-center text-sm text-primary hover:underline pt-2"
              >
                View all businesses →
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link
                href="/admin/businesses"
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <Building2 className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="font-medium">Manage Businesses</p>
                  <p className="text-sm text-muted-foreground">
                    View and edit all businesses
                  </p>
                </div>
              </Link>
              <Link
                href="/admin/users"
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <Users className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="font-medium">Manage Users</p>
                  <p className="text-sm text-muted-foreground">
                    View and manage all users
                  </p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
