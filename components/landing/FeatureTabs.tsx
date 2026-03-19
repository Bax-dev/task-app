'use client';

import { useState } from 'react';
import { CheckSquare, FolderKanban, Users, Bell, Activity, FileText } from 'lucide-react';

const features = [
  {
    id: 'tasks',
    icon: CheckSquare,
    label: 'Task Management',
    title: 'Organize work with powerful task tracking',
    description:
      'Create, assign, and track tasks with statuses, priorities, due dates, and rejection workflows. Filter by status, view in grid or list, and never lose track of what matters.',
    bullets: ['Drag-and-drop Kanban boards', 'Priority levels & due dates', 'Task assignment & notifications', 'Status workflows (To Do, In Progress, Done, Rejected)'],
    mockup: (
      <div className="space-y-3">
        {[
          { title: 'Design homepage mockup', status: 'IN_PROGRESS', priority: 'HIGH', color: 'bg-yellow-500' },
          { title: 'Set up CI/CD pipeline', status: 'DONE', priority: 'URGENT', color: 'bg-green-500' },
          { title: 'Write API documentation', status: 'TODO', priority: 'MEDIUM', color: 'bg-blue-500' },
          { title: 'Fix auth redirect bug', status: 'IN_PROGRESS', priority: 'HIGH', color: 'bg-yellow-500' },
        ].map((t, i) => (
          <div key={i} className="flex items-center gap-3 bg-background/50 rounded-lg p-3 border border-border/50">
            <div className={`w-2.5 h-2.5 rounded-full ${t.color}`} />
            <span className="text-sm text-foreground flex-1">{t.title}</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">{t.priority}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'projects',
    icon: FolderKanban,
    label: 'Projects & Spaces',
    title: 'Structure work with spaces and projects',
    description:
      'Organize your organization into color-coded spaces, each containing focused projects. A clear hierarchy keeps even the largest teams aligned.',
    bullets: ['Color-coded spaces', 'Nested project structure', 'Organization-level permissions', 'Quick navigation sidebar'],
    mockup: (
      <div className="space-y-3">
        {[
          { name: 'Engineering', color: '#7c3aed', projects: ['API v2', 'Mobile App', 'Infrastructure'] },
          { name: 'Design', color: '#2563eb', projects: ['Brand Refresh', 'Component Library'] },
          { name: 'Marketing', color: '#059669', projects: ['Q1 Campaign', 'Blog Redesign'] },
        ].map((space, i) => (
          <div key={i} className="bg-background/50 rounded-lg p-3 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: space.color }} />
              <span className="text-sm font-medium text-foreground">{space.name}</span>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {space.projects.map((p, j) => (
                <span key={j} className="text-[11px] px-2 py-1 rounded bg-muted text-muted-foreground">{p}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'team',
    icon: Users,
    label: 'Team & Roles',
    title: 'Manage your team with flexible roles',
    description:
      'Invite members via email, assign Admin, Member, or Guest roles, and control who can create, edit, or view resources across your organization.',
    bullets: ['Email invitations with one-click accept', 'Admin, Member & Guest roles', 'Role-based access control', 'Team directory with avatars'],
    mockup: (
      <div className="space-y-3">
        {[
          { name: 'Sarah Chen', role: 'Admin', email: 'sarah@acme.co' },
          { name: 'James Wilson', role: 'Member', email: 'james@acme.co' },
          { name: 'Aisha Patel', role: 'Member', email: 'aisha@acme.co' },
          { name: 'Client Review', role: 'Guest', email: 'client@ext.co' },
        ].map((m, i) => (
          <div key={i} className="flex items-center gap-3 bg-background/50 rounded-lg p-3 border border-border/50">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">{m.name[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{m.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">{m.email}</p>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
              m.role === 'Admin' ? 'bg-purple-500/10 text-purple-600' : m.role === 'Guest' ? 'bg-gray-100 text-gray-500' : 'bg-blue-500/10 text-blue-600'
            }`}>{m.role}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'notifications',
    icon: Bell,
    label: 'Notifications',
    title: 'Stay in the loop with real-time alerts',
    description:
      'Get notified when tasks are assigned, updated, or completed. Never miss an important change with in-app and email notifications.',
    bullets: ['Real-time in-app notifications', 'Email alerts via Resend', 'Mark all as read', 'Notification bell with unread count'],
    mockup: (
      <div className="space-y-3">
        {[
          { title: 'Sarah assigned you "Fix auth bug"', time: '2 min ago', unread: true },
          { title: 'James completed "API docs"', time: '15 min ago', unread: true },
          { title: 'New member Aisha joined Engineering', time: '1 hr ago', unread: false },
          { title: 'Project "Mobile App" was created', time: '3 hrs ago', unread: false },
        ].map((n, i) => (
          <div key={i} className={`flex items-start gap-3 rounded-lg p-3 border ${n.unread ? 'bg-primary/5 border-primary/20' : 'bg-background/50 border-border/50'}`}>
            {n.unread && <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
            <div className={n.unread ? '' : 'ml-5'}>
              <p className="text-sm text-foreground">{n.title}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{n.time}</p>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'activity',
    icon: Activity,
    label: 'Activity Logs',
    title: 'Record and review what your team is doing',
    description:
      'Team members log their daily activities, link them to tasks, and add notes. Managers get a clear picture of progress without micromanaging.',
    bullets: ['Log activities with status tracking', 'Link to existing tasks', 'Organization-wide activity feed', 'File attachments support'],
    mockup: (
      <div className="space-y-3">
        {[
          { desc: 'Working on homepage redesign', status: 'In Progress', task: 'Design homepage', dot: 'bg-blue-500' },
          { desc: 'Deployed v2.1 to staging', status: 'Completed', task: 'Release v2.1', dot: 'bg-green-500' },
          { desc: 'Waiting on API keys from vendor', status: 'Blocked', task: null, dot: 'bg-red-500' },
          { desc: 'Reviewing pull request #47', status: 'In Progress', task: 'Code review', dot: 'bg-blue-500' },
        ].map((a, i) => (
          <div key={i} className="flex items-start gap-3 bg-background/50 rounded-lg p-3 border border-border/50">
            <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${a.dot}`} />
            <div className="flex-1">
              <p className="text-sm text-foreground">{a.desc}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{a.status}</span>
                {a.task && <span className="text-[10px] text-muted-foreground">on {a.task}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'notes',
    icon: FileText,
    label: 'Rich Notes',
    title: 'Capture ideas with a powerful editor',
    description:
      'Write meeting notes, project briefs, and documentation with a full rich text editor. Bold, lists, tables, headings — all built in.',
    bullets: ['Rich text editor with formatting', 'Tables, headings & lists', 'Per-organization notes', 'Export to DOCX'],
    mockup: (
      <div className="bg-background/50 rounded-lg p-4 border border-border/50 space-y-3">
        <div className="flex gap-1.5">
          {['B', 'I', 'U', 'H1', 'H2'].map((b) => (
            <span key={b} className="w-7 h-7 rounded bg-muted flex items-center justify-center text-[11px] font-medium text-muted-foreground">{b}</span>
          ))}
        </div>
        <div className="space-y-2">
          <p className="text-base font-bold text-foreground">Sprint Planning Notes</p>
          <p className="text-sm text-muted-foreground">Key decisions from today&apos;s planning session:</p>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
            <li>Prioritize auth flow redesign</li>
            <li>Move API v2 deadline to March 25</li>
            <li>Onboard two new engineers next week</li>
          </ul>
        </div>
      </div>
    ),
  },
];

export default function FeatureTabs() {
  const [active, setActive] = useState('tasks');
  const feature = features.find((f) => f.id === active)!;
  const Icon = feature.icon;

  return (
    <div>
      {/* Tab Bar */}
      <div className="flex gap-2 flex-wrap justify-center mb-12">
        {features.map((f) => {
          const TabIcon = f.icon;
          return (
            <button
              key={f.id}
              onClick={() => setActive(f.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active === f.id
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30'
              }`}
            >
              <TabIcon className="w-4 h-4" />
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="grid md:grid-cols-2 gap-12 items-start">
        <div className="space-y-6">
          <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
            <Icon className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-2xl font-bold text-foreground">{feature.title}</h3>
          <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
          <ul className="space-y-3">
            {feature.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                <svg className="w-5 h-5 text-primary shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {b}
              </li>
            ))}
          </ul>
        </div>

        {/* Mockup Card */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-2xl blur-2xl" />
          <div className="relative bg-card border border-border rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className="ml-2 text-xs text-muted-foreground">{feature.label}</span>
            </div>
            {feature.mockup}
          </div>
        </div>
      </div>
    </div>
  );
}
