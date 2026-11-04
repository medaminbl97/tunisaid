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

English is the default and fallback locale. Header labels and accessible names use the typed `siteHeader` keys, while the hero and impact content use `home.hero` and `home.impact` in `src/locales/en/common.json`, with matching German translations in `src/locales/de/common.json`. Translation key types are derived from the English resources. The app and Storybook both initialize the shared i18next setup.

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

The Home page renders the hero followed by the impact section from `src/pages/home/components/`. The hero retains the Figma illustration placeholder (a photo has not been supplied), local decorative SVGs, and a floating support note. Its actions link to `/contact` and `/what-we-do`; the impact action also links to `/what-we-do`. These destination routes are still placeholders.

Both sections compose `src/components/section-heading.tsx`, a shared animated heading with optional eyebrow and description, left/center alignment, inverse styling, and semantic heading levels. The impact section displays the four design-provided statistics as a responsive definition list. Entrance, hover, and floating motion respect reduced-motion preferences. Brand colors, glass surfaces, and gradients live in `src/styles.css`. Stories cover the hero, impact section, and shared heading variants.

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
