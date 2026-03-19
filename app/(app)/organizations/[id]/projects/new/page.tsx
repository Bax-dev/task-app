import { redirect } from 'next/navigation';

// Projects are now created from within spaces, not directly from organizations
export default function NewProjectRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Redirect to the organization page where they can pick a space
  redirect(`/organizations/`);
}
