import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/what-we-do')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/what-we-do"!</div>
}
