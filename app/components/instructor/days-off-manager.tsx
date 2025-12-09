'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { apiService } from '@/lib/api';
import { toast } from 'sonner';
import {
  CalendarOff,
  Plus,
  Trash2,
  Loader2,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { format, addMonths, isSameDay } from 'date-fns';

interface Exception {
  id?: number;
  exception_date: string;
  is_full_day: boolean;
  start_time?: string;
  end_time?: string;
  reason?: string;
}

export default function DaysOffManager() {
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New exception form
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isFullDay, setIsFullDay] = useState(true);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [reason, setReason] = useState('');

  // Calendar view state
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    loadExceptions();
  }, []);

  const loadExceptions = async () => {
    try {
      setLoading(true);
      const fromDate = format(new Date(), "yyyy-MM-dd'T'00:00:00");
      const toDate = format(addMonths(new Date(), 6), "yyyy-MM-dd'T'00:00:00");
      const data = await apiService.getMyExceptions(fromDate, toDate);
      setExceptions(data || []);
    } catch (error) {
      toast.error('Failed to load days off');
    } finally {
      setLoading(false);
    }
  };

  const handleAddException = async () => {
    if (!selectedDate) {
      toast.error('Please select a date');
      return;
    }

    if (!isFullDay && startTime >= endTime) {
      toast.error('Start time must be before end time');
      return;
    }

    try {
      setSaving(true);

      const exceptionData = {
        exception_date: format(selectedDate, 'yyyy-MM-dd'),
        is_full_day: isFullDay,
        start_time: isFullDay ? null : startTime,
        end_time: isFullDay ? null : endTime,
        reason: reason || null
      };

      const result = await apiService.createMyException(exceptionData);
      setExceptions([...exceptions, result]);
      toast.success('Day off added');

      // Reset form
      setSelectedDate(undefined);
      setIsFullDay(true);
      setStartTime('09:00');
      setEndTime('17:00');
      setReason('');
    } catch (error: any) {
      if (error?.status === 400) {
        toast.error('An exception already exists for this date');
      } else {
        toast.error('Failed to add day off');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteException = async (exceptionId: number) => {
    try {
      await apiService.deleteMyException(exceptionId);
      setExceptions(exceptions.filter(e => e.id !== exceptionId));
      toast.success('Day off removed');
    } catch (error) {
      toast.error('Failed to remove day off');
    }
  };

  // Get dates that have exceptions for calendar highlighting
  const exceptionDates = exceptions.map(e => new Date(e.exception_date));

  // Custom day renderer for calendar
  const modifiers = {
    exception: exceptionDates
  };

  const modifiersStyles = {
    exception: {
      backgroundColor: '#fecaca',
      color: '#991b1b',
      fontWeight: 'bold'
    }
  };

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
      {/* Add Day Off Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarOff className="w-5 h-5" />
            Mark Days Off
          </CardTitle>
          <CardDescription>
            Mark dates when you are unavailable for lessons
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Calendar */}
            <div>
              <Label className="mb-2 block">Select Date</Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                modifiers={modifiers}
                modifiersStyles={modifiersStyles}
                className="rounded-md border"
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              />
              <p className="text-xs text-gray-500 mt-2">
                Red dates already have exceptions marked
              </p>
            </div>

            {/* Form */}
            <div className="space-y-4">
              {selectedDate && (
                <>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="font-medium text-blue-900">
                      Selected: {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <Switch
                      id="full-day"
                      checked={isFullDay}
                      onCheckedChange={setIsFullDay}
                    />
                    <Label htmlFor="full-day">Full day off</Label>
                  </div>

                  {!isFullDay && (
                    <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-gray-50">
                      <div>
                        <Label>Unavailable From</Label>
                        <Input
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Unavailable Until</Label>
                        <Input
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <Label>Reason (Optional)</Label>
                    <Textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="e.g., Vacation, Doctor's appointment, Personal day..."
                      rows={2}
                    />
                  </div>

                  <Button
                    onClick={handleAddException}
                    disabled={saving}
                    className="w-full"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Mark as Unavailable
                  </Button>
                </>
              )}

              {!selectedDate && (
                <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg">
                  <p className="text-gray-500">Select a date on the calendar</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Days Off List */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Days Off</CardTitle>
          <CardDescription>
            Your scheduled unavailable dates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {exceptions.length > 0 ? (
            <div className="space-y-2">
              {exceptions
                .sort((a, b) => new Date(a.exception_date).getTime() - new Date(b.exception_date).getTime())
                .map((exception) => (
                  <div
                    key={exception.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                        <CalendarOff className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {format(new Date(exception.exception_date), 'EEEE, MMMM d, yyyy')}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          {exception.is_full_day ? (
                            <Badge variant="secondary">Full Day</Badge>
                          ) : (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {exception.start_time} - {exception.end_time}
                            </Badge>
                          )}
                          {exception.reason && (
                            <span className="text-gray-600">{exception.reason}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => exception.id && handleDeleteException(exception.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CalendarOff className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No days off scheduled</p>
              <p className="text-sm">Mark dates when you're unavailable above</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
