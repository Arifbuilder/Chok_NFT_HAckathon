export const MONAD_NFT_CONFIG = {
  // Official Chog Genesis NFT Contract Address on Monad
  contractAddress: '0xc96d31f8626c6d03fae5dcd3d61e3fb9f4a73763',
  collectionName: 'Chog Genesis',
  openseaUrl: 'https://opensea.io/collection/chog-genesis',
  
  // Monad Network Specifications
  network: {
    chainId: 10143,
    chainIdHex: '0x279f',
    name: 'Monad Testnet',
    rpcUrls: [
      ((import.meta as any).env?.VITE_MONAD_RPC_URL) || 'https://testnet-rpc.monad.xyz',
      'https://rpc-testnet.monad.xyz',
    ],
    blockExplorer: 'https://testnet.monadexplorer.com',
    nativeCurrency: {
      name: 'Monad',
      symbol: 'MON',
      decimals: 18,
    },
  },
};

export const CHOG_ERC721_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function totalSupply() view returns (uint256)',
];
