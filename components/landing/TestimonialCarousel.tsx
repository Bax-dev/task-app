'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Emily Rodriguez',
    role: 'Engineering Manager at Nexus',
    quote: 'TaskFlow replaced three different tools for us. The spaces and project hierarchy finally makes sense for how our teams actually work.',
    rating: 5,
  },
  {
    name: 'David Kim',
    role: 'Product Lead at Kova',
    quote: 'The activity logs feature is a game-changer. I can see what my team is working on without interrupting them with status meetings.',
    rating: 5,
  },
  {
    name: 'Priya Sharma',
    role: 'CTO at BuildStack',
    quote: 'We onboarded 40 people in a week. The role-based access and guest mode means we can include clients without exposing internal work.',
    rating: 5,
  },
  {
    name: 'Marcus Johnson',
    role: 'Freelance Designer',
    quote: 'I use TaskFlow for every client project now. The notes with rich text and the clean task board keep everything in one place.',
    rating: 5,
  },
  {
    name: 'Lena Fischer',
    role: 'Ops Director at CloudBridge',
    quote: 'Real-time notifications mean nothing falls through the cracks anymore. Our delivery rate improved 35% in the first month.',
    rating: 5,
  },
];

export default function TestimonialCarousel() {
  const [current, setCurrent] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  function go(dir: number) {
    setIsAutoPlaying(false);
    setCurrent((c) => (c + dir + testimonials.length) % testimonials.length);
  }

  const t = testimonials[current];

  return (
    <div className="relative max-w-3xl mx-auto text-center">
      <div className="min-h-[200px] flex flex-col items-center justify-center">
        <div className="flex gap-1 mb-6">
          {Array.from({ length: t.rating }).map((_, i) => (
            <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
        <blockquote className="text-xl md:text-2xl text-foreground font-medium leading-relaxed mb-6">
          &ldquo;{t.quote}&rdquo;
        </blockquote>
        <div>
          <p className="font-semibold text-foreground">{t.name}</p>
          <p className="text-sm text-muted-foreground">{t.role}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 mt-8">
        <button
          onClick={() => go(-1)}
          className="w-10 h-10 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex gap-2">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => { setIsAutoPlaying(false); setCurrent(i); }}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === current ? 'bg-primary w-6' : 'bg-muted hover:bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>
        <button
          onClick={() => go(1)}
          className="w-10 h-10 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
