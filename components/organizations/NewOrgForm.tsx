'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';

export default function NewOrgForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');

  const generateSlug = (value: string) => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (value: string) => {
    setName(value);
    setSlug(generateSlug(value));
  };

  const createMutation = useMutation({
    mutationFn: () => api.post('/api/organizations', { name, slug }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success('Organization created!');
      router.push(`/organizations/${data.id}`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        createMutation.mutate();
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="name">Organization Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="My Organization"
          required
          disabled={createMutation.isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="my-organization"
          required
          disabled={createMutation.isPending}
          pattern="^[a-z0-9-]+$"
        />
        <p className="text-xs text-muted-foreground">
          Only lowercase letters, numbers, and hyphens
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={createMutation.isPending}>
        {createMutation.isPending ? 'Creating...' : 'Create Organization'}
      </Button>
    </form>
  );
}
