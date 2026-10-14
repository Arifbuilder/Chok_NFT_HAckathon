import { ethers } from 'ethers';
import { ChogCharacter, ChogTraits } from '../types/game';
import { getCharacterById } from '../data/characters';
import { MONAD_NFT_CONFIG, CHOG_ERC721_ABI } from '../config/nftConfig';

export interface VerifiedNFTItem {
  tokenId: string;
  name: string;
  imageUrl: string;
  description: string;
  traits: ChogTraits;
  characterObj: ChogCharacter;
}

export interface NFTVerificationResult {
  isVerified: boolean;
  isSimulation: boolean;
  network: string;
  contractAddress: string;
  tokenId: string;
  ownerAddress: string | null;
  character: ChogCharacter;
  traits: ChogTraits;
  verificationBadgeText: string;
  statusNote: string;
  ownedNFTs?: VerifiedNFTItem[];
}

export interface NFTVerifierAdapter {
  verifyCharacter(characterId: string, walletAddress?: string): Promise<NFTVerificationResult>;
  fetchWalletNFTs?(walletAddress: string): Promise<VerifiedNFTItem[]>;
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
      contractAddress: MONAD_NFT_CONFIG.contractAddress,
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
 * MonadNFTVerifier implementation.
 * Performs real ERC-721 contract verification on the Monad network.
 */
export class MonadNFTVerifier implements NFTVerifierAdapter {
  private rpcUrl: string;
  private contractAddress: string;

  constructor(
    rpcUrl = MONAD_NFT_CONFIG.network.rpcUrls[0],
    contractAddress = MONAD_NFT_CONFIG.contractAddress
  ) {
    this.rpcUrl = rpcUrl;
    this.contractAddress = contractAddress;
  }

  async verifyCharacter(characterId: string, walletAddress?: string): Promise<NFTVerificationResult> {
    if (!walletAddress) {
      const char = getCharacterById(characterId);
      return {
        isVerified: false,
        isSimulation: false,
        network: MONAD_NFT_CONFIG.network.name,
        contractAddress: this.contractAddress,
        tokenId: 'N/A',
        ownerAddress: null,
        character: char,
        traits: char.traits,
        verificationBadgeText: 'WALLET NOT CONNECTED',
        statusNote: 'Please connect your Monad Web3 wallet to verify Chog Genesis NFT ownership.',
      };
    }

    try {
      const ownedNFTs = await this.fetchWalletNFTs(walletAddress);
      
      if (ownedNFTs.length === 0) {
        const char = getCharacterById(characterId);
        return {
          isVerified: false,
          isSimulation: false,
          network: MONAD_NFT_CONFIG.network.name,
          contractAddress: this.contractAddress,
          tokenId: 'None',
          ownerAddress: walletAddress,
          character: char,
          traits: char.traits,
          verificationBadgeText: 'NO CHOG GENESIS NFT FOUND',
          statusNote: `Wallet ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)} does not hold a Chog Genesis NFT on contract ${this.contractAddress}.`,
          ownedNFTs: [],
        };
      }

      // Match character or pick first owned NFT
      const cleanTokenId = characterId.replace(/^nft-chog-/, '');
      const selectedItem =
        ownedNFTs.find(
          (item) =>
            item.tokenId === characterId ||
            item.tokenId === cleanTokenId ||
            item.characterObj.id === characterId
        ) || ownedNFTs[0];

      return {
        isVerified: true,
        isSimulation: false,
        network: MONAD_NFT_CONFIG.network.name,
        contractAddress: this.contractAddress,
        tokenId: `#${selectedItem.tokenId}`,
        ownerAddress: walletAddress,
        character: selectedItem.characterObj,
        traits: selectedItem.traits,
        verificationBadgeText: 'VERIFIED MONAD NFT HOLDER',
        statusNote: `Successfully verified ownership of Chog Genesis #${selectedItem.tokenId} on Monad.`,
        ownedNFTs,
      };
    } catch (err: any) {
      console.error('Monad NFT verification error:', err);
      const char = getCharacterById(characterId);
      return {
        isVerified: false,
        isSimulation: false,
        network: MONAD_NFT_CONFIG.network.name,
        contractAddress: this.contractAddress,
        tokenId: 'Error',
        ownerAddress: walletAddress,
        character: char,
        traits: char.traits,
        verificationBadgeText: 'VERIFICATION ERROR',
        statusNote: `Failed to query Monad RPC: ${err?.message || 'Network timeout'}`,
      };
    }
  }

