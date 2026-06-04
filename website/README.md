This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app), featuring a customized **Three.js / React Three Fiber** integration for rendering 3D hypercube network visualizations in real time.

## API Usage for C++ Integration

This visualization frontend accepts routing sequence updates dynamically via a local REST API endpoint. The C++ algorithm or script should push permutation packets directly to this frontend node. 

### `[GET] /api/state`
Returns the structural state currently held in memory and being rendered to the browser.
```json
{
  "dimension": 3,
  "nodes": [
    { "id": 0, "packet": 0 },
    { "id": 1, "packet": 1 },
    ...
  ]
}
```

### `[POST] /api/state`
Updates the visualizer's global state memory.

**1. Full State Override**
Push a complete hypercube dimension map and target packet locations here.
**Headers:** `Content-Type: application/json`
**Body:**
```json
{
  "dimension": 3,
  "nodes": [
    { "id": 0, "packet": 3 },
    { "id": 1, "packet": 0 },
    { "id": 2, "packet": 1 }
  ]
}
```

**2. Swap Adjacent Nodes**
Provide a swap action targeting two adjacent node indices. The API enforces mathematical adjacency—the binary representation of the two node IDs must differ by exactly 1 bit. Swapping arbitrary nodes will be rejected mathematically with a `403 Forbidden` response.
**Headers:** `Content-Type: application/json`
**Body:**
```json
{
  "action": "swap",
  "node1": 0,
  "node2": 1
}
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
