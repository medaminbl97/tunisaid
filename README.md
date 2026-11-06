Welcome to your new TanStack Start app!

# Getting Started

To run this application:

```bash
npm install
npm run dev
```

## Local backend

A root [Directus 11 + PostgreSQL stack](./directus/README.md) provides private
content, fundraising and donation-tracking collections with mounted, versioned
API migrations and repeatable draft seeds. The root `docker-compose.yml` includes
`directus/compose.yaml` to run this backend at localhost:8056. Checkout records
donations in Directus through a **mock** payment provider; no real payments are
processed (see [Donation checkout](#donation-checkout)).

## API generation and Projects

The Projects API foundation uses Hey API's Fetch SDK, generated TypeScript and
Zod 4 response validators. With the local backend running:

```bash
npm run api:generate
npm run api:test
```

Generation requires Node.js 22.18+. Set `OPENAPI_TOKEN` in the git-ignored root
`.env.local` or your shell; the generator uses it as a Bearer token to fetch
Directus's OpenAPI specification. It does not log in with administrator credentials
or read `directus/.env`. Optionally set `DIRECTUS_URL` for another Directus server.
The anonymous specification omits private collections. The token is used only
by the local generator, never written to the generated client. Never prefix it
with `VITE_` or commit it. To use another contract, run
`OPENAPI_INPUT=/path/to/openapi.json npm run api:generate` (a URL also works).
For a URL, `OPENAPI_TOKEN` is sent if set; use only trusted spec URLs. Redirects
are rejected. Local input files do not require a token.
The input must expose the Projects list/detail operations and expanded translations.
Generated output lives in `src/api/generated/`; never edit it manually.
Regenerate after changing the Directus schema or OpenAPI contract. Only
`/items/*` operations are generated; the token's Directus role decides which
collections and methods appear in the spec, so grant it read access to expose a
new collection. Use an administrator token so the one generated SDK covers both
the public collections and the private donation collections the server uses.
Bundling an operation grants nothing: Directus enforces the caller's policy on
every request.

The browser and the server share that SDK through different client instances. The
browser uses the default client (`VITE_API_BASE_URL`, no token).
`src/server/donations/directus.ts` creates a server-only client with the donation
service token, a timeout, Directus query serialization and `DirectusError`
mapping; import it only from server functions. Its reads call the generated
`readItems*` operations. Writes go through typed `create`/`update` helpers because
Directus' spec reuses read schemas for request bodies, marking `id` as required.
Directus returns only the requested `fields`, so responses are parsed with narrow
schemas derived from `zod.gen.ts` instead of the generated full-record validators.

`src/api/runtime-config.ts` uses `VITE_API_BASE_URL`, defaulting to
`http://localhost:8056`. Do not put admin credentials in any `VITE_` variable.
The Projects domain exports `getProjects`, `getProject`, `projectKeys`,
`projectsQueryOptions` and `projectQueryOptions` under
`src/api/collections/projects/`. Lists use language, limit (default 12, maximum 100) and offset (default 0); detail queries use UUID and language. Both reject
unpublished projects, missing/duplicate translations, invalid data and request
failures. Rich-text HTML is returned unchanged, not rendered; sanitize it at the
eventual display boundary.

The Campaigns domain (`src/api/collections/campaigns/`) exports
`getActiveCampaigns`/`activeCampaignsQueryOptions` (published campaigns that have
not ended, without bodies) and `getCampaignBySlug`/`campaignBySlugQueryOptions`
(body plus linked projects that are published and translated). Unknown or invalid
slugs throw `CampaignNotFoundError` without retrying. The home page shows active
campaigns and `/campaigns/<slug>` renders the sanitized body with the shared
`ArticleContent` table-of-contents layout.

`/projects` lists published projects with campaign badges and a single-campaign
filter. The unfiltered list includes projects without a campaign; filtering shows
only projects linked to the selected campaign. Opening a project from a campaign
filter carries that campaign context into the project detail route.

The Donation purposes domain (`src/api/collections/donation-purposes/`) exports
`getDonationPurposes`/`donationPurposesQueryOptions` (the published catalog for
one language, sorted by `sort` then slug) and `donationPurposeCategories`.
Purposes without a translation in the requested language are skipped, and
unpublished categories or projects are dropped from each purpose. `/donate`
loads this catalog through `useDonationPurposes`, derives its category filters
from the data and shows loading, error-with-retry and empty states; the flexible
amount works regardless. The basket is keyed by purpose slug and snapshots the
unit price when a gift is added, so checkout and thank-you totals do not depend
on the catalog request. Local images are matched by slug; purposes without one
show their category icon.

The router provides a React Query client (fresh per SSR router/request, shared in
the browser) using `src/integration/tanstack-query.ts`. Consume exported query
options with `useQuery`, or use that client's `fetchQuery`/`ensureQueryData` for
loading. Keys include all varying inputs. The temporary Directus serializer
handles nested JSON filters; it is not a generic serializer for other backends.

The Directus baseline migration (`directus/migrations/001-initial-schema.mjs`)
grants anonymous read access to published projects, campaigns, categories and
donation purposes only, and CORS allows `GET` from the website origin (see
`directus/README.md`). Project and campaign bodies and purpose descriptions are
rich-text HTML, sanitized before rendering. Seeds stay drafts unless setup runs with
`SEED_PUBLISH_DEMO=true`. Directus files remain private; never use an
administrator credential in a browser.

For an authenticated local integration check:

```bash
API_INTEGRATION=true node --env-file=directus/.env --test scripts/projects-api.test.mjs
```

It verifies private access and creates/deletes a synthetic published project and
translation to test the generated SDK, localization and rich HTML. Audit entries
remain; run only against a local development backend.

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

### Generated website imagery

Seven supplied Gemini images are integrated as illustrative artwork, not evidence
of real TunisAid projects or team members. Home uses the courtyard scene and
illustrated project covers; About uses the planning-table scene; What we do uses
the workshop scene above six unboxed support descriptions; Contact reuses the
planning-table scene because a separate contact image was not supplied. The real
team-photo placeholder is unchanged. Donate uses four tactile illustrations and
reuses the groceries image in its hero. Checkout and confirmation remain focused
on their existing, explicitly unavailable-payment behavior.

The original unoptimized `Gemini_Generated_Image_*.jpeg` files were removed after
conversion. Application code imports only WebP derivatives from `src/assets/images/optimized/` through
`src/lib/site-images.ts`. `ImagePanel` supplies responsive sources, intrinsic
dimensions, lazy loading (except priority hero images), reduced-motion-aware
entrances, and a token-based cream gradient wash. Generated editorial scenes have
localized alt text and visible AI disclosure; donation illustrations repeat the
adjacent content and have empty alt text with a disclosure below the collection.

Derivatives were encoded with the existing `cwebp` CLI at quality 80, method 6,
with metadata removed. Editorial widths are 800/1600px. Donation artwork is
cropped to 1792×1536 before resizing to 480×412 and 960×823, keeping subjects
intact while removing excess portrait whitespace:

The seven originals totaled 17,883,050 bytes. All fourteen responsive WebP files
combined total 574,684 bytes (96.8% smaller); each file is under 120 KB.

| Source filename suffix  | Output stem             | Crop origin |
| ----------------------- | ----------------------- | ----------- |
| `gje4kygje4kygje4.jpeg` | `everyday-independence` | Uncropped   |
| `4y67w54y67w54y67.jpeg` | `shared-purpose`        | Uncropped   |
| `semrvtsemrvtsemr.jpeg` | `room-to-participate`   | Uncropped   |
| `7d90o57d90o57d90.jpeg` | `donate-koffa`          | x=0, y=600  |
| `c0bkzyc0bkzyc0bk.jpeg` | `donate-mobility`       | x=0, y=520  |
| `oa4abdoa4abdoa4a.jpeg` | `donate-school`         | x=0, y=480  |
| `gmodlcgmodlcgmod.jpeg` | `donate-warmth`         | x=0, y=640  |

### Removing Tailwind CSS

If you prefer not to use Tailwind CSS:

1. Remove the demo pages in `src/routes/demo/`
2. Replace the Tailwind import in `src/styles.css` with your own styles
3. Remove `tailwindcss()` from the plugins array in `vite.config.ts`
4. Remove `@tailwindcss/vite` and `tailwindcss` from `package.json`

## Translations

### Donation components

Shared donation UI lives in `src/components/`: `PurposeCard`, `FilterGroup`,
`QuantityStepper`, `DonationSummary`, `DonationBasketSummary`, `DonationSteps`,
`IconLabel`, and the compact `DonationLayout`. Each visual component has stories.
The existing Button, GlassCard, IconChip, and SectionHeading remain the foundations.

`DonationProvider` owns an initially empty, in-memory basket. Amounts use integer
EUR cents and are formatted for the active language. Selection survives client-side
navigation while the provider remains mounted, but resets on a full reload; no
personal or payment information is stored. The `donation` translation namespace
contains matching English/German copy. Catalog prices are illustrative, not
validated procurement costs. Donors never choose a campaign: `/donate?campaign=<slug>`
(the campaign page's donate link) only pre-filters purposes to that campaign's
projects, and checkout derives each line's campaign. `CampaignProgress` shows
raised-so-far totals.

The `/donate` page implements Figma frame `47:314`: purpose cards, category
filters, an editable local basket, flexible amounts, and the giving journey.
The groceries hero and purpose covers use optimized supplied Gemini illustrations. The basket starts
empty rather than presenting the design's example €100 as an actual selection.
Flexible input accepts decimal points or commas and replaces the previous flexible
amount. All amounts are illustrative; real donation arrangements remain available
through `/contact`. A nonempty basket enables navigation to `/donate/checkout`.

The checkout route implements Figma frame `47:318`, using the shared compact
layout and editable basket summary. The root owns the basket provider and chooses
exactly one header/footer pair per route; EN/DE switching remains available in
the compact layout. Direct visits with an empty basket show the empty state and a
working Change gifts link.

### Donation checkout

The flow is `/donate` → `/donate/checkout` → `/donate/mock-payment` →
`/donate/thank-you?reference=…&token=…`. Name, email and country are optional, and
names stay private by default. Server functions in
`src/api/collections/donations/functions.ts` call `src/server/donations/` with
the Directus service token; the token and signing secret never reach the browser.

- **Checkout** reprices every line from published purposes, rejects changed
  prices (the form refreshes the basket) and checks the amount limits. Each line's
  campaign is derived from purpose → project → the project's open campaign;
  flexible amounts and unlinked purposes are general. A project in more than one
  open campaign fails with `campaign_conflict`. It then creates the donor (only if
  details were given), one `pending` checkout with one payment attempt, one
  donation per campaign (plus one general donation when needed) and the items
  with title snapshots.
- **Mock payment** links are HMAC-signed for one attempt. Succeed, fail or cancel
  records an idempotent payment event (`mock:<event id>`) that moves the attempt
  and the pending checkout to a final status; repeats and late events change nothing.
- **Thank-you** shows a signed, personal-data-free receipt that refreshes until
  the status is final; each line links to the campaign it counts toward, and a
  paid checkout clears the basket. Without parameters the page keeps its design
  preview, which states that no payment was processed.
- **Raised totals** on campaigns sum their donations whose checkout is paid,
  minus succeeded refunds. A receipt shows `partially_refunded`/`refunded`
  derived from linked succeeded refunds; the stored checkout status stays `paid`.

Run `node directus/scripts/init-env.mjs` to create the root `.env` (keys are listed
in `.env.example`). Checkout is disabled unless `DIRECTUS_SERVICE_TOKEN`,
`DONATION_SIGNING_SECRET` and `PAYMENT_PROVIDER=mock` are set, and the mock is
refused when `NODE_ENV=production` unless `ALLOW_MOCK_PAYMENTS=true`. Refunds
are recorded by staff in Directus after they were issued at the provider (see
`directus/README.md`).

Not done yet: a real payment provider and webhook route, email receipts, rate
limiting and expiry of abandoned pending donations. Privacy and terms copy must be finalized before going live.

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

The Home page renders the hero, impact, projects, values, get-involved, partners, and donation sections from `src/pages/home/components/`, followed by the shared contact strip. The shared site footer is rendered once in the root shell on every route, outside the page's main landmark. The hero uses the supplied generated courtyard scene with a visible illustration disclosure and an inline support note instead of floating decorative cards. Its actions link to `/contact` and `/what-we-do`; the impact and project actions also link to `/what-we-do`. Individual project detail routes are not implemented yet.

Both sections compose `src/components/section-heading.tsx`, a shared animated heading with optional eyebrow and description, left/center alignment, inverse styling, and semantic heading levels. The impact section displays the four design-provided statistics as a responsive definition list. Entrance, hover, and floating motion respect reduced-motion preferences. Brand colors, glass surfaces, and gradients live in `src/styles.css`. Stories cover the hero, impact section, and shared heading variants.

Reusable cards live in `src/components/`: `GlassCard` provides light/inverse glass surfaces and reduced-motion-aware reveal/float animations; `StatCard` composes it for label/value pairs and must be placed inside a `<dl>`; `InfoCard` composes it for an icon, title, and description. The impact statistics and hero support note use these shared components. Keep section-specific content, decoration, and layout in the page components rather than duplicating shared card styling.

`ProjectCard` provides gradient covers, category tags, titles, excerpts, and a caller-supplied action. `ValueCard` provides an icon, heading, and description on the soft `GlassCard` variant; project cards use the solid variant. `IconChip` is shared by value cards and info cards. These reusable components and their stories live outside page folders. Projects and Values use typed English/German content under `home.projects` and `home.values`; the supplied SVG icons and glass decorations are stored locally.

`ActionCard` composes `GlassCard` and `IconChip` with a title, description, and caller-supplied action. Its featured variant uses a lagoon glass surface; the shared Button's `sun` variant supplies the highlighted donation CTA. `PartnerCard` provides a reusable initials badge, name, and description with lagoon, sun, or terracotta tones. Both cards inherit reduced-motion-aware entrance and hover animations. Get involved uses `home.getInvolved` translations, with contact, material donations, and volunteering linking to `/contact`, and financial donations linking to `/donate`. Partners uses `home.partners` translations and retains the design's initials placeholders for APH EL AJA, AAHPDC, and ARASO; actual partner logos have not been supplied. All new icons and decorative SVGs are local assets, and stories cover both sections and shared card variants.

`CtaBanner` provides an animated heading, description, caller-supplied actions, and optional decorative content. The donation section composes it with local Figma decorations and links to `/donate` and `/contact`. `ContactStrip` presents a rounded lagoon-tinted panel on the cream background with a localized introduction, divider, and responsive contact-method grid. Its shared `ContactItem` components use 52px white icon chips, lagoon labels, and working map, email, and telephone links; the design-provided contact details live in `src/lib/site-contact.ts` and are reused by the footer. The footer provides route navigation and a localized copyright year. Social profile controls are explicitly disabled placeholders with a coming-soon notice until real URLs are supplied. Footer colors are `brand-` tokens, and its outlined social controls use the shared Button's `footerOutline` variant. Copy uses `home.donation`, `siteContact`, and `siteFooter` English/German keys. Stories cover the banner, donation section, contact components, and footer; entrance animations respect reduced-motion preferences.

Contact items expand into soft glass cards on hover or keyboard focus, revealing localized descriptions with animated height and opacity. Their title buttons also toggle details on touch devices; Escape or leaving keyboard focus closes them. Contact links stay separate from the disclosure controls. Reduced-motion preferences disable the reveal transition, and only the active card expands rather than stretching its neighbors.

Homepage section backgrounds follow the approved Figma flow: cream to lagoon at the hero, lagoon to cream behind impact, cream to sun through projects, sun to cream through values, and a second lagoon flow through involvement and partners. The donation banner sits on a soft sun glow. Shared `brand-flow-*` gradient tokens keep adjacent section endpoints consistent; the footer uses its own subtle ink-to-teal gradient. Keep light-to-dark fades out of text areas; dark feature content belongs inside a readable rounded panel.

### About

The `/about` route composes its hero, story, team, and approach sections from `src/pages/about/components/`, followed by the shared contact panel. `StatementCard` provides the reusable labeled-statement layout for the hero snapshot and mission/vision cards, with white and lagoon treatments and reduced-motion-aware entrance and hover feedback. The team photograph remains an explicitly labeled placeholder until the original image is supplied. All About copy is translated into English and German; stories cover each section and the shared card.

The approved About copy gives November 2018 as the founding date, while existing Home copy says 2016. Both are preserved pending factual confirmation.

### What we do

The `/what-we-do` route has an animated editorial hero, six areas of support, an everyday-possibilities feature, three process steps, and a peach invitation banner. Its page-local sections live in `src/pages/what-we-do/components/`. The compact `StatementCard` treatment is reused for support areas and process steps; `CtaBanner` also supports an optional eyebrow and peach tone without changing its default Home appearance.

Backgrounds transition from cream through lagoon and back, then from cream to sun and back. The feature keeps its horizontal deep-lagoon-to-ink gradient inside a rounded panel on cream, rather than fading dark colors into the surrounding section. The hero action targets the support section; invitation actions lead to Donate and Contact. English/German copy and stories cover every section.

### Contact

The `/contact` route composes a welcome, direct-contact/message hub, conversation starters, and closing note from `src/pages/contact/components/`. The shared `DirectContactCard` links to email, telephone, and the Munich map location using the same contact data as the footer. Conversation starters reuse compact statement cards. Cream/lagoon transitions and a soft sun glow follow the approved Figma design.

The message form is intentionally unavailable until a delivery service is configured. A prominent localized notice directs visitors to the working email link; the fields and send button are disabled, and form submission is prevented. It does not collect, store, or send messages or display a false success state. Generated shadcn Input, Textarea, and Label primitives provide accessible labels and native field semantics; the first two have a reusable `brand` variant. Enable submission only alongside real delivery, validation, privacy handling, and explicit error/success feedback. English/German copy and stories cover every section, the unavailable form, and direct-contact cards.

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
