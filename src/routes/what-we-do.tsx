import { createFileRoute } from '@tanstack/react-router'
import { WhatWeDoPage } from '#/pages/what-we-do'

export const Route = createFileRoute('/what-we-do')({
  component: WhatWeDoPage,
})
