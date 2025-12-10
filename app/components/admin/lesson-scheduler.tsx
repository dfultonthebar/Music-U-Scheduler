'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { apiService } from '@/lib/api';
import { toast } from 'sonner';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Users,
  AlertTriangle,
  CheckCircle,
  Coffee,
  Loader2,
  Music
} from 'lucide-react';
import { format } from 'date-fns';
import { createCSTDateTime, formatTimeCST, formatDateTimeCST, APP_TIMEZONE } from '@/lib/timezone';

interface Instructor {
  id: number;
  full_name: string;
  email: string;
  username: string;
  default_break_minutes?: number;
  has_availability?: boolean;
  availability_slots?: number;
  student_count?: number;
  specializations?: string;
}

interface Student {
  id: number;
  full_name: string;
  email: string;
  username: string;
}

interface TimeSlot {
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface Conflict {
  conflict_type: string;
  message: string;
  conflicting_lesson_id?: number;
}

interface DurationOption {
  minutes: number;
  label: string;
}

export default function LessonScheduler() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [selectedInstructor, setSelectedInstructor] = useState<number | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [duration, setDuration] = useState<number>(60);
  const [breakAfter, setBreakAfter] = useState<number>(5);
  const [lessonTitle, setLessonTitle] = useState<string>('');
  const [instrument, setInstrument] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [showAllStudents, setShowAllStudents] = useState<boolean>(false);

  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [validation, setValidation] = useState<{ is_valid: boolean; conflicts: Conflict[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [durationOptions, setDurationOptions] = useState<DurationOption[]>([]);
  const [breakOptions, setBreakOptions] = useState<DurationOption[]>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedInstructor && selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedInstructor, selectedDate, duration, breakAfter]);

