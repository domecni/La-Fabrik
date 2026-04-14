import { Suspense, lazy } from 'react'
const Perf = lazy(() => import('r3f-perf').then((m) => ({ default: m.Perf })))
export function DebugPerf() {
  const debug = new URLSearchParams(window.location.search).has('debug')
  if (!debug) return null
  return (
    <Suspense fallback={null}>
      <Perf position="top-left" />
    </Suspense>
  )
}