  public async fetchWalletNFTs(walletAddress: string): Promise<VerifiedNFTItem[]> {
    const provider = new ethers.JsonRpcProvider(this.rpcUrl);
    const contract = new ethers.Contract(this.contractAddress, CHOG_ERC721_ABI, provider);

    // 1. Query balanceOf
    const balanceBN = await contract.balanceOf(walletAddress);
    const balance = Number(balanceBN);

    if (balance === 0) {
      return [];
    }

    const items: VerifiedNFTItem[] = [];

    // 2. Scan owned tokens
    for (let i = 0; i < Math.min(balance, 10); i++) {
      try {
        let tokenId = '';
        try {
          const tokenIdBN = await contract.tokenOfOwnerByIndex(walletAddress, i);
          tokenId = tokenIdBN.toString();
        } catch {
          // If tokenOfOwnerByIndex not supported, fallback to probing standard range
          tokenId = (i + 1).toString();
          const owner = await contract.ownerOf(tokenId);
          if (owner.toLowerCase() !== walletAddress.toLowerCase()) continue;
        }

        let tokenURI = '';
        try {
          tokenURI = await contract.tokenURI(tokenId);
        } catch {
          tokenURI = '';
        }

        const metadata = await this.parseTokenURI(tokenURI, tokenId);
        const traits = this.extractTraitsFromAttributes(metadata.attributes);
        const charObj = this.buildCharacterFromNFT(tokenId, metadata.name, metadata.image, traits, walletAddress);

        items.push({
          tokenId,
          name: metadata.name || `Chog Genesis #${tokenId}`,
          imageUrl: metadata.image,
          description: metadata.description || 'Verified Chog Genesis NFT on Monad.',
          traits,
          characterObj: charObj,
        });
      } catch (err) {
        console.warn(`Failed to process NFT index ${i}:`, err);
      }
    }

    return items;
  }

  private async parseTokenURI(tokenURI: string, tokenId: string): Promise<{ name: string; description: string; image: string; attributes: any[] }> {
    if (!tokenURI) {
      return {
        name: `Chog Genesis #${tokenId}`,
        description: 'Verified Chog Genesis NFT on Monad blockchain.',
        image: `https://raw.githubusercontent.com/pokeapi/sprites/master/sprites/pokemon/other/official-artwork/${(Number(tokenId) % 150) + 1}.png`,
        attributes: [],
      };
    }

    let url = tokenURI;
    if (url.startsWith('ipfs://')) {
      url = url.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }

    try {
      const res = await fetch(url);
      const json = await res.json();

      let image = json.image || json.image_url || '';
      if (image.startsWith('ipfs://')) {
        image = image.replace('ipfs://', 'https://ipfs.io/ipfs/');
      }

      return {
        name: json.name || `Chog Genesis #${tokenId}`,
        description: json.description || '',
        image: image || `https://raw.githubusercontent.com/pokeapi/sprites/master/sprites/pokemon/other/official-artwork/${(Number(tokenId) % 150) + 1}.png`,
        attributes: json.attributes || json.traits || [],
      };
    } catch {
      return {
        name: `Chog Genesis #${tokenId}`,
        description: 'Verified Chog Genesis NFT on Monad.',
        image: `https://raw.githubusercontent.com/pokeapi/sprites/master/sprites/pokemon/other/official-artwork/${(Number(tokenId) % 150) + 1}.png`,
        attributes: [],
      };
    }
  }

  private extractTraitsFromAttributes(attributes: any[]): ChogTraits {
    const traits: ChogTraits = {
      skin: 'Monad Genesis',
      headwear: 'Genesis Crown',
      eyes: 'Vibrant Gaze',
      aura: 'Parallel Energy',
      expression: 'Hyped',
      clothing: 'Monad Robe',
    };

    if (Array.isArray(attributes)) {
      attributes.forEach((attr) => {
        if (attr.trait_type && attr.value) {
          const key = String(attr.trait_type).toLowerCase();
          if (key.includes('skin') || key.includes('body') || key.includes('color')) traits.skin = String(attr.value);
          if (key.includes('hat') || key.includes('headwear') || key.includes('crown')) traits.headwear = String(attr.value);
          if (key.includes('eyes') || key.includes('visor') || key.includes('glasses')) traits.eyes = String(attr.value);
          if (key.includes('aura') || key.includes('background') || key.includes('power')) traits.aura = String(attr.value);
          if (key.includes('mouth') || key.includes('expression')) traits.expression = String(attr.value);
          if (key.includes('clothes') || key.includes('outfit')) traits.clothing = String(attr.value);
        }
      });
    }

    return traits;
  }

  private buildCharacterFromNFT(
    tokenId: string,
    name: string,
    image: string,
    traits: ChogTraits,
    ownerAddress: string
  ): ChogCharacter {
    return {
      id: `nft-chog-${tokenId}`,
      name: name || `Chog Genesis #${tokenId}`,
      tagline: `Verified NFT #${tokenId} owned by ${ownerAddress.slice(0, 6)}...${ownerAddress.slice(-4)}`,
      rarity: 'Genesis',
      rarityScore: 99.9,
      simulatedTokenId: `#${tokenId}`,
      colorHex: '#836EF9',
      secondaryColorHex: '#00F58C',
      auraColorHex: '#A086FF',
      particleColor: 0x836EF9,
      traits,
      emoteEffect: {
        name: 'monad_aura',
        icon: '⚡',
        label: 'Verified Monad Energy',
        particleColor: 0x836EF9,
      },
      bio: `Official Chog Genesis NFT #${tokenId} verified on Monad blockchain contract ${MONAD_NFT_CONFIG.contractAddress}`,
      isRealNFT: true,
      nftImageUrl: image,
      nftTokenId: tokenId,
      ownerAddress,
    };
  }
}

export const defaultNFTVerifier: NFTVerifierAdapter = new DemoNFTVerifier();
export const realMonadNFTVerifier: NFTVerifierAdapter = new MonadNFTVerifier();
