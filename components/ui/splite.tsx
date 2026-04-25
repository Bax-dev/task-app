'use client'

import { Component, type ReactNode, Suspense, lazy } from 'react'
const Spline = lazy(() => import('@splinetool/react-spline'))

interface SplineSceneProps {
  scene: string
  className?: string
}

class SplineErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error: unknown) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[SplineScene] failed to render', error)
    }
  }
  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}

function SplineFallback({ className }: { className?: string }) {
  return (
    <div className={className} aria-hidden>
      <div className="w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.15),transparent_70%)]" />
    </div>
  )
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  return (
    <SplineErrorBoundary fallback={<SplineFallback className={className} />}>
      <Suspense
        fallback={
          <div className="w-full h-full flex items-center justify-center">
            <span className="loader"></span>
          </div>
        }
      >
        <Spline
          scene={scene}
          className={className}
        />
      </Suspense>
    </SplineErrorBoundary>
  )
}
