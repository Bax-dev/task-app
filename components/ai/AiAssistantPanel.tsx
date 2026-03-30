'use client';

import { useState, useRef, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Send, Loader2, Bot, User, Trash2 } from 'lucide-react';
import { useAiChatMutation } from '@/store/api';
import { useGetOrganizationsQuery } from '@/store/api';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function AiAssistantPanel({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [aiChat, { isLoading }] = useAiChatMutation();
  const { data: orgs } = useGetOrganizationsQuery();
  const scrollRef = useRef<HTMLDivElement>(null);

  const orgId = orgs?.[0]?.id;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !orgId || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);

    try {
      const result = await aiChat({
        message: userMessage,
        organizationId: orgId,
        context: 'tasks',
      }).unwrap();

      setMessages((prev) => [...prev, { role: 'assistant', content: result.response }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
      ]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-[440px] p-0 flex flex-col">
        <SheetHeader className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-sm">TaskFlow AI</SheetTitle>
                <p className="text-[11px] text-muted-foreground">Powered by AWS Bedrock</p>
              </div>
            </div>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setMessages([])}
                className="text-muted-foreground"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 px-4" ref={scrollRef}>
          <div className="py-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Bot className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">How can I help?</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Ask me about tasks, get summaries, or plan your sprint.
                </p>
                <div className="space-y-2">
                  {[
                    'Summarize my open tasks',
                    'What should I prioritize today?',
                    'Help me plan a new feature',
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setInput(suggestion)}
                      className="block w-full text-left text-xs px-3 py-2 rounded-lg border border-border hover:bg-accent transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="w-3 h-3 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-[13px] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
                {msg.role === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-3 h-3 text-secondary-foreground" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-3 h-3 text-primary" />
                </div>
                <div className="bg-muted rounded-xl px-3 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-3 border-t border-border">
          {!orgId && (
            <Badge variant="outline" className="mb-2 text-[10px]">
              Join an organization to use AI
            </Badge>
          )}
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask TaskFlow AI..."
              className="min-h-[40px] max-h-[120px] resize-none text-[13px]"
              rows={1}
              disabled={!orgId || isLoading}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || !orgId || isLoading}
              className="flex-shrink-0 self-end"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
