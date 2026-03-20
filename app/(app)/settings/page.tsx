'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Loader2,
  CheckSquare,
  CalendarDays,
  FileText,
  BarChart3,
  Star,
  Users,
  Activity,
  FolderOpen,
  RotateCcw,
  Pencil,
  Camera,
  Check,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateProfileMutation, useGetMeQuery } from '@/store/api';
import { useAuth } from '@/hooks/use-auth';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  selectModuleCards,
  renameModuleCard,
  toggleModuleCard,
  resetModuleCards,
  selectThemeColorId,
  setThemeColor,
  THEME_COLORS,
} from '@/store/slices/preferencesSlice';
import type { LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  CheckSquare,
  CalendarDays,
  FileText,
  BarChart3,
  Star,
  Users,
  Activity,
  FolderOpen,
};

export default function SettingsPage() {
  const [name, setName] = useState('');
  const { user, isLoading: authLoading } = useAuth();
  const { refetch } = useGetMeQuery();
  const dispatch = useAppDispatch();
  const moduleCards = useAppSelector(selectModuleCards);
  const themeColorId = useAppSelector(selectThemeColorId);
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLoading = authLoading;

  useEffect(() => {
    if (user?.name) setName(user.name);
    if (user?.avatar) setAvatarPreview(user.avatar);
  }, [user]);

  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();

  const handleUpdate = async () => {
    try {
      await updateProfile({ name }).unwrap();
      toast.success('Profile updated');
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to update');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      // Get presigned upload URL
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get upload URL');

      const { uploadUrl, attachment } = data.data;

      // Upload to S3
      await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      // Update profile with avatar URL
      const fileUrl = attachment.fileUrl;
      await updateProfile({ avatar: fileUrl }).unwrap();
      setAvatarPreview(fileUrl);
      refetch();
      toast.success('Profile picture updated');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to upload image');
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      await updateProfile({ avatar: null }).unwrap();
      setAvatarPreview(null);
      refetch();
      toast.success('Profile picture removed');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to remove avatar');
    }
  };

  const handleRename = (cardId: string) => {
    const trimmed = editValue.trim();
    if (trimmed) {
      dispatch(renameModuleCard({ id: cardId, name: trimmed }));
      toast.success('Module renamed');
    }
    setEditingCard(null);
  };

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'U';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-2xl">
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Settings</h1>
      <p className="text-muted-foreground mb-6 sm:mb-8">Manage your account, appearance, and dashboard</p>

      {/* Profile Section */}
      <div className="bg-card border border-border rounded-lg p-4 sm:p-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Profile</h2>

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative group">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center border-2 border-border">
              {avatarPreview ? (
                <Image
                  src={avatarPreview}
                  alt="Profile"
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-primary">{initials}</span>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
            >
              {isUploadingAvatar ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : (
                <Camera className="w-5 h-5 text-white" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{user?.name || 'No name set'}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
            <div className="flex gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7 gap-1"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
              >
                <Upload className="w-3 h-3" />
                {isUploadingAvatar ? 'Uploading...' : 'Upload'}
              </Button>
              {avatarPreview && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7 text-destructive hover:text-destructive"
                  onClick={handleRemoveAvatar}
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleUpdate(); }} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user?.email || ''} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              disabled={isUpdating}
            />
          </div>

          <Button type="submit" disabled={isUpdating} size="sm">
            {isUpdating ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </div>

      {/* Theme Color */}
      <div className="bg-card border border-border rounded-lg p-4 sm:p-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-1">Theme Color</h2>
        <p className="text-xs text-muted-foreground mb-4">Choose your accent color across the app</p>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {THEME_COLORS.map((color) => {
            const isActive = themeColorId === color.id;
            return (
              <button
                key={color.id}
                onClick={() => dispatch(setThemeColor(color.id))}
                className="flex flex-col items-center gap-1.5 group"
              >
                <div
                  className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center ${
                    isActive ? 'border-foreground scale-110 shadow-md' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.primary }}
                >
                  {isActive && <Check className="w-4 h-4 text-white" />}
                </div>
                <span className={`text-[10px] ${isActive ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                  {color.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dashboard Customization */}
      <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Dashboard Modules</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Show, hide, or rename your quick action cards</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1.5 text-muted-foreground"
            onClick={() => {
              dispatch(resetModuleCards());
              toast.success('Reset to defaults');
            }}
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </Button>
        </div>

        <div className="space-y-2">
          {moduleCards.map((card) => {
            const Icon = ICON_MAP[card.icon] || CheckSquare;
            const isEditing = editingCard === card.id;

            return (
              <div
                key={card.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  card.visible ? 'border-border bg-background' : 'border-border/50 bg-muted/30 opacity-60'
                }`}
              >
                <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(card.id);
                        if (e.key === 'Escape') setEditingCard(null);
                      }}
                      onBlur={() => handleRename(card.id)}
                      className="text-sm font-medium bg-transparent border-b border-primary outline-none text-foreground w-full"
                      maxLength={20}
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{card.name}</span>
                      <button
                        onClick={() => {
                          setEditingCard(card.id);
                          setEditValue(card.name);
                        }}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        title="Rename"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">{card.href}</p>
                </div>

                <Switch
                  checked={card.visible}
                  onCheckedChange={() => dispatch(toggleModuleCard(card.id))}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
