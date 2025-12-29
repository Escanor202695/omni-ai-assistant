'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Save, Loader2, Plus, X, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface TimeSlot {
  open: string;
  close: string;
}

interface BusinessHours {
  [key: string]: TimeSlot | null;
}

const DAYS = [
  { key: 'monday', label: 'Monday', short: 'Mon' },
  { key: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { key: 'thursday', label: 'Thursday', short: 'Thu' },
  { key: 'friday', label: 'Friday', short: 'Fri' },
  { key: 'saturday', label: 'Saturday', short: 'Sat' },
  { key: 'sunday', label: 'Sunday', short: 'Sun' },
];

const TIME_OPTIONS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
  '22:00', '22:30', '23:00',
];

const DEFAULT_HOURS: BusinessHours = {
  monday: { open: '09:00', close: '17:00' },
  tuesday: { open: '09:00', close: '17:00' },
  wednesday: { open: '09:00', close: '17:00' },
  thursday: { open: '09:00', close: '17:00' },
  friday: { open: '09:00', close: '17:00' },
  saturday: null,
  sunday: null,
};

export default function BusinessHoursPage() {
  const [hours, setHours] = useState<BusinessHours>(DEFAULT_HOURS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.business?.businessHours) {
          setHours(data.business.businessHours);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/businesses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessHours: hours }),
      });
      
      if (res.ok) {
        toast.success('Business hours saved!');
      } else {
        toast.error('Failed to save hours');
      }
    } catch {
      toast.error('Failed to save hours');
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (day: string) => {
    setHours(prev => ({
      ...prev,
      [day]: prev[day] ? null : { open: '09:00', close: '17:00' },
    }));
  };

  const updateTime = (day: string, field: 'open' | 'close', value: string) => {
    setHours(prev => ({
      ...prev,
      [day]: prev[day] ? { ...prev[day]!, [field]: value } : null,
    }));
  };

  const copyToAllDays = (sourceDay: string) => {
    const sourceHours = hours[sourceDay];
    if (!sourceHours) return;

    setHours(prev => {
      const updated = { ...prev };
      DAYS.forEach(day => {
        if (day.key !== sourceDay) {
          updated[day.key] = { ...sourceHours };
        }
      });
      return updated;
    });
    toast.success('Hours copied to all days');
  };

  const copyToWeekdays = (sourceDay: string) => {
    const sourceHours = hours[sourceDay];
    if (!sourceHours) return;

    setHours(prev => {
      const updated = { ...prev };
      ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach(day => {
        if (day !== sourceDay) {
          updated[day] = { ...sourceHours };
        }
      });
      return updated;
    });
    toast.success('Hours copied to weekdays');
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Business Hours</h1>
          <p className="text-gray-500 mt-1">Set your operating hours for AI and booking availability</p>
        </div>
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Hours'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2 text-blue-500" />
            Weekly Schedule
          </CardTitle>
          <CardDescription>Toggle days on/off and set open/close times</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {DAYS.map((day) => {
              const dayHours = hours[day.key];
              const isOpen = !!dayHours;

              return (
                <div
                  key={day.key}
                  className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                    isOpen ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  {/* Day Toggle */}
                  <button
                    onClick={() => toggleDay(day.key)}
                    className={`w-24 py-2 rounded-lg font-medium transition-all ${
                      isOpen
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {day.short}
                  </button>

                  {isOpen ? (
                    <>
                      {/* Open Time */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Open:</span>
                        <select
                          value={dayHours.open}
                          onChange={(e) => updateTime(day.key, 'open', e.target.value)}
                          className="px-3 py-2 border rounded-lg text-sm"
                        >
                          {TIME_OPTIONS.map(time => (
                            <option key={time} value={time}>{formatTime(time)}</option>
                          ))}
                        </select>
                      </div>

                      {/* Close Time */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Close:</span>
                        <select
                          value={dayHours.close}
                          onChange={(e) => updateTime(day.key, 'close', e.target.value)}
                          className="px-3 py-2 border rounded-lg text-sm"
                        >
                          {TIME_OPTIONS.map(time => (
                            <option key={time} value={time}>{formatTime(time)}</option>
                          ))}
                        </select>
                      </div>

                      {/* Copy Actions */}
                      <div className="ml-auto flex items-center gap-2">
                        <button
                          onClick={() => copyToWeekdays(day.key)}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          title="Copy to weekdays"
                        >
                          <Copy className="h-3 w-3" />
                          Weekdays
                        </button>
                        <button
                          onClick={() => copyToAllDays(day.key)}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          title="Copy to all days"
                        >
                          <Copy className="h-3 w-3" />
                          All
                        </button>
                      </div>
                    </>
                  ) : (
                    <span className="text-gray-400 italic">Closed</span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => setHours(DEFAULT_HOURS)}
          >
            Set Standard Hours (9-5 M-F)
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const allOpen: BusinessHours = {};
              DAYS.forEach(day => {
                allOpen[day.key] = { open: '09:00', close: '17:00' };
              });
              setHours(allOpen);
            }}
          >
            Open 7 Days
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const allClosed: BusinessHours = {};
              DAYS.forEach(day => {
                allClosed[day.key] = null;
              });
              setHours(allClosed);
            }}
          >
            Clear All
          </Button>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Hours Preview</CardTitle>
          <CardDescription>How your hours will appear to customers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-1 font-mono bg-gray-50 p-4 rounded-lg">
            {DAYS.map(day => {
              const dayHours = hours[day.key];
              return (
                <div key={day.key} className="flex justify-between">
                  <span className={dayHours ? 'text-gray-900' : 'text-gray-400'}>
                    {day.label}:
                  </span>
                  <span className={dayHours ? 'text-green-600' : 'text-red-500'}>
                    {dayHours 
                      ? `${formatTime(dayHours.open)} - ${formatTime(dayHours.close)}`
                      : 'Closed'
                    }
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

