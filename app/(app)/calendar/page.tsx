'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGetUserTasksQuery } from '@/store/api';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const priorityColors: Record<string, string> = {
  URGENT: 'bg-red-500/10 text-red-600 border-red-200',
  HIGH: 'bg-orange-500/10 text-orange-600 border-orange-200',
  MEDIUM: 'bg-blue-500/10 text-blue-600 border-blue-200',
  LOW: 'bg-muted text-muted-foreground border-border',
};

export default function CalendarPage() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const { data: tasks = [], isLoading } = useGetUserTasksQuery();

  const tasksByDate = useMemo(() => {
    const map: Record<string, typeof tasks> = {};
    tasks.forEach((task: any) => {
      if (task.dueDate) {
        const dateKey = new Date(task.dueDate).toISOString().split('T')[0];
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(task);
      }
    });
    return map;
  }, [tasks]);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const todayStr = today.toISOString().split('T')[0];

  // Calculate upcoming tasks (next 7 days)
  const upcomingTasks = tasks
    .filter((t: any) => {
      if (!t.dueDate) return false;
      const due = new Date(t.dueDate);
      const diff = (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 7 && t.status !== 'DONE';
    })
    .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const overdueTasks = tasks.filter((t: any) => {
    if (!t.dueDate) return false;
    return new Date(t.dueDate) < today && t.status !== 'DONE' && t.status !== 'CANCELLED';
  });

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Calendar</h1>
          <p className="text-muted-foreground mt-1 text-sm">View your tasks by due date</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-3 bg-card border border-border rounded-lg p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              {MONTHS[currentMonth]} {currentYear}
            </h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToToday}>Today</Button>
              <Button variant="outline" size="icon" onClick={prevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-px mb-1">
            {DAYS.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar cells */}
          <div className="grid grid-cols-7 gap-px">
            {/* Empty cells for days before first day of month */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[80px] sm:min-h-[100px] bg-muted/30 rounded-md p-1" />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayTasks = tasksByDate[dateStr] || [];
              const isToday = dateStr === todayStr;

              return (
                <div
                  key={day}
                  className={`min-h-[80px] sm:min-h-[100px] rounded-md p-1.5 border transition-colors ${
                    isToday ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-secondary/30'
                  }`}
                >
                  <span className={`text-xs font-medium ${isToday ? 'text-primary font-bold' : 'text-foreground'}`}>
                    {day}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {dayTasks.slice(0, 3).map((task: any) => (
                      <Link key={task.id} href={`/projects/${task.projectId}/tasks/${task.id}`}>
                        <div className={`text-[10px] sm:text-xs px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80 ${
                          task.status === 'DONE' ? 'bg-green-500/10 text-green-600 line-through' :
                          task.priority === 'URGENT' ? 'bg-red-500/10 text-red-600' :
                          task.priority === 'HIGH' ? 'bg-orange-500/10 text-orange-600' :
                          'bg-primary/10 text-primary'
                        }`}>
                          {task.title}
                        </div>
                      </Link>
                    ))}
                    {dayTasks.length > 3 && (
                      <span className="text-[10px] text-muted-foreground px-1.5">
                        +{dayTasks.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar: Upcoming & Overdue */}
        <div className="space-y-4">
          {overdueTasks.length > 0 && (
            <div className="bg-card border border-red-200 dark:border-red-900 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-red-600 flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4" />
                Overdue ({overdueTasks.length})
              </h3>
              <div className="space-y-2">
                {overdueTasks.slice(0, 5).map((task: any) => (
                  <Link key={task.id} href={`/projects/${task.projectId}/tasks/${task.id}`}>
                    <div className="p-2 rounded-md hover:bg-muted transition-colors">
                      <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                      <p className="text-xs text-red-500 mt-0.5">
                        Due {new Date(task.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-primary" />
              Next 7 Days
            </h3>
            {upcomingTasks.length > 0 ? (
              <div className="space-y-2">
                {upcomingTasks.slice(0, 8).map((task: any) => (
                  <Link key={task.id} href={`/projects/${task.projectId}/tasks/${task.id}`}>
                    <div className="p-2 rounded-md hover:bg-secondary/50 transition-colors">
                      <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={`text-[10px] ${priorityColors[task.priority] || ''}`}>
                          {task.priority}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No upcoming tasks</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
