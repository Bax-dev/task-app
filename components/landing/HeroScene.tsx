'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SplineScene } from '@/components/ui/splite';
import { Spotlight } from '@/components/ui/spotlight';
import { ArrowRight, CheckCircle } from 'lucide-react';

export default function HeroScene() {
  return (
    <div className="w-full min-h-[600px] md:min-h-[680px] relative">
      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20"
        fill="white"
      />

      <div className="flex flex-col md:flex-row h-full max-w-7xl mx-auto">
        {/* Left — copy */}
        <div className="flex-1 p-8 md:p-16 relative z-10 flex flex-col justify-center">
          <span className="inline-block w-fit px-4 py-2 bg-white/10 text-neutral-300 rounded-full text-sm font-semibold mb-6 backdrop-blur-sm border border-white/10">
            Free forever for small teams
          </span>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 leading-[1.1] tracking-tight">
            Ship Projects{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-400">
              Faster,
            </span>
            <br className="hidden md:block" />
            Together
          </h1>

          <p className="mt-5 text-neutral-400 max-w-lg text-lg leading-relaxed">
            TaskFlow gives your team one place to plan work, track progress, and collaborate — so nothing falls through the cracks.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto text-base px-8 bg-white text-black hover:bg-neutral-200">
                Start For Free <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <a href="#features">
              <button className="w-full sm:w-auto h-11 text-base px-8 rounded-md font-medium border border-neutral-600 text-neutral-200 bg-transparent hover:bg-white/10 hover:text-white hover:border-neutral-400 transition-colors">
                See Features
              </button>
            </a>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-neutral-500 mt-6">
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 shrink-0" /> No credit card
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 shrink-0" /> Unlimited projects
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 shrink-0" /> 5 team members free
            </span>
          </div>
        </div>

        {/* Right — 3D scene */}
        <div className="flex-1 relative hidden md:block">
          <SplineScene
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="w-full h-full"
          />
        </div>
      </div>
    </div>
  );
}
