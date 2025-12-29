'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Plus, Clock, User } from 'lucide-react';

interface Appointment {
  id: string;
  serviceName: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: string;
  customer: { name: string | null; email: string | null };
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/appointments')
      .then(res => res.json())
      .then(data => {
        setAppointments(data.appointments || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const statusColors: Record<string, string> = {
    SCHEDULED: 'bg-blue-100 text-blue-700',
    CONFIRMED: 'bg-green-100 text-green-700',
    COMPLETED: 'bg-gray-100 text-gray-700',
    CANCELED: 'bg-red-100 text-red-700',
    NO_SHOW: 'bg-yellow-100 text-yellow-700',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-500 mt-1">Manage bookings and schedules</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Appointment
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading...</div>
      ) : appointments.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No appointments yet</h3>
            <p className="text-gray-500 mt-1">Appointments will appear here when customers book through the AI.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {appointments.map((apt) => (
            <Card key={apt.id} className="hover:shadow-md transition-shadow">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-green-100 p-2 rounded-full">
                      <Calendar className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">{apt.serviceName}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          {apt.customer?.name || apt.customer?.email || 'Unknown'}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {apt.duration} min
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-medium">{new Date(apt.startTime).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(apt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${statusColors[apt.status] || 'bg-gray-100'}`}>
                      {apt.status}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


