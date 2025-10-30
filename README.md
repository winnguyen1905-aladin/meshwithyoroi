# API Structure Documentation

## Folder Organization

\`\`\`
app/api/
├── wallets/
│   ├── connect/route.ts          # POST - Connect wallet
│   ├── disconnect/route.ts       # POST - Disconnect wallet
│   └── balance/route.ts          # GET - Get wallet balance
├── transactions/
│   ├── build/route.ts            # POST - Build transaction
│   ├── sign/route.ts             # POST - Sign transaction
│   ├── submit/route.ts           # POST - Submit transaction
│   └── history/route.ts          # GET - Get transaction history
├── escrow/
│   ├── create/route.ts           # POST - Create escrow
│   ├── release/route.ts          # POST - Release escrow
│   └── list/route.ts             # GET - List escrows
└── users/
    ├── profile/route.ts          # POST - Update profile
    └── settings/route.ts         # POST - Update settings
\`\`\`

## API Endpoints

### Wallet Management
- `POST /api/wallets/connect` - Initiate wallet connection
- `POST /api/wallets/disconnect` - Disconnect wallet
- `GET /api/wallets/balance?address=<address>` - Get wallet balance

### Transactions
- `POST /api/transactions/build` - Build unsigned transaction
- `POST /api/transactions/sign` - Sign transaction
- `POST /api/transactions/submit` - Submit signed transaction
- `GET /api/transactions/history?address=<address>&limit=10` - Get transaction history

### Escrow Contracts
- `POST /api/escrow/create` - Create escrow contract
- `POST /api/escrow/release` - Release escrow funds
- `GET /api/escrow/list?address=<address>` - List user escrows

### User Management
- `POST /api/users/profile` - Update user profile
- `POST /api/users/settings` - Update user settings

## Usage Examples

### Using the API Client

\`\`\`typescript
import { apiClient } from '@/lib/api-client'

// Connect wallet
const result = await apiClient.connectWallet('Lace')

// Build transaction
const tx = await apiClient.buildTransaction(
  senderAddress,
  recipientAddress,
  '1000000',
  'deposit'
)

// Get balance
const balance = await apiClient.getBalance(address)
\`\`\`

## Best Practices

1. **Error Handling** - All endpoints return `{ success: boolean, data?: T, error?: string }`
2. **Validation** - Input validation is performed on all endpoints
3. **Security** - Implement proper authentication and authorization
4. **Scalability** - Routes are organized by feature for easy maintenance
5. **Type Safety** - Use TypeScript interfaces for all API responses
