/**
 * Phettagotchi Wallet — Auto-generate and manage a Solana keypair
 *
 * Stores keypair at ~/.phettagotchi/keypair.json
 * Used by the MCP server for automatic wallet provisioning.
 */

import { Keypair, Transaction, VersionedTransaction } from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const WALLET_DIR = path.join(os.homedir(), '.phettagotchi');
const KEYPAIR_FILE = 'keypair.json';

export function getWalletDir(): string {
  return WALLET_DIR;
}

export function getKeypairPath(dir?: string): string {
  return path.join(dir || WALLET_DIR, KEYPAIR_FILE);
}

/** Check if a wallet keypair exists on disk */
export function walletExists(dir?: string): boolean {
  return fs.existsSync(getKeypairPath(dir));
}

/** Generate a new Solana keypair and save to disk */
export function generateWallet(dir?: string): { publicKey: string; path: string } {
  const keypair = Keypair.generate();
  const targetDir = dir || WALLET_DIR;
  const targetPath = getKeypairPath(targetDir);

  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(targetPath, JSON.stringify(Array.from(keypair.secretKey)), { mode: 0o600 });

  return { publicKey: keypair.publicKey.toBase58(), path: targetPath };
}

/** Load keypair from disk */
export function loadKeypair(dir?: string): Keypair {
  const keypairPath = getKeypairPath(dir);
  if (!fs.existsSync(keypairPath)) {
    throw new Error(
      `No wallet found at ${keypairPath}. Call generateWallet() or ensureWallet() first.`
    );
  }
  const data = JSON.parse(fs.readFileSync(keypairPath, 'utf-8'));
  return Keypair.fromSecretKey(Uint8Array.from(data));
}

/** Get the public key (wallet address) from the stored keypair */
export function getPublicKey(dir?: string): string {
  return loadKeypair(dir).publicKey.toBase58();
}

/** Sign a legacy Transaction with the stored keypair */
export function signTransaction(tx: Transaction, dir?: string): Buffer {
  const keypair = loadKeypair(dir);
  tx.sign(keypair);
  return Buffer.from(tx.serialize());
}

/**
 * Ensure a wallet exists — generate one if it doesn't.
 * Returns the public key, file path, and whether it was newly created.
 */
export function ensureWallet(dir?: string): { publicKey: string; path: string; created: boolean } {
  if (walletExists(dir)) {
    return { publicKey: getPublicKey(dir), path: getKeypairPath(dir), created: false };
  }
  const result = generateWallet(dir);
  return { ...result, created: true };
}

/**
 * Build, sign, and return a base64-encoded signed transaction.
 * Takes the base64 unsigned tx from the build-tx API response.
 */
export function signBase64Transaction(unsignedTxBase64: string, dir?: string): string {
  const keypair = loadKeypair(dir);
  const txBytes = Buffer.from(unsignedTxBase64, 'base64');
  const tx = Transaction.from(txBytes);
  tx.sign(keypair);
  return tx.serialize().toString('base64');
}