  useEffect(() => {
    if (selectedInstructor && selectedDate && selectedTime) {
      validateTime();
    }
  }, [selectedInstructor, selectedDate, selectedTime, duration, breakAfter]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [instructorsData, allStudentsData, optionsData] = await Promise.all([
        apiService.getInstructorsForScheduling().catch(() => []),
        apiService.getAllStudentsForScheduling().catch(() => []),
        apiService.getDurationOptions().catch(() => ({
          duration_options: [
            { minutes: 30, label: '30 min' },
            { minutes: 45, label: '45 min' },
            { minutes: 60, label: '1 hour' },
            { minutes: 90, label: '1h 30m' },
            { minutes: 120, label: '2 hours' }
          ],
          break_options: [
            { minutes: 0, label: 'No break' },
            { minutes: 5, label: '5 min' },
            { minutes: 10, label: '10 min' },
            { minutes: 15, label: '15 min' }
          ]
        }))
      ]);

      setInstructors(instructorsData || []);
      setAllStudents(allStudentsData || []);
      setDurationOptions(optionsData.duration_options || []);
      setBreakOptions(optionsData.break_options || []);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Load students for the selected instructor
  const loadStudentsForInstructor = async (instructorId: number) => {
    try {
      setLoadingStudents(true);
      setSelectedStudent(null);
      const result = await apiService.getStudentsByInstructor(instructorId);
      setStudents(result.students || []);
      setShowAllStudents(false);
    } catch (error) {
      console.error('Failed to load instructor students:', error);
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const loadAvailableSlots = async () => {
    if (!selectedInstructor || !selectedDate) return;

    try {
      setLoadingSlots(true);
      const dateStr = format(selectedDate, "yyyy-MM-dd'T'00:00:00");
      const result = await apiService.getAvailableSlots(
        selectedInstructor,
        dateStr,
        duration,
        breakAfter
      );
      setAvailableSlots(result.available_slots || []);
    } catch (error) {
      console.error('Failed to load slots:', error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const validateTime = async () => {
    if (!selectedInstructor || !selectedDate || !selectedTime) return;

    try {
      const dateTimeStr = `${format(selectedDate, 'yyyy-MM-dd')}T${selectedTime}:00`;
      const result = await apiService.validateLessonTime(
        selectedInstructor,
        dateTimeStr,
        duration,
        breakAfter
      );
      setValidation({ is_valid: result.is_valid, conflicts: result.conflicts });
    } catch (error) {
      console.error('Validation failed:', error);
      setValidation(null);
    }
  };

  const handleInstructorChange = async (instructorId: string) => {
    const id = parseInt(instructorId);
    setSelectedInstructor(id);
    setSelectedTime('');
    setValidation(null);

    // Get instructor's default break time
    const instructor = instructors.find(i => i.id === id);
    if (instructor?.default_break_minutes !== undefined) {
      setBreakAfter(instructor.default_break_minutes);
    }

    // Load students for this instructor
    await loadStudentsForInstructor(id);
  };

  // Toggle between instructor's students and all students
  const handleShowAllStudents = () => {
    if (showAllStudents) {
      // Switch back to instructor's students
      if (selectedInstructor) {
        loadStudentsForInstructor(selectedInstructor);
      }
    } else {
      // Show all students
      setStudents(allStudents);
      setShowAllStudents(true);
    }
  };

  const handleScheduleLesson = async () => {
    if (!selectedInstructor || !selectedStudent || !selectedDate || !selectedTime || !lessonTitle) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      // Use CST timezone utility to create the datetime string
      // This ensures the time is stored as-is without UTC conversion
      const dateTimeStr = createCSTDateTime(format(selectedDate, 'yyyy-MM-dd'), selectedTime);

      const lessonData = {
        title: lessonTitle,
        description: description || null,
        teacher_id: selectedInstructor,
        student_id: selectedStudent,
        scheduled_at: dateTimeStr,
        duration_minutes: duration,
        break_after_minutes: breakAfter,
        instrument: instrument || null,
        lesson_type: 'individual'
      };

      await apiService.createLessonWithValidation(lessonData, true);
      toast.success('Lesson scheduled successfully!');

      // Reset form
      setLessonTitle('');
      setDescription('');
      setSelectedTime('');
      setInstrument('');
      setValidation(null);

      // Reload available slots
      loadAvailableSlots();
    } catch (error: any) {
      if (error?.status === 409) {
        toast.error('Scheduling conflict! Please choose a different time.');
      } else {
        toast.error('Failed to schedule lesson');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTimeSlot = (slot: TimeSlot) => {
    const start = new Date(slot.start_time);
    return format(start, 'HH:mm');
  };

  return (
    <div className="space-y-6">
      <Card data-testid="lesson-scheduler-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Schedule New Lesson
          </CardTitle>
          <CardDescription>
            Create a new lesson with automatic availability checking and conflict detection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Selection */}
            <div className="space-y-4">
              {/* Instructor Selection */}
              <div className="space-y-2">
                <Label htmlFor="instructor">
                  <User className="w-4 h-4 inline mr-2" />
                  Instructor *
                </Label>
                <Select onValueChange={handleInstructorChange}>
                  <SelectTrigger data-testid="instructor-select">
                    <SelectValue placeholder="Select instructor" />
                  </SelectTrigger>
                  <SelectContent>
                    {instructors.map((instructor) => (
                      <SelectItem key={instructor.id} value={instructor.id.toString()}>
                        <div className="flex items-center justify-between w-full">
                          <span>{instructor.full_name}</span>
                          <div className="flex items-center gap-2 ml-2">
                            {instructor.has_availability && (
                              <Badge variant="outline" className="text-xs">
                                Available
                              </Badge>
                            )}
                            {instructor.student_count !== undefined && instructor.student_count > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {instructor.student_count} student{instructor.student_count !== 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedInstructor && (
                  <div className="text-xs text-muted-foreground">
                    {instructors.find(i => i.id === selectedInstructor)?.specializations && (
                      <span>Teaches: {instructors.find(i => i.id === selectedInstructor)?.specializations}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Student Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="student">
                    <Users className="w-4 h-4 inline mr-2" />
                    Student *
                  </Label>
                  {selectedInstructor && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleShowAllStudents}
                      className="text-xs h-6"
                    >
                      {showAllStudents ? 'Show Assigned Only' : 'Show All Students'}
                    </Button>
                  )}
                </div>
                {!selectedInstructor ? (
                  <div className="p-3 border rounded-md bg-muted/50 text-sm text-muted-foreground">
                    Please select an instructor first
                  </div>
                ) : loadingStudents ? (
                  <div className="flex items-center justify-center p-3 border rounded-md">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span className="text-sm">Loading students...</span>
                  </div>
                ) : (
                  <>
                    <Select
                      value={selectedStudent?.toString() || ''}
                      onValueChange={(v) => setSelectedStudent(parseInt(v))}
                    >
                      <SelectTrigger data-testid="student-select">
                        <SelectValue placeholder={
                          showAllStudents
                            ? "Select from all students"
                            : students.length > 0
                              ? "Select assigned student"
                              : "No students assigned"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {students.length > 0 ? (
                          students.map((student) => (
                            <SelectItem key={student.id} value={student.id.toString()}>
                              {student.full_name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="-1" disabled>
                            No students found
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {!showAllStudents && students.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        No students assigned to this instructor yet.
                        <Button
                          variant="link"
                          size="sm"
                          onClick={handleShowAllStudents}
                          className="h-auto p-0 ml-1 text-xs"
                        >
                          Show all students
                        </Button>
                      </p>
                    )}
                    {showAllStudents && (
                      <p className="text-xs text-muted-foreground">
                        Showing all students. Select a student to assign them to this instructor.
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Lesson Title */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  <Music className="w-4 h-4 inline mr-2" />
                  Lesson Title *
                </Label>
                <Input
                  id="title"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  placeholder="e.g., Piano Beginner Lesson"
                  data-testid="lesson-title-input"
                />
              </div>

              {/* Instrument */}
              <div className="space-y-2">
                <Label htmlFor="instrument">Instrument</Label>
                <Select onValueChange={setInstrument}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select instrument" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Piano">Piano</SelectItem>
                    <SelectItem value="Guitar">Guitar</SelectItem>
                    <SelectItem value="Violin">Violin</SelectItem>
                    <SelectItem value="Voice">Voice</SelectItem>
                    <SelectItem value="Drums">Drums</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label htmlFor="duration">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Duration *
                </Label>
                <Select value={duration.toString()} onValueChange={(v) => setDuration(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {durationOptions.length > 0 ? (
                      durationOptions.map((opt) => (
                        <SelectItem key={opt.minutes} value={opt.minutes.toString()}>
                          {opt.label}
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="30">30 min</SelectItem>
                        <SelectItem value="45">45 min</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="90">1h 30m</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Break After */}
              <div className="space-y-2">
                <Label htmlFor="break">
                  <Coffee className="w-4 h-4 inline mr-2" />
                  Break After Lesson
                </Label>
                <Select value={breakAfter.toString()} onValueChange={(v) => setBreakAfter(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {breakOptions.length > 0 ? (
                      breakOptions.map((opt) => (
                        <SelectItem key={opt.minutes} value={opt.minutes.toString()}>
                          {opt.label}
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="0">No break</SelectItem>
                        <SelectItem value="5">5 min</SelectItem>
                        <SelectItem value="10">10 min</SelectItem>
                        <SelectItem value="15">15 min</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Notes (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Any additional notes for this lesson..."
                  rows={3}
                />
              </div>
            </div>

            {/* Right Column - Calendar & Time Slots */}
            <div className="space-y-4">
              {/* Calendar */}
              <div className="space-y-2">
                <Label>Select Date *</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                />
              </div>

              {/* Available Time Slots */}
              {selectedInstructor && selectedDate && (
                <div className="space-y-2">
                  <Label>Available Time Slots</Label>
                  {loadingSlots ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : availableSlots.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md">
                      {availableSlots.map((slot, index) => (
                        <Button
                          key={index}
                          variant={selectedTime === formatTimeSlot(slot) ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedTime(formatTimeSlot(slot))}
                          className="text-xs"
                        >
                          {formatTimeSlot(slot)}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <Alert variant="default">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>No Available Slots</AlertTitle>
                      <AlertDescription>
                        No available time slots for this instructor on the selected date.
                        The instructor may not have set their availability or may be fully booked.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {/* Manual Time Input */}
              <div className="space-y-2">
                <Label htmlFor="time">Or Enter Time Manually</Label>
                <Input
                  id="time"
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                />
              </div>

              {/* Validation Result */}
              {validation && (
                <Alert variant={validation.is_valid ? "default" : "destructive"}>
                  {validation.is_valid ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <AlertTitle>Time Available</AlertTitle>
                      <AlertDescription>
                        This time slot is available for scheduling.
                      </AlertDescription>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Scheduling Conflict</AlertTitle>
                      <AlertDescription>
                        <ul className="list-disc pl-4 mt-2">
                          {validation.conflicts.map((conflict, index) => (
                            <li key={index}>
                              <Badge variant="outline" className="mr-2">
                                {conflict.conflict_type.replace('_', ' ')}
                              </Badge>
                              {conflict.message}
                            </li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </>
                  )}
                </Alert>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleScheduleLesson}
              disabled={loading || !validation?.is_valid}
              className="min-w-[200px]"
              data-testid="schedule-lesson-button"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Schedule Lesson
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
