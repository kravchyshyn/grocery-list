# Grocery List

A single-page Angular application for managing a personal grocery list with user authentication, item pricing, and multi-currency totals.

## Tech Stack

- **Angular 21** (standalone components, signals)
- **json-server** — mock REST API (`db.json`)
- **Karma + Jasmine** — unit tests
- **Prettier** — code formatting

## Features

- **Authentication** — register, log in, or continue as a guest (session persisted in `localStorage`)
- **CRUD** — add, edit, and delete grocery items
- **Mark as bought** — toggle purchased state per item
- **Pricing** — optional price field with currency selection (UAH ₴, USD $, EUR €)
- **Totals** — live spending summary for bought items, grouped by currency
- **Pagination** — 10 items per page with previous/next navigation
- **Test data** — generate 20 seed items in one click

## Getting Started

### Prerequisites

- Node.js 18+
- npm 10+

### Install dependencies

```bash
npm install
```

### Run the app (API + dev server together)

```bash
npm run dev
```

This starts json-server on `http://localhost:3000` and the Angular dev server on `http://localhost:4200` concurrently.

Or run them separately:

```bash
npm run api    # json-server on :3000
npm run start  # Angular dev server on :4200
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start API + Angular dev server concurrently |
| `npm run start` | Angular dev server only (`ng serve`) |
| `npm run api` | json-server mock API only |
| `npm run build` | Production build to `dist/` |
| `npm test` | Run unit tests (watch mode) |
| `npm run test:ci` | Run unit tests once (CI) |
| `npm run test:coverage` | Run unit tests with coverage report |
| `npm run format` | Format all files with Prettier |
| `npm run format:check` | Check formatting without writing |

## Project Structure

```
src/
  app/
    components/
      grocery-list/   # Main list view with pagination and totals
      grocery-item/   # Individual item row (toggle, edit, delete)
      item-form/      # Add / edit form
      login/          # Login page
      register/       # Registration page
    guards/           # authGuard / noAuthGuard route protection
    models/           # GroceryItem, User types
    services/         # GroceryService, AuthService
db.json               # json-server data store
```

## API

json-server exposes a REST API at `http://localhost:3000`:

| Endpoint | Description |
|---|---|
| `GET /users` | List users |
| `POST /users` | Create user |
| `GET /items?userId=:id` | Get items for a user |
| `POST /items` | Add item |
| `PATCH /items/:id` | Update item |
| `DELETE /items/:id` | Delete item |