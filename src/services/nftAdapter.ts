import { ChogCharacter, ChogTraits } from '../types/game';
import { getCharacterById } from '../data/characters';

export interface NFTVerificationResult {
  isVerified: boolean;
  isSimulation: boolean;
  network: string;
  contractAddress: string | null;
  tokenId: string;
  ownerAddress: string | null;
  character: ChogCharacter;
  traits: ChogTraits;
  verificationBadgeText: string;
  statusNote: string;
}

export interface NFTVerifierAdapter {
  verifyCharacter(characterId: string, walletAddress?: string): Promise<NFTVerificationResult>;
}

/**
 * DemoNFTVerifier implementation.
 * Operates in local simulation mode for instant play without wallet requirements.
 * Explicitly labels all verification results as SIMULATED.
 */
export class DemoNFTVerifier implements NFTVerifierAdapter {
  async verifyCharacter(characterId: string, walletAddress?: string): Promise<NFTVerificationResult> {
    const character = getCharacterById(characterId);

    // Simulate short network delay for async contract read
    await new Promise((resolve) => setTimeout(resolve, 80));

    return {
      isVerified: true,
      isSimulation: true,
      network: 'Monad Testnet (Simulated)',
      contractAddress: '0xChogGenesis0000000000000000000000000000',
      tokenId: character.simulatedTokenId,
      ownerAddress: walletAddress || '0xDemo...ChogPlayer',
      character,
      traits: character.traits,
      verificationBadgeText: 'SIMULATED DEMO MODE',
      statusNote: 'Using local demo character preset. No real Monad wallet or NFT ownership required.',
    };
  }
}

/**
 * MonadNFTVerifier stub interface.
 * Ready for future production integration with ethers.js/viem + Monad EVM RPC.
 */
export class MonadNFTVerifier implements NFTVerifierAdapter {
  private rpcUrl: string;
  private contractAddress: string;

  constructor(rpcUrl = 'https://testnet-rpc.monad.xyz', contractAddress = '0xChogGenesisContractAddress') {
    this.rpcUrl = rpcUrl;
    this.contractAddress = contractAddress;
  }

  async verifyCharacter(characterId: string, walletAddress?: string): Promise<NFTVerificationResult> {
    if (!walletAddress) {
      throw new Error('Wallet address required for real Monad NFT verification');
    }
    
    // In production, query ownerOf(tokenId) or balanceOf(address) on Monad contract using rpcUrl
    // For now, fallback cleanly to notice:
    const character = getCharacterById(characterId);
    return {
      isVerified: false,
      isSimulation: false,
      network: 'Monad Mainnet/Testnet (EVM)',
      contractAddress: this.contractAddress,
      tokenId: character.simulatedTokenId,
      ownerAddress: walletAddress,
      character,
      traits: character.traits,
      verificationBadgeText: 'UNVERIFIED WALLET',
      statusNote: `Connect Monad wallet to verify ownership of ${character.name} on contract ${this.contractAddress}`,
    };
  }
}

// Global singleton instance for app state
export const defaultNFTVerifier: NFTVerifierAdapter = new DemoNFTVerifier();
