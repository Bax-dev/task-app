import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Building2,
  CheckSquare,
  FolderOpen,
  Users,
  CalendarDays,
  FileText,
  BarChart3,
  Star,
  Settings,
  Bell,
  Activity,
  Layers,
  UserPlus,
  Shield,
} from 'lucide-react';
import LandingNav from '@/components/landing/LandingNav';

export const metadata = {
  title: 'User Manual - TaskFlow',
  description: 'Learn how to use TaskFlow to manage your projects, tasks, and team collaboration.',
};

const sections = [
  {
    id: 'getting-started',
    icon: Layers,
    title: 'Getting Started',
    content: [
      {
        subtitle: 'How TaskFlow is organized',
        text: 'TaskFlow uses a hierarchy to keep your work structured: Organization > Space > Project > Task. An organization is your team or company. Inside it, you create spaces (e.g. Engineering, Marketing) to group related projects. Each project contains tasks that your team works on.',
      },
      {
        subtitle: 'Creating your account',
        text: 'Click "Get Started Free" on the home page and sign up with your email and password. Once signed in, you\'ll land on the Dashboard where you can start setting up your workspace.',
      },
      {
        subtitle: 'Your first setup (5 minutes)',
        steps: [
          'Create an Organization — give it a name for your team or company.',
          'Create a Space — group related work (e.g. "Product", "Design", "Backend").',
          'Create a Project — a specific initiative or deliverable within a space.',
          'Create Tasks — the individual work items your team needs to complete.',
          'Invite your team — send email invitations so everyone can collaborate.',
        ],
      },
    ],
  },
  {
    id: 'dashboard',
    icon: Star,
    title: 'Dashboard',
    content: [
      {
        subtitle: 'Overview',
        text: 'The Dashboard is your home base. It greets you by name and shows a summary of your current workload including the number of organizations, projects, in-progress tasks, and completed tasks. Each stat card is clickable and takes you to the relevant page.',
      },
      {
        subtitle: 'Due soon alerts',
        text: 'If any tasks are due within the next 3 days, a banner appears at the top linking you to the Calendar view so you can plan accordingly.',
      },
      {
        subtitle: 'Quick Actions',
        text: 'Shortcut cards let you jump to any section of the app. You can customize which cards appear and rename them by clicking the pencil icon on hover, or go to Settings to manage all of them.',
      },
      {
        subtitle: 'Recent Tasks',
        text: 'Shows your 5 most recent tasks with their status, priority, due date, project, and assignees. Click any task to open its detail page.',
      },
    ],
  },
  {
    id: 'organizations',
    icon: Building2,
    title: 'Organizations',
    content: [
      {
        subtitle: 'Creating an organization',
        text: 'Go to the Organizations page and click "New Organization". Give it a name and you\'re ready to go. You\'ll automatically be the Admin of any organization you create.',
      },
      {
        subtitle: 'Managing your organization',
        text: 'Click on any organization to see its details: team members, spaces, and stats. From here you can invite new members, create spaces, and manage roles.',
      },
      {
        subtitle: 'Deleting an organization',
        text: 'Only the organization creator (Admin) can delete it. Go to the Team page, scroll to the Danger Zone, and type the organization name to confirm. This permanently deletes all spaces, projects, and tasks within it.',
      },
    ],
  },
  {
    id: 'team',
    icon: Users,
    title: 'Team & Roles',
    content: [
      {
        subtitle: 'Inviting members',
        text: 'Admins can invite new team members by email from the Team page or the Organization detail page. Each invitation includes a role assignment and expires after a set period. You can resend or revoke pending invitations.',
      },
      {
        subtitle: 'Roles explained',
        items: [
          { label: 'Admin', desc: 'Full access. Can invite members, change roles, remove members, view audit logs, and delete the organization.' },
          { label: 'Member', desc: 'Can create and edit spaces, projects, and tasks. Cannot manage team members or view audit logs.' },
          { label: 'Guest', desc: 'Read-only access. Can view tasks and projects but cannot create or edit anything.' },
        ],
      },
      {
        subtitle: 'Changing roles',
        text: 'Admins can change any member\'s role from the Team page using the role dropdown next to each member. You cannot change your own role or remove the organization creator.',
      },
    ],
  },
  {
    id: 'spaces',
    icon: Layers,
    title: 'Spaces',
    content: [
      {
        subtitle: 'What are spaces?',
        text: 'Spaces are groups within an organization that help you organize projects by department, team, or category (e.g. "Engineering", "Marketing", "Design"). Each space has a color for easy visual identification.',
      },
      {
        subtitle: 'Creating a space',
        text: 'You can create a space from the sidebar (click the + next to "Spaces"), from an organization\'s detail page, or from the space creation dialog. Choose an organization, name, and color.',
      },
      {
        subtitle: 'Managing spaces',
        text: 'Click on a space in the sidebar to see all its projects. You can rename a space by clicking the pencil icon next to its name, or delete it using the delete button (Admin and Member only).',
      },
    ],
  },
  {
    id: 'projects',
    icon: FolderOpen,
    title: 'Projects',
    content: [
      {
        subtitle: 'Creating a project',
        text: 'Go to the Projects page and click "New Project". Select an organization and space, then give your project a name and optional description. Projects are the containers for your tasks.',
      },
      {
        subtitle: 'Project views',
        text: 'Toggle between Grid and List view on the Projects page. Grid view groups projects by organization with cards showing description, space, and task count. List view shows a table format.',
      },
      {
        subtitle: 'Project detail & task board',
        text: 'Click a project to open its detail page. Here you\'ll see a Kanban-style board with columns for each task status: To Do, In Progress, Done, and Cancelled. You can drag tasks between columns to update their status.',
      },
    ],
  },
  {
    id: 'tasks',
    icon: CheckSquare,
    title: 'Tasks',
    content: [
      {
        subtitle: 'Creating a task',
        text: 'Click "New Task" from the Tasks page, a project detail page, or the Dashboard. Fill in the title (required), and optionally set description, priority, status, due date, and assignees.',
      },
      {
        subtitle: 'Task statuses',
        items: [
          { label: 'To Do', desc: 'Task is planned but not yet started.' },
          { label: 'In Progress', desc: 'Someone is actively working on it.' },
          { label: 'Done', desc: 'Task has been completed.' },
          { label: 'Cancelled', desc: 'Task was cancelled and won\'t be worked on.' },
          { label: 'Rejected', desc: 'Task was rejected. A reason must be provided when rejecting.' },
        ],
      },
      {
        subtitle: 'Priority levels',
        items: [
          { label: 'Urgent', desc: 'Needs immediate attention. Shown in red.' },
          { label: 'High', desc: 'Important and should be done soon. Shown in orange.' },
          { label: 'Medium', desc: 'Normal priority. Shown in blue.' },
          { label: 'Low', desc: 'Can be done when there\'s time. Shown in gray.' },
        ],
      },
      {
        subtitle: 'Assigning tasks',
        text: 'When creating or editing a task, use the assignee field to search for team members by name. Type @all to assign everyone in the organization. Multiple people can be assigned to the same task. Assigned members will see the task in their task list and receive a notification.',
      },
      {
        subtitle: 'Attachments',
        text: 'You can upload file attachments to tasks from the task detail page. This is useful for sharing mockups, documents, or other reference materials.',
      },
      {
        subtitle: 'Filtering & searching',
        text: 'On the Tasks page, use the search bar to find tasks by title, description, or project name. Filter by status using the tab buttons (All, To Do, In Progress, Done, Rejected, Cancelled). Each tab shows the count of matching tasks.',
      },
    ],
  },
  {
    id: 'calendar',
    icon: CalendarDays,
    title: 'Calendar',
    content: [
      {
        subtitle: 'Calendar view',
        text: 'The Calendar page shows a monthly view of all your tasks by their due date. Navigate between months using the arrow buttons, or jump to today. Each day cell shows the tasks due on that date, color-coded by status.',
      },
      {
        subtitle: 'Sidebar panels',
        text: 'The right sidebar shows two sections: Overdue tasks (past their due date, highlighted in red) and tasks due in the Next 7 Days. Both show the task title, due date, and priority badge for quick reference.',
      },
    ],
  },
  {
    id: 'notes',
    icon: FileText,
    title: 'Notes',
    content: [
      {
        subtitle: 'Organization notes',
        text: 'Notes are shared within an organization. Select an organization from the dropdown to view its notes. Any Admin or Member can create notes; Guests have read-only access.',
      },
      {
        subtitle: 'Creating & managing',
        text: 'Click "New Note" and give it a title. Notes are displayed as cards showing the title, creator, and last updated date. Hover over a note card to reveal the delete button.',
      },
    ],
  },
  {
    id: 'quick-access',
    icon: Star,
    title: 'Quick Access (Favorites)',
    content: [
      {
        subtitle: 'Smart collections',
        text: 'The Quick Access page automatically surfaces your most important items without any manual curation:',
      },
      {
        subtitle: '',
        items: [
          { label: 'Priority Tasks', desc: 'Urgent and High priority tasks that aren\'t completed or cancelled (up to 10).' },
          { label: 'Due Within 3 Days', desc: 'Tasks with upcoming deadlines, sorted by due date.' },
          { label: 'In Progress', desc: 'All tasks you or your team are currently working on (up to 8).' },
          { label: 'Active Projects', desc: 'Projects that have in-progress tasks, showing active and total task counts.' },
        ],
      },
    ],
  },
  {
    id: 'reports',
    icon: BarChart3,
    title: 'Reports & Analytics',
    content: [
      {
        subtitle: 'Overview stats',
        text: 'The Reports page shows four summary cards: Total Tasks, Completed (with completion rate percentage), In Progress, and Overdue.',
      },
      {
        subtitle: 'Charts & visualizations',
        items: [
          { label: 'Tasks by Status', desc: 'A donut chart showing the distribution of tasks across all statuses.' },
          { label: 'Tasks by Priority', desc: 'A bar chart showing how many tasks exist at each priority level.' },
          { label: 'Tasks by Project', desc: 'A horizontal bar chart comparing total vs completed tasks for your top 8 projects.' },
        ],
      },
      {
        subtitle: 'Summary',
        text: 'At the bottom, you\'ll see counts for Total Organizations, Total Projects, and the Overall Completion Rate across everything.',
      },
    ],
  },
  {
    id: 'notifications',
    icon: Bell,
    title: 'Notifications',
    content: [
      {
        subtitle: 'Notification bell',
        text: 'The bell icon in the top navigation bar shows a red dot when you have unread notifications. Click it to see a dropdown with your most recent notifications and a "Mark all read" button.',
      },
      {
        subtitle: 'Notifications page',
        text: 'Click "View all notifications" in the dropdown or navigate to the Notifications page to see your full notification history. Each notification shows a title, message, and timestamp. Unread notifications are highlighted. Click a notification to mark it as read and navigate to the related item.',
      },
      {
        subtitle: 'What triggers notifications',
        text: 'You\'ll receive notifications when you\'re assigned to a task, when a task you\'re assigned to is updated, when you\'re invited to an organization, and other team activity events.',
      },
    ],
  },
  {
    id: 'audit-logs',
    icon: Activity,
    title: 'Audit Logs',
    content: [
      {
        subtitle: 'Admin-only feature',
        text: 'Audit Logs are only accessible to organization Admins. They provide a complete record of all actions taken within an organization for accountability and compliance.',
      },
      {
        subtitle: 'What\'s logged',
        text: 'Every significant action is recorded: task creation, status changes, assignments, member additions and removals, role changes, and more. Each entry shows who performed the action, what they did, and when.',
      },
      {
        subtitle: 'Searching logs',
        text: 'Use the search bar to filter logs by action description, user name or email, or task title. Logs are grouped by date for easy browsing.',
      },
    ],
  },
  {
    id: 'settings',
    icon: Settings,
    title: 'Settings',
    content: [
      {
        subtitle: 'Profile',
        text: 'Update your display name and avatar. Click on your avatar to upload a new image (supports JPG, PNG, GIF, WebP up to 5MB). Your email address is shown but cannot be changed.',
      },
      {
        subtitle: 'Theme color',
        text: 'Choose from 10 accent colors to personalize the look of your entire TaskFlow interface. The selected color is used for buttons, links, active states, and highlights throughout the app.',
      },
      {
        subtitle: 'Dashboard modules',
        text: 'Customize which Quick Action cards appear on your Dashboard. Toggle cards on/off, rename them by clicking the pencil icon, and use the Reset button to restore defaults.',
      },
    ],
  },
  {
    id: 'invitations',
    icon: UserPlus,
    title: 'Invitations',
    content: [
      {
        subtitle: 'Sending invitations',
        text: 'Admins can invite new members by navigating to the Team page and clicking "Invite". Enter the person\'s email and select a role (Admin, Member, or Guest). An email invitation will be sent with a link to join.',
      },
      {
        subtitle: 'Managing invitations',
        text: 'Pending invitations appear in the Team page below the members list. You can see the invited email, assigned role, and expiration date. Use the Resend button to send the invitation again, or Revoke to cancel it.',
      },
      {
        subtitle: 'Accepting an invitation',
        text: 'When you receive an invitation email, click the link to accept. If you don\'t have an account, you\'ll be prompted to sign up first. Once accepted, you\'ll be added to the organization with the assigned role.',
      },
    ],
  },
  {
    id: 'security',
    icon: Shield,
    title: 'Security & Access',
    content: [
      {
        subtitle: 'Authentication',
        text: 'TaskFlow uses secure JWT-based authentication with encrypted passwords. Your session is maintained securely and you can log out at any time from the user menu in the top right.',
      },
      {
        subtitle: 'Role-based access',
        text: 'Every action in TaskFlow is governed by your role within each organization. Admins have full control, Members can create and edit, and Guests can only view. This ensures the right people have the right level of access.',
      },
      {
        subtitle: 'Data privacy',
        text: 'Your data is scoped to your organizations. Team members can only see projects, tasks, and notes within organizations they belong to.',
      },
    ],
  },
];

