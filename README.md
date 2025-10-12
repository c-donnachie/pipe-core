# PipeCore

Integration Connector for Uber Direct, Rappi, Twilio, and more.

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables
Copy the `.env.example` file to `.env` and fill in your Uber Direct OAuth credentials:
```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=3000

# Get these from your Uber Direct Dashboard
UBER_DIRECT_CLIENT_ID=your_client_id_here
UBER_DIRECT_CLIENT_SECRET=your_client_secret_here
UBER_DIRECT_CUSTOMER_ID=your_customer_id_here

# These can remain as defaults
UBER_AUTH_URL=https://auth.uber.com/oauth/v2/token
UBER_BASE_URL=https://api.uber.com/v1
```

**Where to get credentials:**
1. Go to [Uber Direct Dashboard](https://direct.uber.com)
2. Navigate to API settings
3. Copy your `client_id`, `client_secret`, and `customer_id`

### 3. Start the server
```bash
npm run start:dev
```

The server will start at `http://localhost:3000`

## 📚 API Documentation

Interactive API documentation is available via Swagger UI:

- **Swagger UI**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

The Swagger interface provides:
- Complete API endpoint documentation
- Request/response schemas with examples
- Interactive "Try it out" functionality
- Authentication configuration options
- Real-time testing of all endpoints

## 📡 API Endpoints

### POST /uber/create-delivery

Create a new Uber Direct delivery.

**Headers:**
- `Content-Type: application/json`
- `x-uber-token` (optional): Custom access token. If not provided, uses OAuth to get a token automatically
- `x-uber-customer-id` (optional): Custom customer ID. If not provided, uses `UBER_DIRECT_CUSTOMER_ID` from `.env`

**Authentication Flow:**
1. By default, the API automatically obtains an OAuth token using your credentials
2. Tokens are cached for 30 days and reused across requests
3. You can override with a custom token via the `x-uber-token` header

**Request Body:**
```json
{
  "pickup": {
    "address": "123 Main St, City, State 12345",
    "name": "Restaurant Name",
    "phone_number": "+1234567890",
    "instructions": "Call on arrival"
  },
  "dropoff": {
    "address": "456 Oak Ave, City, State 12345",
    "name": "Customer Name",
    "phone_number": "+0987654321",
    "instructions": "Leave at door"
  },
  "manifest": [
    {
      "name": "Food order",
      "quantity": 2,
      "size": "medium"
    }
  ]
}
```

**Example with curl (using automatic OAuth):**
```bash
curl -X POST http://localhost:3000/uber/create-delivery \
  -H "Content-Type: application/json" \
  -d '{
    "pickup": {
      "address": "123 Main St, City, State 12345"
    },
    "dropoff": {
      "address": "456 Oak Ave, City, State 12345"
    }
  }'
```

**Example with custom token and customer ID:**
```bash
curl -X POST http://localhost:3000/uber/create-delivery \
  -H "Content-Type: application/json" \
  -H "x-uber-token: YOUR_CUSTOM_TOKEN" \
  -H "x-uber-customer-id: YOUR_CUSTOMER_ID" \
  -d '{
    "pickup": {
      "address": "123 Main St, City, State 12345"
    },
    "dropoff": {
      "address": "456 Oak Ave, City, State 12345"
    }
  }'
```

## 🏗️ Project Structure

```
pipecore/
├── src/
│   ├── app.module.ts              # Root module
│   ├── main.ts                    # Application entry point
│   ├── uber/                      # Uber Direct integration module
│   │   ├── uber.module.ts         # Module definition
│   │   ├── uber.controller.ts     # REST API endpoints
│   │   ├── uber.service.ts        # Business logic for deliveries
│   │   ├── uber-auth.service.ts   # OAuth authentication & token caching
│   │   ├── uber.dto.ts            # Data validation schemas
│   │   └── types.ts               # TypeScript interfaces
│   └── common/
│       └── env.ts                 # Environment configuration
├── .env.example
├── package.json
└── tsconfig.json
```

## 🔧 Future Integrations

This project is designed to scale. Future modules will include:
- Rappi delivery integration
- Twilio messaging
- Payment gateways
- And more...

## 📝 Available Scripts

- `npm run start:dev` - Start in development mode with hot reload
- `npm run start` - Start in production mode
- `npm run build` - Build the project
- `npm run lint` - Lint the code
- `npm run format` - Format code with Prettier

## 🛡️ Features

**OAuth 2.0 Authentication:**
- Automatic token retrieval using client credentials
- 30-day token caching (tokens are reused until expiration)
- Auto-refresh when tokens expire
- Rate limit aware (100 requests/hour for token generation)

**API Documentation:**
- Interactive Swagger/OpenAPI documentation
- Live testing environment with "Try it out" functionality
- Complete request/response schemas with examples
- Accessible at `/api/docs` endpoint

**Error Handling:**
- Validates request payloads with class-validator
- Comprehensive logging for all requests and errors
- Returns meaningful error messages
- Handles Uber API errors gracefully

**Production Ready:**
- TypeScript for type safety
- NestJS framework for scalability
- Modular architecture for easy extension
- Environment-based configuration

## 📄 License

MIT
# pipe-core
