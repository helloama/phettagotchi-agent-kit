import type {
  PhettagotchiConfig,
  PetState,
  GameSave,
  Encounter,
  BattleResult,
  CatchResult,
  IdleExploration,
  BuildTxResult,
  LeaderboardEntry,
} from './types';
import { ensureWallet, signBase64Transaction } from './wallet';

const DEFAULT_BASE_URL = 'https://phettagotchi.com';

export class PhettagotchiClient {
  private baseUrl: string;
  private wallet: string;

  constructor(config?: PhettagotchiConfig) {
    this.baseUrl = (config?.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, '');
    if (config?.wallet) {
      this.wallet = config.wallet;
    } else {
      // Auto-detect from ~/.phettagotchi/keypair.json
      const { publicKey } = ensureWallet();
      this.wallet = publicKey;
    }
  }

  /** Get the wallet address */
  get walletAddress(): string {
    return this.wallet;
  }

  /** Build, sign locally, and submit a transaction in one call */
  async signAndSubmit(action: string, amount?: number): Promise<{ signature?: string; error?: string }> {
    const buildResult = await this.buildTx(action, amount);
    if (buildResult.error || !buildResult.transaction) {
      throw new Error(buildResult.error || 'No transaction returned');
    }
    const signedTx = signBase64Transaction(buildResult.transaction);
    return this.submitTx(signedTx);
  }

  // ========================================
  // Agent API
  // ========================================

  /** Get pet state, stats, timing, and balances */
  async getState(): Promise<PetState> {
    return this.get(`/api/agent/state/${this.wallet}`);
  }

  /** Build an unsigned transaction */
  async buildTx(action: string, amount?: number): Promise<BuildTxResult> {
    const body: Record<string, unknown> = { action, wallet: this.wallet };
    if (amount !== undefined) body.amount = amount;
    return this.post('/api/agent/build-tx', body);
  }

  /** Submit a signed transaction (base64) */
  async submitTx(signedTransaction: string): Promise<{ signature?: string; error?: string }> {
    return this.post('/api/agent/submit-tx', { signedTransaction });
  }

  // ========================================
  // Game API
  // ========================================

  /** Get game save data */
  async getSave(): Promise<GameSave> {
    return this.get(`/api/agent/game/save/${this.wallet}`);
  }

  /** Create a new game save */
  async createSave(trainerName: string): Promise<GameSave> {
    return this.post(`/api/agent/game/save/${this.wallet}`, {
      action: 'create',
      trainerName,
    });
  }

  /** Heal all party pets (costs 10 coins each) */
  async healParty(): Promise<{ success: boolean; message: string }> {
    return this.post(`/api/agent/game/save/${this.wallet}`, {
      action: 'heal_party',
    });
  }

  /** Trigger a wild encounter in a zone */
  async explore(zone?: string): Promise<{ success: boolean; encounter: Encounter; encounterToken: string; yourPet: Record<string, unknown> }> {
    return this.post(`/api/agent/game/explore/${this.wallet}`, { zone: zone || 'forest' });
  }

  /** Idle exploration — pet wanders autonomously (rate limited: 1 call / 5 min) */
  async exploreIdle(): Promise<IdleExploration> {
    return this.get(`/api/agent/game/explore-idle/${this.wallet}`);
  }

  /** Start a battle with an encounter */
  async battleStart(encounterToken: string): Promise<BattleResult> {
    return this.post(`/api/agent/game/battle/${this.wallet}`, {
      action: 'start',
      encounterToken,
    });
  }

  /** Execute a battle move (moveIndex 0-3) */
  async battleMove(battleToken: string, moveIndex: number): Promise<BattleResult> {
    return this.post(`/api/agent/game/battle/${this.wallet}`, {
      action: 'move',
      battleToken,
      moveIndex,
    });
  }

  /** Flee from a battle */
  async battleFlee(battleToken: string): Promise<BattleResult> {
    return this.post(`/api/agent/game/battle/${this.wallet}`, {
      action: 'flee',
      battleToken,
    });
  }

  /** Attempt to catch a weakened wild pet */
  async catch(battleToken: string, ballType: string = 'phetta_ball'): Promise<CatchResult> {
    return this.post(`/api/agent/game/catch/${this.wallet}`, {
      battleToken,
      ballType,
    });
  }

  /** Find a PvP opponent */
  async pvpFind(): Promise<Record<string, unknown>> {
    return this.post(`/api/agent/game/pvp/${this.wallet}`, {
      action: 'find_opponent',
    });
  }

  /** Get leaderboard */
  async leaderboard(category: string = 'pvp_elo', limit: number = 20): Promise<{ rankings: LeaderboardEntry[] }> {
    return this.get(`/api/agent/game/leaderboard?category=${category}&limit=${limit}&wallet=${this.wallet}`);
  }

  // ========================================
  // Arena API (free, no wallet required)
  // ========================================

  /** Join the arena (free) */
  async arenaJoin(agentId: string, agentName: string): Promise<{ success: boolean; petType: string }> {
    return this.post('/api/arena/join', { agentId, agentName });
  }

  /** Send heartbeat to stay visible */
  async arenaHeartbeat(agentId: string): Promise<void> {
    await this.post('/api/arena/heartbeat', { id: agentId });
  }

  /** Report an action (speech bubble) */
  async arenaAction(agentId: string, action: string, message: string): Promise<void> {
    await this.post('/api/arena/action', { id: agentId, action, message });
  }

  /** Queue for arena PvP */
  async arenaQueuePvp(agentId: string, action: string = 'find_match', targetId?: string): Promise<Record<string, unknown>> {
    const body: Record<string, unknown> = { id: agentId, action };
    if (targetId) body.targetId = targetId;
    return this.post('/api/arena/queue-pvp', body);
  }

  // ========================================
  // Convenience Methods
  // ========================================

  /** Get the companion page URL for this wallet */
  get companionUrl(): string {
    return `${this.baseUrl}/companion?wallet=${this.wallet}`;
  }

  /** Get the badge SVG URL for this wallet */
  get badgeUrl(): string {
    return `${this.baseUrl}/api/badge/${this.wallet}`;
  }

  /** Get badge markdown for README */
  get badgeMarkdown(): string {
    return `[![Phettagotchi](${this.badgeUrl})](${this.companionUrl})`;
  }

  // ========================================
  // HTTP helpers
  // ========================================

  private async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`);
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(body.error || body.message || `HTTP ${res.status}`);
    }
    return res.json();
  }

  private async post<T>(path: string, body: Record<string, unknown>): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(data.error || data.message || `HTTP ${res.status}`);
    }
    return res.json();
  }
}
