Welcome to your new TanStack Start app!

# Getting Started

To run this application:

```bash
npm install
npm run dev
```

# Building For Production

To build this application for production:

```bash
npm run build
```

To run the built app locally, use the Vite preview server:

```bash
npm run preview
```

`dist/server/server.js` is the TanStack Start server handler bundle, not a standalone Node.js executable. Running it directly with `node` loads the module and exits; use the preview command for local verification, and configure a deployment adapter/runtime for production hosting.

## Styling

This project uses [Tailwind CSS](https://tailwindcss.com/) for styling.

The site header is a fixed, floating glass panel based on the Figma redesign, with a centered 82.5rem maximum width, the supplied heart-handshake mark, and a Fraunces wordmark. Navigation uses an animated active pill, the Donate action links to `/donate`, and EN/DE controls switch the bundled translations and document language. On smaller screens the navigation moves into a scrollable second row. Hovering over the header or focusing a control expands the bar and logo with a Motion spring; reduced-motion preferences disable movement. Its layout slot reserves the collapsed height to prevent page jumps, and document scroll padding keeps anchor targets below the expanded bar. Header colors, dimensions, and shadow are defined as `brand-` tokens in `src/styles.css`.

### Removing Tailwind CSS

If you prefer not to use Tailwind CSS:

1. Remove the demo pages in `src/routes/demo/`
2. Replace the Tailwind import in `src/styles.css` with your own styles
3. Remove `tailwindcss()` from the plugins array in `vite.config.ts`
4. Remove `@tailwindcss/vite` and `tailwindcss` from `package.json`

## Translations

English is the default and fallback locale. Header labels and accessible names use the typed `siteHeader` keys, while homepage content uses the `home` keys in `src/locales/en/common.json`, with matching German translations in `src/locales/de/common.json`. Translation key types are derived from the English resources. The app and Storybook both initialize the shared i18next setup.

## Linting & Formatting

This project uses [eslint](https://eslint.org/) and [prettier](https://prettier.io/) for linting and formatting. Eslint is configured using [tanstack/eslint-config](https://tanstack.com/config/latest/docs/eslint). The following scripts are available:

```bash
npm run lint
npm run format
npm run check
```

## Pre-commit hooks

Install the project dependencies and pre-commit, then install the Git hook once per clone:

```bash
npm install
pipx install pre-commit
pre-commit install
```

The hook runs `npm run lint` for code changes and `npm run check` to verify formatting. Run `pre-commit run --all-files` to check the repository manually.

## Shadcn

Add components using the latest version of [Shadcn](https://ui.shadcn.com/).

```bash
pnpm dlx shadcn@latest add button
```

## Routing

This project uses [TanStack Router](https://tanstack.com/router) with file-based routing. Routes are managed as files in `src/routes`.

### Page structure

Keep route files thin: they configure the route and render a page imported from `src/pages/<page-name>/index.tsx`.

Page-only components live in `src/pages/<page-name>/components/`. Group complex components in a named folder with an `index.tsx` entry point and an adjacent `components/` folder for their subcomponents. Add page-local `hooks/`, `utils/`, or `context/` folders only when needed. Shared components remain in `src/components/`, with UI primitives in `src/components/ui/`.

The Home page renders the hero, impact, projects, values, get-involved, partners, and donation sections from `src/pages/home/components/`, followed by the shared contact strip. The shared site footer is rendered once in the root shell on every route, outside the page's main landmark. The hero retains the Figma illustration placeholder (a photo has not been supplied), local decorative SVGs, and a floating support note. Its actions link to `/contact` and `/what-we-do`; the impact and project actions also link to `/what-we-do`. These destination routes are still placeholders; individual project detail routes are not implemented yet.

Both sections compose `src/components/section-heading.tsx`, a shared animated heading with optional eyebrow and description, left/center alignment, inverse styling, and semantic heading levels. The impact section displays the four design-provided statistics as a responsive definition list. Entrance, hover, and floating motion respect reduced-motion preferences. Brand colors, glass surfaces, and gradients live in `src/styles.css`. Stories cover the hero, impact section, and shared heading variants.

Reusable cards live in `src/components/`: `GlassCard` provides light/inverse glass surfaces and reduced-motion-aware reveal/float animations; `StatCard` composes it for label/value pairs and must be placed inside a `<dl>`; `InfoCard` composes it for an icon, title, and description. The impact statistics and hero support note use these shared components. Keep section-specific content, decoration, and layout in the page components rather than duplicating shared card styling.

`ProjectCard` provides gradient covers, category tags, titles, excerpts, and a caller-supplied action. `ValueCard` provides an icon, heading, and description on the soft `GlassCard` variant; project cards use the solid variant. `IconChip` is shared by value cards and info cards. These reusable components and their stories live outside page folders. Projects and Values use typed English/German content under `home.projects` and `home.values`; the supplied SVG icons and glass decorations are stored locally.

`ActionCard` composes `GlassCard` and `IconChip` with a title, description, and caller-supplied action. Its featured variant uses a lagoon glass surface; the shared Button's `sun` variant supplies the highlighted donation CTA. `PartnerCard` provides a reusable initials badge, name, and description with lagoon, sun, or terracotta tones. Both cards inherit reduced-motion-aware entrance and hover animations. Get involved uses `home.getInvolved` translations, with contact, material donations, and volunteering linking to `/contact`, and financial donations linking to `/donate`. Partners uses `home.partners` translations and retains the design's initials placeholders for APH EL AJA, AAHPDC, and ARASO; actual partner logos have not been supplied. All new icons and decorative SVGs are local assets, and stories cover both sections and shared card variants.

`CtaBanner` provides an animated heading, description, caller-supplied actions, and optional decorative content. The donation section composes it with local Figma decorations and links to `/donate` and `/contact`. `ContactStrip` presents a rounded lagoon-tinted panel on the cream background with a localized introduction, divider, and responsive contact-method grid. Its shared `ContactItem` components use 52px white icon chips, lagoon labels, and working map, email, and telephone links; the design-provided contact details live in `src/lib/site-contact.ts` and are reused by the footer. The footer provides route navigation and a localized copyright year. Social profile controls are explicitly disabled placeholders with a coming-soon notice until real URLs are supplied. Footer colors are `brand-` tokens, and its outlined social controls use the shared Button's `footerOutline` variant. Copy uses `home.donation`, `siteContact`, and `siteFooter` English/German keys. Stories cover the banner, donation section, contact components, and footer; entrance animations respect reduced-motion preferences.

Contact items expand into soft glass cards on hover or keyboard focus, revealing localized descriptions with animated height and opacity. Their title buttons also toggle details on touch devices; Escape or leaving keyboard focus closes them. Contact links stay separate from the disclosure controls. Reduced-motion preferences disable the reveal transition, and only the active card expands rather than stretching its neighbors.

Homepage section backgrounds follow the approved Figma flow: cream to lagoon at the hero, lagoon to cream behind impact, cream to sun through projects, sun to cream through values, and a second lagoon flow through involvement and partners. The donation banner sits on a soft sun glow. Shared `brand-flow-*` gradient tokens keep adjacent section endpoints consistent; the footer uses its own subtle ink-to-teal gradient. Keep light-to-dark fades out of text areas; dark feature content belongs inside a readable rounded panel.

### Adding A Route

To add a new route to your application just add a new file in the `./src/routes` directory.

TanStack will automatically generate the content of the route file for you.

Now that you have two routes you can use a `Link` component to navigate between them.

### Adding Links

To use SPA (Single Page Application) navigation you will need to import the `Link` component from `@tanstack/react-router`.

```tsx
import { Link } from '@tanstack/react-router'
```

Then anywhere in your JSX you can use it like so:

```tsx
<Link to="/about">About</Link>
```

This will create a link that will navigate to the `/about` route.

More information on the `Link` component can be found in the [Link documentation](https://tanstack.com/router/v1/docs/framework/react/api/router/linkComponent).

### Using A Layout

In the File Based Routing setup the layout is located in `src/routes/__root.tsx`. Anything you add to the root route will appear in all the routes. The route content will appear in the JSX where you render `{children}` in the `shellComponent`.

Here is an example layout that includes a header:

```tsx
import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'My App' },
    ],
  }),
  shellComponent: ({ children }) => (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <header>
          <nav>
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
          </nav>
        </header>
        {children}
        <Scripts />
      </body>
    </html>
  ),
})
```

More information on layouts can be found in the [Layouts documentation](https://tanstack.com/router/latest/docs/framework/react/guide/routing-concepts#layouts).

## Server Functions

TanStack Start provides server functions that allow you to write server-side code that seamlessly integrates with your client components.

```tsx
import { createServerFn } from '@tanstack/react-start'

const getServerTime = createServerFn({
  method: 'GET',
}).handler(async () => {
  return new Date().toISOString()
})

// Use in a component
function MyComponent() {
  const [time, setTime] = useState('')

  useEffect(() => {
    getServerTime().then(setTime)
  }, [])

  return <div>Server time: {time}</div>
}
```

## API Routes

You can create API routes by using the `server` property in your route definitions:

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'

export const Route = createFileRoute('/api/hello')({
  server: {
    handlers: {
      GET: () => json({ message: 'Hello, World!' }),
    },
  },
})
```

## Data Fetching

There are multiple ways to fetch data in your application. You can use TanStack Query to fetch data from a server. But you can also use the `loader` functionality built into TanStack Router to load the data for a route before it's rendered.

For example:

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/people')({
  loader: async () => {
    const response = await fetch('https://swapi.dev/api/people')
    return response.json()
  },
  component: PeopleComponent,
})

function PeopleComponent() {
  const data = Route.useLoaderData()
  return (
    <ul>
      {data.results.map((person) => (
        <li key={person.name}>{person.name}</li>
      ))}
    </ul>
  )
}
```

Loaders simplify your data fetching logic dramatically. Check out more information in the [Loader documentation](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading#loader-parameters).

# Learn More

You can learn more about all of the offerings from TanStack in the [TanStack documentation](https://tanstack.com).

For TanStack Start specific documentation, visit [TanStack Start](https://tanstack.com/start).
