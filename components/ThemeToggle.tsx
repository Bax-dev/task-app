'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button className="p-1.5 rounded-md text-muted-foreground">
        <Sun className="w-[18px] h-[18px]" />
      </button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors">
          {theme === 'dark' ? (
            <Moon className="w-[18px] h-[18px]" />
          ) : theme === 'light' ? (
            <Sun className="w-[18px] h-[18px]" />
          ) : (
            <Monitor className="w-[18px] h-[18px]" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className="cursor-pointer text-[13px] py-1.5 gap-2"
        >
          <Sun className="w-3.5 h-3.5" />
          Light
          {theme === 'light' && <span className="ml-auto text-primary text-xs">Active</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className="cursor-pointer text-[13px] py-1.5 gap-2"
        >
          <Moon className="w-3.5 h-3.5" />
          Dark
          {theme === 'dark' && <span className="ml-auto text-primary text-xs">Active</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className="cursor-pointer text-[13px] py-1.5 gap-2"
        >
          <Monitor className="w-3.5 h-3.5" />
          System
          {theme === 'system' && <span className="ml-auto text-primary text-xs">Active</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
