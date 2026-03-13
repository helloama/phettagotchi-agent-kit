export interface PhettagotchiConfig {
  /** Base URL for the API. Defaults to https://phettagotchi.com */
  baseUrl?: string;
  /** Wallet address (Solana public key) */
  wallet: string;
}

export interface PetState {
  wallet: string;
  hasPet: boolean;
  message?: string;
  stats?: {
    streak: number;
    mood: number;
    moodLabel: string;
    multiplier: number;
    stakedAmount: number;
    pendingRewards: number;
    totalClaimed: number;
  };
  evolution?: {
    stage: string;
    emoji: string;
    daysToNextStage: number | null;
  };
  battleStats?: {
    level: number;
    hp: number;
    attack: number;
    defense: number;
    speed: number;
    element: string;
    elementEmoji: string;
  };
  timing?: {
    canFeed: boolean;
    timeUntilCanFeed: number;
    nextFeedAt: string | null;
    lastFeedAt: string | null;
    visualStreakAtRisk: boolean;
    onChainStreakAtRisk: boolean;
  };
  balances?: {
    phettaTokens: number;
    stakedPhetta: number;
    pendingRewards: number;
  };
  program?: {
    programId: string;
    phettaMint: string;
  };
}

export interface GameSave {
  hasSave: boolean;
  trainerName?: string;
  level?: number;
  xp?: number;
  coins?: number;
  battleStats?: {
    totalBattles: number;
    wins: number;
    losses: number;
    winStreak: number;
    maxWinStreak: number;
  };
  activePet?: {
    id: string;
    petType: string;
    nickname: string;
    level: number;
    hp: number;
    maxHp: number;
  };
  ownedPets?: Array<{
    id: string;
    petType: string;
    nickname: string;
    level: number;
  }>;
}

export interface Encounter {
  id: string;
  petType: string;
  petName: string;
  element: string;
  level: number;
  hp: number;
  maxHp: number;
  isShiny: boolean;
  shinyVariant: string;
  difficulty: string;
  encounterToken: string;
}

export interface BattleResult {
  success: boolean;
  battleStatus: 'ongoing' | 'victory' | 'defeat' | 'fled';
  battleToken?: string;
  turn?: number;
  yourPet?: { hp: number; maxHp: number };
  wildPet?: { hp: number; maxHp: number };
  lastMove?: string;
  xpGained?: number;
  message?: string;
}

export interface CatchResult {
  success: boolean;
  caught: boolean;
  message: string;
  pet?: {
    id: string;
    petType: string;
    nickname: string;
    level: number;
  };
}

export interface IdleStep {
  type: 'walk' | 'encounter' | 'item' | 'nothing';
  biome: string;
  terrain: string;
  distance: number;
  description: string;
  encounter?: {
    petType: string;
    petName: string;
    level: number;
    element: string;
    isShiny: boolean;
    shinyVariant: string;
    encounterToken: string;
  };
  item?: {
    name: string;
    rarity: string;
    value: number;
  };
}

export interface IdleExploration {
  success: boolean;
  wallet: string;
  pet: {
    id: string;
    nickname: string;
    petType: string;
    level: number;
  };
  exploration: {
    stepCount: number;
    totalDistance: number;
    steps: IdleStep[];
  };
  summary: {
    encounters: number;
    itemsFound: number;
    biomesVisited: string[];
  };
  rateLimitReset: number;
}

export interface BuildTxResult {
  success?: boolean;
  transaction?: string;
  error?: string;
  message?: string;
}

export interface LeaderboardEntry {
  rank: number;
  wallet?: string;
  displayName: string;
  value: number;
}
