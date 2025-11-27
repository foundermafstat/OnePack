# OnePack

A Sui blockchain dApp built with Next.js 16, featuring the BattlePackArena game.

## Project Structure

```
OnePack/
├── client/          # Next.js 16 frontend application
├── server/          # Backend server (to be implemented)
└── contracts/       # Sui Move smart contracts (to be implemented)
```

## Client

The client is a Next.js 16 application with:
- **BattlePackArena**: A grid-based inventory management game
- **Wallet Integration**: Sui wallet connection using @mysten/dapp-kit
- **Game Features**: Drag & drop items, merging, battles, shop system

### Getting Started

```bash
cd client
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Blockchain**: Sui (@mysten/dapp-kit, @mysten/sui)
- **UI**: Tailwind CSS, Lucide React icons
- **State Management**: @tanstack/react-query
- **Drag & Drop**: Custom implementation

## Git Setup

The repository is initialized in the root directory. To push to a remote:

```bash
git remote add origin <your-repository-url>
git branch -M main
git push -u origin main
```

