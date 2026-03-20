'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useCreateProjectMutation } from '@/store/api';

interface NewProjectFormProps {
  spaceId: string;
}

export default function NewProjectForm({ spaceId }: NewProjectFormProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const [createProject, { isLoading: isCreating }] = useCreateProjectMutation();

  const handleCreate = async () => {
    try {
      const data = await createProject({
        name,
        description: description || undefined,
        spaceId,
      }).unwrap();
      toast.success('Project created!');
      router.push(`/projects/${data.id}`);
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to create project');
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleCreate();
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="name">Project Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Project"
          required
          disabled={isCreating}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief project description"
          rows={3}
          disabled={isCreating}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isCreating}>
        {isCreating ? 'Creating...' : 'Create Project'}
      </Button>
    </form>
  );
}
