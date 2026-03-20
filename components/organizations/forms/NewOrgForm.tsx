'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useCreateOrganizationMutation } from '@/store/api';

export default function NewOrgForm() {
  const router = useRouter();
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

  const [createOrganization, { isLoading: isCreating }] = useCreateOrganizationMutation();

  const handleCreate = async () => {
    try {
      const data = await createOrganization({ name, slug }).unwrap();
      toast.success('Organization created!');
      router.push(`/organizations/${data.id}`);
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to create organization');
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
        <Label htmlFor="name">Organization Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="My Organization"
          required
          disabled={isCreating}
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
          disabled={isCreating}
          pattern="^[a-z0-9-]+$"
        />
        <p className="text-xs text-muted-foreground">
          Only lowercase letters, numbers, and hyphens
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={isCreating}>
        {isCreating ? 'Creating...' : 'Create Organization'}
      </Button>
    </form>
  );
}