export default function UserManualPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary">
      <LandingNav />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">User Manual</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Everything you need to know to get the most out of TaskFlow. From setting up your first organization to advanced team management.
          </p>
        </div>

        {/* Table of Contents */}
        <div className="bg-card border border-border rounded-xl p-6 mb-12">
          <h2 className="text-lg font-semibold text-foreground mb-4">Table of Contents</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                >
                  <Icon className="w-4 h-4 text-primary shrink-0" />
                  {section.title}
                </a>
              );
            })}
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-16">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <section key={section.id} id={section.id} className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">{section.title}</h2>
                </div>

                <div className="space-y-6 pl-0 md:pl-[52px]">
                  {section.content.map((block, i) => (
                    <div key={i}>
                      {block.subtitle && (
                        <h3 className="text-base font-semibold text-foreground mb-2">{block.subtitle}</h3>
                      )}
                      {'text' in block && block.text && (
                        <p className="text-muted-foreground leading-relaxed">{block.text}</p>
                      )}
                      {'steps' in block && block.steps && (
                        <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                          {block.steps.map((step, j) => (
                            <li key={j} className="leading-relaxed">
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      )}
                      {'items' in block && block.items && (
                        <ul className="space-y-2">
                          {block.items.map((item, j) => (
                            <li key={j} className="flex gap-2 text-muted-foreground">
                              <span className="font-medium text-foreground shrink-0">{item.label}:</span>
                              <span className="leading-relaxed">{item.desc}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 text-center bg-card border border-border rounded-xl p-10">
          <h2 className="text-2xl font-bold text-foreground mb-3">Ready to get started?</h2>
          <p className="text-muted-foreground mb-6">Create your free account and set up your workspace in under 5 minutes.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg">Get Started Free</Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline">Go to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
