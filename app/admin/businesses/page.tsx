'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2, Search, Plus, Edit, Trash2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Business {
  id: string;
  name: string;
  slug: string;
  industry: string;
  email: string | null;
  phone: string | null;
  subscriptionTier: string;
  subscriptionStatus: string;
  createdAt: string;
  _count: {
    users: number;
    customers: number;
    conversations: number;
    integrations: number;
  };
}

export default function AdminBusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchBusinesses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (search) params.append('search', search);
      if (industryFilter) params.append('industry', industryFilter);
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`/api/admin/businesses?${params}`);
      if (!res.ok) throw new Error('Failed to fetch businesses');
      
      const data = await res.json();
      setBusinesses(data.data || []);
      setTotalPages(data.meta?.totalPages || 1);
      setTotal(data.meta?.total || 0);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load businesses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, [page, search, industryFilter, statusFilter]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/businesses/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete business');
      
      toast.success('Business deleted successfully');
      fetchBusinesses();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete business');
    }
  };

  const industries = ['MEDSPA', 'SALON', 'DENTAL', 'FITNESS', 'HEALTHCARE', 'HOME_SERVICES', 'OTHER'];
  const statuses = ['TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Businesses</h1>
          <p className="text-gray-500 mt-1">Manage all businesses on the platform</p>
        </div>
        <Button onClick={() => toast.info('Create business functionality coming soon')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Business
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search businesses..."
            className="pl-10"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={industryFilter}
          onChange={(e) => {
            setIndustryFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Industries</option>
          {industries.map((ind) => (
            <option key={ind} value={ind}>
              {ind}
            </option>
          ))}
        </select>
        <select
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Statuses</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{total}</div>
            <p className="text-sm text-muted-foreground">Total Businesses</p>
          </CardContent>
        </Card>
      </div>

      {/* Business List */}
      {loading ? (
        <div className="text-center py-10">Loading...</div>
      ) : businesses.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No businesses found</h3>
            <p className="text-gray-500 mt-1">
              {search || industryFilter || statusFilter
                ? 'Try adjusting your filters'
                : 'No businesses have been created yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4">
            {businesses.map((business) => (
              <Card key={business.id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="bg-blue-100 h-12 w-12 rounded-lg flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <p className="font-medium text-lg">{business.name}</p>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {business.industry}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              business.subscriptionStatus === 'ACTIVE'
                                ? 'bg-green-100 text-green-700'
                                : business.subscriptionStatus === 'TRIALING'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {business.subscriptionStatus}
                          </span>
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                            {business.subscriptionTier}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>{business._count.users} users</span>
                          <span>•</span>
                          <span>{business._count.customers} customers</span>
                          <span>•</span>
                          <span>{business._count.conversations} conversations</span>
                          <span>•</span>
                          <span>{business._count.integrations} integrations</span>
                          {business.email && (
                            <>
                              <span>•</span>
                              <span>{business.email}</span>
                            </>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Created {new Date(business.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/businesses/${business.id}`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(business.id, business.name)}
                        className="text-red-600 hover:text-red-700 hover:border-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}


