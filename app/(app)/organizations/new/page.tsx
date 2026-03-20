import { Metadata } from 'next';
import NewOrgForm from '@/components/organizations/forms/NewOrgForm';

export const metadata: Metadata = {
  title: 'Create Organization | TaskFlow',
  description: 'Create a new organization',
};

export default function NewOrgPage() {
  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-2xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 sm:mb-8">
          Create New Organization
        </h1>
        <div className="bg-card border border-border rounded-lg p-4 sm:p-6 md:p-8">
          <NewOrgForm />
        </div>
      </div>
    </div>
  );
}
