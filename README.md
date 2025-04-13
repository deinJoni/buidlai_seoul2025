# BuidlAI Seoul 2025

![BuidlAI Seoul 2025 Logo](https://via.placeholder.com/800x200?text=BuidlAI+Seoul+2025)

## Overview

BuidlAI is an intelligent blockchain analytics platform developed during the Seoul Hackathon 2025. It leverages the power of AI to transform how users interact with and understand blockchain data. By combining NEAR AI, Flipside Crypto, SAGA, and Hyperbolic, we've created a platform that allows users to query on-chain data using natural language and receive personalized analytics tailored to their expertise level.

## Core Features

- **Natural Language Blockchain Analytics**: Ask questions about blockchain data in plain English
- **AI-Powered SQL Generation**: Automatically converts natural language queries into SQL
- **Intelligent Result Analysis**: Analyzes query results for insights and patterns
- **Personalized Response System**: Adapts explanations based on user expertise (beginner/advanced)
- **On-Chain Query Registry**: Stores all historical queries on SAGA Chainlet for reference and auditing

## Architecture

Our platform consists of several integrated components:

1. **React Frontend**: Multi-page application with TanStack Router for seamless navigation
2. **NEAR AI Integration**: Powers the natural language understanding and SQL generation
3. **Flipside Crypto API**: Executes SQL queries against blockchain data
4. **Hyperbolic Engine**: Personalizes responses based on user expertise
5. **SAGA Chainlet**: Stores historical queries on-chain as an immutable registry

<img width="881" alt="SCR-20250413-jayz" src="https://github.com/user-attachments/assets/4b7e808a-5064-4887-a5e5-f09804a334cb" />

## Technology Stack

- **Frontend**:
  - React 19
  - TanStack Router
  - TanStack Query
  - Tailwind CSS
  - RainbowKit & Wagmi for wallet connections

- **Blockchain**:
  - SAGA Chainlet for on-chain storage
  - Viem for Ethereum interactions

- **AI & Data**:
  - NEAR AI for SQL generation
  - Flipside Crypto for blockchain data
  - Mastra Client for AI agent interactions
  - Hyperbolic for response personalization

## How It Works

1. **User Submits a Question**: Through the intuitive interface, users can ask complex questions about blockchain data.

2. **AI Creates SQL Query**: NEAR AI converts the natural language question into optimized SQL queries.

3. **Query Execution**: The SQL is executed against Flipside Crypto's blockchain data.

4. **Data Analysis**: The results are analyzed to extract meaningful insights.

5. **Personalized Response**: Hyperbolic personalizes the explanation based on the user's expertise level, making it accessible for beginners while providing depth for advanced users.

6. **Storage on SAGA**: The query is stored on SAGA Chainlet, creating a permanent record of all historical queries.

## Use Cases

- Blockchain researchers seeking to analyze token movements
- DeFi users wanting insights about protocols and market conditions
- Developers needing data for dApp planning and execution
- Crypto newcomers looking to understand blockchain patterns
- Enterprises exploring blockchain adoption possibilities

## Installation & Setup

```bash
# Clone the repository
git clone https://github.com/your-username/buidlai_seoul2025.git
cd buidlai_seoul2025

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Start the development server
pnpm dev
```

Built with at Seoul Hackathon 2025
