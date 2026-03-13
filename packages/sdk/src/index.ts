export { PhettagotchiClient } from './client';
export {
  ensureWallet,
  generateWallet,
  loadKeypair,
  getPublicKey,
  walletExists,
  signTransaction,
  signBase64Transaction,
  getKeypairPath,
  getWalletDir,
} from './wallet';
export type {
  PetState,
  GameSave,
  Encounter,
  BattleResult,
  CatchResult,
  IdleExploration,
  IdleStep,
  BuildTxResult,
  LeaderboardEntry,
  PhettagotchiConfig,
} from './types';
