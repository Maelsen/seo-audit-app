let currentLogo: string | undefined;
let currentSignet: string | undefined;

export function setBrandAssets(logo?: string, signet?: string): void {
  currentLogo = logo;
  currentSignet = signet;
}

export function getBrandLogo(): string | undefined {
  return currentLogo;
}

export function getBrandSignet(): string | undefined {
  return currentSignet;
}
