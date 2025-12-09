'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { apiService } from '@/lib/api';
import { toast } from 'sonner';
import {
  Clock,
  Coffee,
  Plus,
  Trash2,
  Save,
  Loader2,
  Calendar
} from 'lucide-react';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Monday', short: 'Mon' },
  { value: 1, label: 'Tuesday', short: 'Tue' },
  { value: 2, label: 'Wednesday', short: 'Wed' },
  { value: 3, label: 'Thursday', short: 'Thu' },
  { value: 4, label: 'Friday', short: 'Fri' },
  { value: 5, label: 'Saturday', short: 'Sat' },
  { value: 6, label: 'Sunday', short: 'Sun' }
];

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hours = Math.floor(i / 2);
  const minutes = (i % 2) * 30;
  const time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  return { value: time, label: time };
});

interface AvailabilitySlot {
  id?: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export default function AvailabilityManager() {
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [defaultBreakMinutes, setDefaultBreakMinutes] = useState<number>(5);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New slot form state
  const [newSlot, setNewSlot] = useState<AvailabilitySlot>({
    day_of_week: 0,
    start_time: '09:00',
    end_time: '17:00',
    is_active: true
  });

  useEffect(() => {
    loadAvailability();
  }, []);

  const loadAvailability = async () => {
    try {
      setLoading(true);
      const [availability, breakSettings] = await Promise.all([
        apiService.getMyAvailability().catch(() => []),
        apiService.getBreakSettings().catch(() => ({ default_break_minutes: 5 }))
      ]);

      setAvailabilitySlots(availability || []);
      setDefaultBreakMinutes(breakSettings.default_break_minutes || 5);
    } catch (error) {
      toast.error('Failed to load availability settings');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlot = async () => {
    // Validate
    if (newSlot.start_time >= newSlot.end_time) {
      toast.error('Start time must be before end time');
      return;
    }

    try {
      setSaving(true);
      const result = await apiService.createMyAvailability({
        day_of_week: newSlot.day_of_week,
        start_time: newSlot.start_time,
        end_time: newSlot.end_time,
        is_active: true
      });

      setAvailabilitySlots([...availabilitySlots, result]);
      toast.success('Availability slot added');

      // Reset form to next day
      setNewSlot({
        ...newSlot,
        day_of_week: (newSlot.day_of_week + 1) % 7
      });
    } catch (error) {
      toast.error('Failed to add availability slot');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSlot = async (slotId: number) => {
    try {
      await apiService.deleteMyAvailability(slotId);
      setAvailabilitySlots(availabilitySlots.filter(s => s.id !== slotId));
      toast.success('Availability slot removed');
    } catch (error) {
      toast.error('Failed to remove availability slot');
    }
  };

  const handleToggleSlot = async (slot: AvailabilitySlot) => {
    if (!slot.id) return;

    try {
      await apiService.updateMyAvailability(slot.id, { is_active: !slot.is_active });
      setAvailabilitySlots(availabilitySlots.map(s =>
        s.id === slot.id ? { ...s, is_active: !s.is_active } : s
      ));
      toast.success(`Slot ${slot.is_active ? 'disabled' : 'enabled'}`);
    } catch (error) {
      toast.error('Failed to update slot');
    }
  };

  const handleBreakChange = async (minutes: number) => {
    try {
      await apiService.updateBreakSettings(minutes);
      setDefaultBreakMinutes(minutes);
      toast.success('Break settings updated');
    } catch (error) {
      toast.error('Failed to update break settings');
    }
  };

  const handleSetupWeeklySchedule = async () => {
    // Quick setup for common work week schedule
    const weekdaySlots = DAYS_OF_WEEK.slice(0, 5).map(day => ({
      day_of_week: day.value,
      start_time: '09:00',
      end_time: '17:00',
      is_active: true
    }));

    try {
      setSaving(true);
      await apiService.clearAllAvailability();
      const result = await apiService.createBulkAvailability(weekdaySlots);
      setAvailabilitySlots(result);
      toast.success('Weekly schedule set up (Mon-Fri, 9am-5pm)');
    } catch (error) {
      toast.error('Failed to set up weekly schedule');
    } finally {
      setSaving(false);
    }
  };

  const groupedSlots = DAYS_OF_WEEK.map(day => ({
    ...day,
    slots: availabilitySlots.filter(s => s.day_of_week === day.value)
  }));

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Break Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coffee className="w-5 h-5" />
            Break Settings
          </CardTitle>
          <CardDescription>
            Set your default break time between lessons
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Label htmlFor="break-time">Default break between lessons:</Label>
            <Select
              value={defaultBreakMinutes.toString()}
              onValueChange={(v) => handleBreakChange(parseInt(v))}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">No break</SelectItem>
                <SelectItem value="5">5 minutes</SelectItem>
                <SelectItem value="10">10 minutes</SelectItem>
                <SelectItem value="15">15 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Availability */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Weekly Availability
              </CardTitle>
              <CardDescription>
                Set your regular available hours for each day of the week
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={handleSetupWeeklySchedule}
              disabled={saving}
            >
              Quick Setup (Mon-Fri 9-5)
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add New Slot Form */}
          <div className="p-4 border rounded-lg bg-gray-50 space-y-4">
            <h3 className="font-medium">Add Availability Slot</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Day</Label>
                <Select
                  value={newSlot.day_of_week.toString()}
                  onValueChange={(v) => setNewSlot({ ...newSlot, day_of_week: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map(day => (
                      <SelectItem key={day.value} value={day.value.toString()}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={newSlot.start_time}
                  onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
                />
              </div>
              <div>
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={newSlot.end_time}
                  onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleAddSlot} disabled={saving} className="w-full">
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Add Slot
                </Button>
              </div>
            </div>
          </div>

          {/* Weekly Schedule Display */}
          <div className="space-y-2">
            {groupedSlots.map(day => (
              <div key={day.value} className="flex items-start gap-4 p-3 border rounded-lg">
                <div className="w-24 font-medium text-gray-700">{day.label}</div>
                <div className="flex-1">
                  {day.slots.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {day.slots.map(slot => (
                        <div
                          key={slot.id}
                          className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                            slot.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>{slot.start_time} - {slot.end_time}</span>
                          <Switch
                            checked={slot.is_active}
                            onCheckedChange={() => handleToggleSlot(slot)}
                            className="h-4 w-7"
                          />
                          <button
                            onClick={() => slot.id && handleDeleteSlot(slot.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">No availability set</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
