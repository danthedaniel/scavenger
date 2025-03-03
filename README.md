# Hippie Hill Hunt

<div align="center">
  <img src="/public/images/screenshot_start.png" alt="Start screen" width="300"/>
  <img src="/public/images/screenshot_focus.png" alt="Zone selected" width="300"/>
</div>

## About the Game

The Hippie Hill Hunt is an interactive mobile web experience that guides visitors through various zones in San Francisco's Golden Gate Park. Players explore different areas of the park, looking for hidden QR code stickers at notable locations. Each zone has its own unique hints - starting with a cryptic haiku and progressing to more direct clues if needed.

When players find a sticker, they can either scan the QR code or manually enter the code to mark that zone as discovered. The game tracks progress and allows players to share their completion results, including how many hints they needed for each zone.

The experience emphasizes respectful exploration - all stickers are placed in publicly accessible areas, and players are encouraged to stay on designated paths while enjoying their hunt through the park.

## Development

### Prerequisites

- Node.js 22.x
- Yarn package manager (v4.5.0 or later)
- Supabase (local or remote)

### Getting Started

1. Clone the repository

```
git clone https://github.com/danthedaniel/scavenger.git
cd scavenger
```

2. Install dependencies

```
yarn install
```

3. Install and run Supabase locally

```
npx supabase start
```

4. Set up environment variables

```
cp .env.example .env
```

Edit `.env` with your Supabase credentials and other required values.

5. Start the development server

```
yarn dev
```

The app will be available at `http://localhost:3000`

## Technical Overview

### Core Technologies

- **Frontend**: Next.js with TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase for data storage
- **Maps**: Custom SVG-based interactive map implementation
- **PWA Features**: Installable web app

### Architecture

The application uses React Context for state management, with modular components handling different aspects of the game experience. The map implementation uses SVG for efficient rendering and interaction, while game state persists through local storage and Supabase.

## License

### Code

AGPL-3.0 - See `/LICENSE` file for details

### Design Assets

CC0 - See `/assets/LICENSE` for details
