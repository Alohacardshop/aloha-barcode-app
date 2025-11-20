# Aloha Barcode App (ACS-Barcode)

A Shopify embedded admin app for barcode scanning and inventory management at Aloha Card Shop.

## Features

- 📱 **Barcode Scanner**: Use device camera to scan barcodes with automatic detection
- 🔍 **Product Lookup**: Search products by barcode or SKU
- 📦 **Inventory Management**: View and update inventory levels across locations
- 🏪 **Shopify Integration**: Fully embedded in Shopify Admin with OAuth
- 🎨 **Polaris UI**: Clean, professional interface using Shopify's design system
- 🖨️ **Label Designer**: Visual drag-and-drop label designer (legacy feature)
- 🏷️ **ZPL Generation**: Barcode label generation for thermal printers

## Prerequisites

- Node.js 18+ and npm
- Shopify Partner account
- Shopify CLI installed (`npm install -g @shopify/cli @shopify/app`)
- Development store (acs-barcode-dev.myshopify.com or your own)

## Quick Start

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Configure Environment Variables

Create `.env.local` in the project root:

```env
SHOPIFY_API_KEY=your_api_key_from_partners
SHOPIFY_API_SECRET=your_api_secret_from_partners
SCOPES=read_products,write_products,read_inventory,write_inventory
HOST=localhost:3000
NEXT_PUBLIC_SHOPIFY_API_KEY=your_api_key_from_partners
```

**Important:** 
- The `SHOPIFY_API_KEY` will be exposed to the client as `NEXT_PUBLIC_SHOPIFY_API_KEY` for App Bridge
- For local development with ngrok, you'll update `HOST` to your ngrok URL

### Step 4: Using ngrok in Development

Since Shopify requires HTTPS for embedded apps, you'll need to use ngrok to tunnel your local server.

1. **Install ngrok:**
### Step 3: Run with Shopify CLI

The easiest way to develop is using Shopify CLI which handles tunneling automatically:

```bash
shopify app dev
```

This will:
- Start the Next.js development server
- Create a secure tunnel (no need for ngrok)
- Update your app configuration automatically
- Provide you with a URL to install/test the app

### Step 4: Install the App

1. Follow the URL provided by `shopify app dev`
2. Select your development store (acs-barcode-dev.myshopify.com)
3. Click "Install app"
4. Approve the permissions (products, inventory)

### Step 5: Test the Features

1. **Main Dashboard** (`/app`):
   - Enter a barcode or SKU manually
   - Click "Lookup Product" to search
   - View product details and inventory levels
   - Adjust inventory quantities

2. **Barcode Scanner** (`/app/barcode`):
   - Click "Start Camera Scanner"
   - Allow camera permissions in your browser
   - Point camera at a barcode
   - Product will be looked up automatically

3. **Test API** (`/api/test`):
   - Visit this endpoint to verify Shopify connection
   - Returns shop info and sample products

## API Endpoints

### `POST /api/lookup-product`
Search for a product by barcode or SKU.

**Request:**
```json
{
  "barcode": "123456789"
}
```

**Response:**
```json
{
  "productId": "gid://shopify/Product/123",
  "productTitle": "Sample Product",
  "variantId": "gid://shopify/ProductVariant/456",
  "variantTitle": "Default Title",
  "sku": "ABC-123",
  "barcode": "123456789",
  "inventoryItemId": "gid://shopify/InventoryItem/789",
  "inventoryLevels": [
    {
      "locationId": "gid://shopify/Location/1",
      "locationName": "Main Store",
      "available": 10
    }
  ]
}
```

### `POST /api/update-inventory`
Update inventory quantity at a specific location.

**Request:**
```json
{
  "inventoryItemId": "gid://shopify/InventoryItem/789",
  "locationId": "gid://shopify/Location/1",
  "newQuantity": 15
}
```

**Response:**
```json
{
  "success": true,
  "message": "Inventory updated successfully from 10 to 15",
  "previousQuantity": 10,
  "newQuantity": 15,
  "adjustment": 5
}
```

### `GET /api/test`
Test endpoint to verify Shopify API connection and permissions.

## Project Structure

```
aloha-barcode-app/
├── app/                    # Next.js app directory
│   ├── (app)/             # App routes (embedded in Shopify)
│   │   ├── page.tsx       # Main dashboard with barcode lookup
│   │   ├── barcode/       # Camera barcode scanner page
│   │   ├── designer/      # Label designer (legacy)
│   │   └── products/      # Product management (legacy)
│   ├── api/               # API routes
│   │   ├── auth/          # OAuth authentication
│   │   ├── lookup-product/ # Product search by barcode/SKU
│   │   ├── update-inventory/ # Inventory adjustment
│   │   ├── test/          # Connection test endpoint
│   │   └── ...            # Other API routes
│   ├── layout.tsx         # Root layout
│   ├── client-layout.tsx  # Client-side layout wrapper
│   └── providers.tsx      # App Bridge & Polaris providers
├── components/            # React components
├── lib/                   # Utilities and helpers
│   ├── shopify.ts        # Shopify API client
│   ├── auth-helpers.ts   # Authentication helpers
│   ├── logger.ts         # Error logging utility
│   ├── session-storage.ts # Session management
│   └── types.ts          # TypeScript types
├── shopify.app.toml      # Shopify app configuration
└── .env.local           # Environment variables (not committed)
```

## Technologies Used

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Shopify App Bridge**: Embedded app integration
- **Shopify Polaris**: UI component library
- **html5-qrcode**: Barcode scanning library
- **Shopify Admin API**: GraphQL API for products and inventory
- **File-based Sessions**: Simple session storage

## Development

- `npm run dev` - Start development server (port 3000)
- `shopify app dev` - Start with Shopify CLI (recommended)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Troubleshooting

### Camera Not Working
- Ensure you're using HTTPS or localhost
- Check browser permissions for camera access
- Try a different browser (Chrome/Edge recommended)

### Authentication Issues
- Verify your API key and secret in `.env.local`
- Make sure scopes are correct in `shopify.app.toml`
- Run `shopify app config push` to update app configuration
- Reinstall the app on your development store

### Product Not Found
- Ensure products have barcodes or SKUs set in Shopify
- Check that your app has the correct permissions
- Verify inventory tracking is enabled for the product

### Inventory Update Fails
- Confirm `write_inventory` scope is approved
- Check that the location exists and is active
- Ensure inventory item is tracked

## Production Deployment

### Option 1: Vercel (Recommended for Next.js)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy
5. Update `shopify.app.toml` with production URL

### Option 2: Shopify Hosting

```bash
shopify app deploy
```

This will deploy your app to Shopify's infrastructure.

## Security Notes

- Never commit `.env.local` to version control
- Keep session files (`.sessions/`) out of git
- Use environment variables for all secrets
- Validate all API inputs
- Use HTTPS in production

## License

Proprietary - Aloha Card Shop

## Support

For issues or questions, contact the development team.

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
