import { createFileRoute } from '@tanstack/react-router'
import { DonatePage } from '#/pages/donate'

export const Route = createFileRoute('/donate')({
  component: DonatePage,
})
