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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { apiService } from '@/lib/api';
import { toast } from 'sonner';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Users,
  Plus,
  Edit,
  Trash2,
  PlayCircle,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Music
} from 'lucide-react';
import { format } from 'date-fns';

interface Instructor {
  id: number;
  full_name: string;
  email: string;
  username: string;
}

interface Student {
  id: number;
  full_name: string;
  email: string;
  username: string;
}

interface LessonTemplate {
  id: number;
  instructor_id: number;
  student_id: number;
  day_of_week: number;
  start_time: string;
  duration_minutes: number;
  instrument: string | null;
  lesson_type: string;
  location: string | null;
  room_number: string | null;
  is_active: boolean;
  created_at: string;
  instructor: {
    id: number;
    full_name: string;
    email: string;
  };
  student: {
    id: number;
    full_name: string;
    email: string;
  };
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function LessonTemplates() {
  const [templates, setTemplates] = useState<LessonTemplate[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<LessonTemplate | null>(null);

  // Form state
  const [selectedInstructor, setSelectedInstructor] = useState<number | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [dayOfWeek, setDayOfWeek] = useState<number>(0);
  const [startTime, setStartTime] = useState<string>('09:00');
  const [duration, setDuration] = useState<number>(30);
  const [instrument, setInstrument] = useState<string>('');
  const [lessonType, setLessonType] = useState<string>('individual');
  const [location, setLocation] = useState<string>('');
  const [roomNumber, setRoomNumber] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);

  // Generate form state
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [generationResult, setGenerationResult] = useState<any>(null);

  useEffect(() => {
    loadTemplates();
    loadInstructors();
    loadStudents();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await apiService.getLessonTemplates();
      setTemplates(data);
    } catch (error) {
      toast.error('Failed to load lesson templates');
    } finally {
      setLoading(false);
    }
  };

  const loadInstructors = async () => {
    try {
      const data = await apiService.getInstructorsForScheduling();
      setInstructors(data);
    } catch (error) {
      toast.error('Failed to load instructors');
    }
  };

  const loadStudents = async () => {
    try {
      const data = await apiService.getAllStudentsForScheduling();
      setStudents(data);
    } catch (error) {
      toast.error('Failed to load students');
    }
  };

  const resetForm = () => {
    setSelectedInstructor(null);
    setSelectedStudent(null);
    setDayOfWeek(0);
    setStartTime('09:00');
    setDuration(30);
    setInstrument('');
    setLessonType('individual');
    setLocation('');
    setRoomNumber('');
    setIsActive(true);
  };

  const handleAddTemplate = async () => {
    if (!selectedInstructor || !selectedStudent) {
      toast.error('Please select instructor and student');
      return;
    }

    try {
      setLoading(true);
      const templateData = {
        instructor_id: selectedInstructor,
        student_id: selectedStudent,
        day_of_week: dayOfWeek,
        start_time: startTime,
        duration_minutes: duration,
        instrument: instrument || null,
        lesson_type: lessonType,
        location: location || null,
        room_number: roomNumber || null,
        is_active: isActive
      };

      await apiService.createLessonTemplate(templateData);
      toast.success('Lesson template created successfully!');
      setShowAddDialog(false);
      resetForm();
      loadTemplates();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create lesson template');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTemplate = async () => {
    if (!editingTemplate) return;

    try {
      setLoading(true);
      const updateData = {
        day_of_week: dayOfWeek,
        start_time: startTime,
        duration_minutes: duration,
        instrument: instrument || null,
        lesson_type: lessonType,
        location: location || null,
        room_number: roomNumber || null,
        is_active: isActive
      };

      await apiService.updateLessonTemplate(editingTemplate.id, updateData);
      toast.success('Lesson template updated successfully!');
      setShowEditDialog(false);
      setEditingTemplate(null);
      resetForm();
      loadTemplates();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update lesson template');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId: number) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      setLoading(true);
      await apiService.deleteLessonTemplate(templateId);
      toast.success('Lesson template deleted successfully!');
      loadTemplates();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete lesson template');
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (template: LessonTemplate) => {
    setEditingTemplate(template);
    setDayOfWeek(template.day_of_week);
    setStartTime(template.start_time);
    setDuration(template.duration_minutes);
    setInstrument(template.instrument || '');
    setLessonType(template.lesson_type);
    setLocation(template.location || '');
    setRoomNumber(template.room_number || '');
    setIsActive(template.is_active);
    setShowEditDialog(true);
  };

  const handleGenerateLessons = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    if (startDate > endDate) {
      toast.error('Start date must be before end date');
      return;
    }

    try {
      setLoading(true);
      const result = await apiService.generateLessonsFromTemplates({
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd')
      });

      setGenerationResult(result);
      toast.success(`Generated ${result.lessons_created} lessons!`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate lessons');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Recurring Lesson Templates</h2>
          <p className="text-muted-foreground">Manage recurring lesson schedules and generate lessons automatically</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowGenerateDialog(true)} variant="outline">
            <PlayCircle className="w-4 h-4 mr-2" />
            Generate Lessons
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Template
          </Button>
        </div>
      </div>

      {/* Templates List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Templates</CardTitle>
          <CardDescription>
            {templates.length} template{templates.length !== 1 ? 's' : ''} configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && templates.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No lesson templates configured yet</p>
              <p className="text-sm">Create a template to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Instructor</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Day</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Instrument</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        {template.instructor.full_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        {template.student.full_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{DAYS_OF_WEEK[template.day_of_week]}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        {template.start_time}
                      </div>
                    </TableCell>
                    <TableCell>{template.duration_minutes} min</TableCell>
                    <TableCell>
                      {template.instrument ? (
                        <Badge>{template.instrument}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {template.is_active ? (
                        <Badge className="bg-green-500">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditDialog(template)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteTemplate(template.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Template Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Recurring Lesson Template</DialogTitle>
            <DialogDescription>
              Create a template for lessons that repeat weekly on the same day and time
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Instructor *</Label>
              <Select onValueChange={(value) => setSelectedInstructor(Number(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select instructor" />
                </SelectTrigger>
                <SelectContent>
                  {instructors.map((instructor) => (
                    <SelectItem key={instructor.id} value={instructor.id.toString()}>
                      {instructor.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Student *</Label>
              <Select onValueChange={(value) => setSelectedStudent(Number(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id.toString()}>
                      {student.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Day of Week *</Label>
              <Select onValueChange={(value) => setDayOfWeek(Number(value))} value={dayOfWeek.toString()}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Start Time *</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Duration (minutes) *</Label>
              <Input
                type="number"
                min="15"
                max="120"
                step="5"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label>Instrument</Label>
              <Input
                placeholder="e.g., Piano, Guitar"
                value={instrument}
                onChange={(e) => setInstrument(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                placeholder="e.g., Room 101"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Room Number</Label>
              <Input
                placeholder="e.g., 101"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
              />
            </div>

            <div className="col-span-2 flex items-center space-x-2">
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label>Active Template</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTemplate} disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Lesson Template</DialogTitle>
            <DialogDescription>
              Update the recurring lesson template details
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Day of Week *</Label>
              <Select onValueChange={(value) => setDayOfWeek(Number(value))} value={dayOfWeek.toString()}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Start Time *</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Duration (minutes) *</Label>
              <Input
                type="number"
                min="15"
                max="120"
                step="5"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label>Instrument</Label>
              <Input
                placeholder="e.g., Piano, Guitar"
                value={instrument}
                onChange={(e) => setInstrument(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                placeholder="e.g., Room 101"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Room Number</Label>
              <Input
                placeholder="e.g., 101"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
              />
            </div>

            <div className="col-span-2 flex items-center space-x-2">
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label>Active Template</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditTemplate} disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Update Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Lessons Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate Lessons from Templates</DialogTitle>
            <DialogDescription>
              Create lesson instances from active templates for a date range
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Note</AlertTitle>
              <AlertDescription>
                This will create lessons for all active templates within the specified date range.
                Lessons that already exist or conflict with existing lessons will be skipped.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  className="rounded-md border"
                />
              </div>

              <div className="space-y-2">
                <Label>End Date *</Label>
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  className="rounded-md border"
                />
              </div>
            </div>

            {generationResult && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Generation Complete</AlertTitle>
                <AlertDescription>
                  <div className="mt-2 space-y-1">
                    <p><strong>Lessons Created:</strong> {generationResult.lessons_created}</p>
                    <p><strong>Lessons Skipped:</strong> {generationResult.lessons_skipped}</p>
                    <p><strong>Date Range:</strong> {generationResult.date_range}</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowGenerateDialog(false);
              setGenerationResult(null);
            }}>
              Close
            </Button>
            <Button onClick={handleGenerateLessons} disabled={loading || !startDate || !endDate}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Generate Lessons
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
