import { ethers } from 'ethers';
import { MONAD_NFT_CONFIG } from '../config/nftConfig';

export interface WalletConnectionState {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  isMonadNetwork: boolean;
  error: string | null;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

export class WalletService {
  private provider: ethers.BrowserProvider | null = null;

  public isWalletInstalled(): boolean {
    return typeof window !== 'undefined' && Boolean(window.ethereum);
  }

  public async connectWallet(): Promise<WalletConnectionState> {
    if (!this.isWalletInstalled()) {
      return {
        address: null,
        chainId: null,
        isConnected: false,
        isMonadNetwork: false,
        error: 'No Monad-compatible Web3 wallet detected. Please install MetaMask, Rabby, or Phantom.',
      };
    }

    try {
      this.provider = new ethers.BrowserProvider(window.ethereum);
      
      // Request user account permissions
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts authorized');
      }

      const address = accounts[0];
      const network = await this.provider.getNetwork();
      const chainId = Number(network.chainId);
      const isMonadNetwork = chainId === MONAD_NFT_CONFIG.network.chainId || chainId === 143;

      return {
        address,
        chainId,
        isConnected: true,
        isMonadNetwork,
        error: isMonadNetwork ? null : `Connected to Chain ID ${chainId}. Please switch to Monad Network (${MONAD_NFT_CONFIG.network.name}).`,
      };
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      return {
        address: null,
        chainId: null,
        isConnected: false,
        isMonadNetwork: false,
        error: err?.message || 'Wallet connection rejected by user.',
      };
    }
  }

  public async switchToMonadNetwork(): Promise<boolean> {
    if (!this.isWalletInstalled()) return false;

    try {
      // 1. Attempt to switch chain
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: MONAD_NFT_CONFIG.network.chainIdHex }],
      });
      return true;
    } catch (switchError: any) {
      // 4902 error code indicates the chain has not been added to wallet yet
      if (switchError.code === 4902 || switchError?.data?.originalError?.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: MONAD_NFT_CONFIG.network.chainIdHex,
                chainName: MONAD_NFT_CONFIG.network.name,
                rpcUrls: MONAD_NFT_CONFIG.network.rpcUrls,
                blockExplorerUrls: [MONAD_NFT_CONFIG.network.blockExplorer],
                nativeCurrency: MONAD_NFT_CONFIG.network.nativeCurrency,
              },
            ],
          });
          return true;
        } catch (addError) {
          console.error('Failed to add Monad network:', addError);
          return false;
        }
      }
      console.error('Failed to switch network:', switchError);
      return false;
    }
  }

  public async getConnectedAccount(): Promise<string | null> {
    if (!this.isWalletInstalled()) return null;
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      return accounts && accounts.length > 0 ? accounts[0] : null;
    } catch {
      return null;
    }
  }

  public listenToWalletEvents(
    onAccountChange: (account: string | null) => void,
    onChainChange: (chainIdHex: string) => void
  ) {
    if (!this.isWalletInstalled()) return;

    window.ethereum.on('accountsChanged', (accounts: string[]) => {
      onAccountChange(accounts.length > 0 ? accounts[0] : null);
    });

    window.ethereum.on('chainChanged', (chainIdHex: string) => {
      onChainChange(chainIdHex);
    });
  }
}

export const walletService = new WalletService();
