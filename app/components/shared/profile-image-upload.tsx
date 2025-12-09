"use client";

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, X, User } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileImageUploadProps {
  currentImage?: string | null;
  userName: string;
  onUpload: (file: File) => Promise<{ url: string }>;
  onDelete?: () => Promise<void>;
  isLoading?: boolean;
  maxSizeMB?: number;
  allowedFormats?: string[];
}

export function ProfileImageUpload({
  currentImage,
  userName,
  onUpload,
  onDelete,
  isLoading = false,
  maxSizeMB = 5,
  allowedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
}: ProfileImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!allowedFormats.includes(file.type)) {
      toast.error(`Invalid file type. Please upload ${allowedFormats.map(f => f.split('/')[1]).join(', ')}`);
      return;
    }

    // Validate file size
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`File too large. Maximum size is ${maxSizeMB}MB`);
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload immediately
    handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const result = await onUpload(file);
      toast.success('Profile image uploaded successfully');
      setPreview(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload image');
      setPreview(null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    setUploading(true);
    try {
      await onDelete();
      toast.success('Profile image deleted');
      setPreview(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete image');
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const displayImage = preview || currentImage;
  const getInitials = () => {
    return userName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Picture</CardTitle>
        <CardDescription>
          Upload a profile photo. Max size {maxSizeMB}MB. Formats: JPG, PNG, GIF.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-24 w-24">
            {displayImage ? (
              <AvatarImage src={displayImage} alt={userName} />
            ) : (
              <AvatarFallback className="text-2xl">
                {getInitials()}
              </AvatarFallback>
            )}
          </Avatar>

          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept={allowedFormats.join(',')}
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading || isLoading}
            />

            <Button
              onClick={triggerFileInput}
              disabled={uploading || isLoading}
              size="sm"
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload Photo'}
            </Button>

            {(currentImage || preview) && onDelete && (
              <Button
                onClick={handleDelete}
                disabled={uploading || isLoading}
                variant="destructive"
                size="sm"
              >
                <X className="h-4 w-4 mr-2" />
                Remove Photo
              </Button>
            )}
          </div>
        </div>

        {preview && (
          <div className="text-sm text-muted-foreground">
            Uploading new image...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
