'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { apiService } from '@/lib/api';

export default function DataExport() {
  const [loading, setLoading] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [lessonStatus, setLessonStatus] = useState<string>('');

  const handleExport = async (type: 'students' | 'instructors' | 'lessons' | 'attendance') => {
    try {
      setLoading(type);

      let url = `/admin/export/${type}`;
      const params = new URLSearchParams();

      // Add date range parameters for lessons and attendance
      if ((type === 'lessons' || type === 'attendance') && dateFrom) {
        params.append('date_from', dateFrom.toISOString());
      }
      if ((type === 'lessons' || type === 'attendance') && dateTo) {
        params.append('date_to', dateTo.toISOString());
      }

      // Add status filter for lessons
      if (type === 'lessons' && lessonStatus) {
        params.append('status', lessonStatus);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      // Call the export API endpoint
      await apiService.exportData(type, dateFrom, dateTo, lessonStatus);

      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} exported successfully`);
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(`Failed to export ${type}: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Data Export</h2>
        <p className="text-gray-500 mt-1">Export system data to CSV files for external analysis</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Students Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              Students
            </CardTitle>
            <CardDescription>
              Export all student records including contact information and instruments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => handleExport('students')}
              disabled={loading !== null}
              className="w-full"
            >
              {loading === 'students' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export Students
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Instructors Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-purple-600" />
              Instructors
            </CardTitle>
            <CardDescription>
              Export all instructor records including specializations and rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => handleExport('instructors')}
              disabled={loading !== null}
              className="w-full"
            >
              {loading === 'instructors' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export Instructors
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Lessons Export */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-green-600" />
              Lessons
            </CardTitle>
            <CardDescription>
              Export lesson records with optional date range and status filters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Date From */}
              <div className="space-y-2">
                <Label>From Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !dateFrom && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date To */}
              <div className="space-y-2">
                <Label>To Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !dateTo && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label>Status (Optional)</Label>
                <Select value={lessonStatus} onValueChange={setLessonStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="rescheduled">Rescheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => handleExport('lessons')}
                disabled={loading !== null}
                className="flex-1"
              >
                {loading === 'lessons' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export Lessons
                  </>
                )}
              </Button>

              {(dateFrom || dateTo || lessonStatus) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setDateFrom(undefined);
                    setDateTo(undefined);
                    setLessonStatus('');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Attendance/History Export */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-orange-600" />
              Attendance History
            </CardTitle>
            <CardDescription>
              Export completed and cancelled lessons with notes and progress tracking
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date From */}
              <div className="space-y-2">
                <Label>From Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !dateFrom && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date To */}
              <div className="space-y-2">
                <Label>To Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !dateTo && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => handleExport('attendance')}
                disabled={loading !== null}
                className="flex-1"
              >
                {loading === 'attendance' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export Attendance
                  </>
                )}
              </Button>

              {(dateFrom || dateTo) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setDateFrom(undefined);
                    setDateTo(undefined);
                  }}
                >
                  Clear Dates
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Box */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="text-blue-600 mt-0.5">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 mb-1">Export Information</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>CSV files will be downloaded automatically to your Downloads folder</li>
                <li>File names include timestamps for easy organization</li>
                <li>Date filters are optional - leave blank to export all records</li>
                <li>Attendance exports only include completed and cancelled lessons</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
