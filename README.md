# Aloha Barcode App

A Shopify embedded app for designing and printing barcode labels.

## Features

- 🏪 Shopify OAuth integration
- 🎨 Visual drag-and-drop label designer
- 🏷️ ZPL barcode generation
- 🔍 Product filtering (search, tags, recent)
- 💾 Label template persistence
- 🖨️ Print API endpoint
- 📦 Full Shopify embedded app experience

## Prerequisites

- Node.js 18+ and npm
- Shopify Partner account
- Shopify app created in Partner Dashboard
- ngrok (for local development with HTTPS)

## Setup

### Step 1: Create Shopify App in Partners Dashboard

1. Go to [Shopify Partners](https://partners.shopify.com/)
2. Navigate to **Apps** → **Create app**
3. Choose **Create app manually**
4. Fill in app details:
   - **App name**: Aloha Barcode App (or your choice)
   - **App URL**: We'll set this after starting ngrok
   - **Allowed redirection URL(s)**: We'll set this after starting ngrok
5. **Enable "Embedded app"** option
6. Note down your **API key** and **API secret key** from the app settings

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment Variables

Create `.env.local` in the project root:

```env
SHOPIFY_API_KEY=your_api_key_from_partners
SHOPIFY_API_SECRET=your_api_secret_from_partners
SCOPES=read_products,write_products
HOST=localhost:3000
```

**Important:** 
- The `SHOPIFY_API_KEY` will be exposed to the client as `NEXT_PUBLIC_SHOPIFY_API_KEY` for App Bridge
- For local development with ngrok, you'll update `HOST` to your ngrok URL

### Step 4: Using ngrok in Development

Since Shopify requires HTTPS for embedded apps, you'll need to use ngrok to tunnel your local server.

1. **Install ngrok:**
   - Download from [ngrok.com](https://ngrok.com/download)
   - Or use: `npm install -g ngrok`

2. **Start your Next.js dev server:**
   ```bash
   npm run dev
   ```

3. **In a separate terminal, start ngrok:**
   ```bash
   ngrok http 3000
   ```

4. **Copy the HTTPS URL** from ngrok (e.g., `https://abc123.ngrok.io`)

5. **Update `.env.local`:**
   ```env
   HOST=abc123.ngrok.io
   ```

6. **Update Shopify App Settings:**
   - Go back to your app in Shopify Partners
   - Set **App URL** to: `https://abc123.ngrok.io/api/auth`
   - Set **Allowed redirection URL(s)** to: `https://abc123.ngrok.io/api/auth/callback`
   - Save changes

**Note:** Each time you restart ngrok, you'll get a new URL. You'll need to update both `.env.local` and the Shopify app settings.

### Step 5: Run the Application

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Start ngrok** (in another terminal):
   ```bash
   ngrok http 3000
   ```

3. **Access the app:**
   - Install the app in your Shopify admin
   - Or navigate to: `https://your-ngrok-url.ngrok.io/api/auth?shop=your-shop.myshopify.com`

## Project Structure

```
aloha-barcode-app/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/         # OAuth authentication
│   │   ├── print/        # Print endpoint
│   │   ├── products/     # Products API
│   │   └── templates/    # Template management
│   └── (app)/            # App pages (with layout)
│       ├── products/     # Products page
│       └── designer/     # Label designer
├── components/            # React components
│   ├── LabelDesignerCanvas.tsx
│   ├── ProductFilters.tsx
│   ├── ProductList.tsx
│   └── ZPLPreview.tsx
├── data/                  # Template storage (JSON files)
├── lib/                   # Utilities
│   ├── shopify.ts        # Shopify API client
│   ├── session-storage.ts # Session storage
│   ├── auth-helpers.ts   # Auth utilities
│   ├── zpl-generator.ts  # ZPL code generator
│   ├── printer.ts        # Printer integration stub
│   └── types.ts          # TypeScript types
└── .sessions/            # OAuth session files
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## API Endpoints

### Authentication
- `GET /api/auth` - Initiate OAuth flow
- `GET /api/auth/callback` - Handle OAuth callback
- `GET /api/auth/exitiframe` - Exit iframe redirect

### Products
- `GET /api/products` - Fetch Shopify products
  - Query params: 
    - `days` (integer): Filter by creation date (e.g., `days=7` for last 7 days)
    - `tags` (comma-separated): Filter by tags (e.g., `tags=tag1,tag2`)
    - `search` (string): Search by product name, SKU, or barcode
    - `inStockOnly` (boolean, default: true): Only show products with inventory > 0
  - Example: `/api/products?days=7&tags=tag1,tag2&search=product&inStockOnly=true`

### Profiles
- `GET /api/profiles` - List all label profiles
- `POST /api/profiles` - Create/update a profile
  - Body: `{ id?, name, description?, design: LabelDesign, isDefault?: boolean }`
- `GET /api/profiles/default` - Get the default profile
- `POST /api/profiles/default` - Set a profile as default
  - Body: `{ id: string }`

### Templates
- `GET /api/templates` - List all templates
- `POST /api/templates` - Create/update a template
  - Body: `{ id?, name, design: LabelDesign }`
- `GET /api/templates/[id]` - Fetch a single template

### Print
- `POST /api/print` - Generate ZPL and send to printer
  - Single print: `{ productId, variantId?, quantity, design: LabelDesign }`
  - Bulk print: `{ items: Array<{productId, variantId?, quantity}>, design: LabelDesign }`
  - Returns: `{ success, zpl, quantity/count, message }`

## Printer Integration

The printer integration stub is located in `lib/printer.ts`. The `sendZplToPrinter()` function currently:

- Logs the ZPL to the server console
- Returns success

To integrate with an actual printer, you can:

1. **Use a local print service:**
   - Set up a helper service at `http://localhost:PORT/print`
   - Send POST request with ZPL data

2. **Direct TCP socket connection:**
   - Open a TCP socket to your Zebra printer's IP address (typically port 9100)
   - Send the ZPL string directly

3. **Network print service:**
   - Use a service like PrintNode, CUPS, or similar
   - Send ZPL via their API

See `lib/printer.ts` for implementation details and comments.

## Notes

- **Label Size**: Fixed at 2" × 1" (406 × 203 dots at 203 DPI) - cannot be changed
- **Session Storage**: Uses filesystem-based storage in `.sessions/` directory
- **Template Storage**: Templates are stored as JSON files in `data/templates/`
- **Profile Storage**: Profiles are stored as JSON files in `data/profiles/`
- **Print Integration**: Currently stubbed - see `lib/printer.ts` for integration guide
- **ngrok**: Required for local development with HTTPS
- **Inventory Tracking**: Inventory levels are fetched from Shopify but may require additional API permissions

## Troubleshooting

- **OAuth errors**: Make sure your ngrok URL matches in both `.env.local` and Shopify app settings
- **Session not found**: Clear `.sessions/` directory and re-authenticate
- **Templates not saving**: Ensure `data/templates/` directory exists and is writable
