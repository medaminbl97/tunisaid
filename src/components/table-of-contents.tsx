import { useEffect, useState } from 'react'
import { cn } from '#/lib/utils'

export type TableOfContentsItem = {
  id: string
  text: string
  level: 2 | 3
}

type TableOfContentsProps = {
  title: string
  items: Array<TableOfContentsItem>
  className?: string
}

function useActiveHeading(idList: string) {
  const [activeId, setActiveId] = useState<string | undefined>(
    idList.split(' ')[0],
  )

  useEffect(() => {
    const headings = idList
      .split(' ')
      .map((id) => document.getElementById(id))
      .filter((element) => element !== null)
    if (!headings.length) return

    let frame = 0
    const update = () => {
      frame = 0
      const offset = parseFloat(getComputedStyle(headings[0]).scrollMarginTop)
      const passed = headings.filter(
        (heading) => heading.getBoundingClientRect().top <= offset + 8,
      )
      const atEnd =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2
      setActiveId(
        (atEnd ? headings.at(-1) : (passed.at(-1) ?? headings[0]))?.id,
      )
    }
    const schedule = () => {
      frame ||= requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [idList])

  return activeId
}

export function TableOfContents(props: TableOfContentsProps) {
  const activeId = useActiveHeading(
    props.items.map((item) => item.id).join(' '),
  )

  return (
    <nav aria-label={props.title} className={props.className}>
      <ol className="space-y-1 border-l-2 border-brand-line">
        {props.items.map((item) => {
          const active = item.id === activeId
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={active ? 'location' : undefined}
                className={cn(
                  '-ml-[2px] block border-l-2 py-1.5 pr-2 text-[15px] leading-snug transition-colors',
                  item.level === 3 ? 'pl-8' : 'pl-4',
                  active
                    ? 'border-brand-lagoon-deep font-bold text-brand-lagoon-deep'
                    : 'border-transparent text-brand-ink-soft hover:border-brand-lagoon-blue hover:text-brand-ink',
                )}
              >
                {item.text}
              </a>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
