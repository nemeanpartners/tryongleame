export interface LookRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  colors: string[]; // hex codes
  requestedBy: string;
  votes: number;
  votedUsers: string[]; // List of user IPs/IDs to prevent double voting
  createdAt: number;
  status?: 'requested' | 'selected' | 'being built' | 'released';
  isPublic?: boolean;
}

export interface ChallengeSubmission {
  id: string;
  username: string;
  lookName: string;
  description: string;
  makeupConfig: {
    eyeshadowColor: string;
    eyeshadowOpacity: number;
    eyelinerColor?: string;
    eyelinerOpacity?: number;
    eyelinerStyle?: 'none' | 'classic' | 'cat-eye' | 'winged';
    blushColor: string;
    blushOpacity: number;
    lipColor: string;
    lipOpacity: number;
    lipGloss: boolean;
    lashesStyle: string;
    glitterLevel: number;
    selectedFilter: string;
  };
  votes: number;
  createdAt: number;
  isLocked?: boolean;
  tier?: 'free' | 'pro';
  category?: string;
  categoryLabel?: string;
}

export interface Winner {
  id: string;
  username: string;
  lookName: string;
  month: string;
  imagePreset: string;
  description: string;
  makeupConfig: {
    eyeshadowColor: string;
    blushColor: string;
    lipColor: string;
    lashesStyle: string;
    eyelinerColor?: string;
    eyelinerStyle?: string;
  };
}

export interface PresetFace {
  id: string;
  name: string;
  imageUrl: string;
}

export interface PresetLook {
  id: string;
  name: string;
  description: string;
  eyeshadowColor: string;
  eyeshadowOpacity: number;
  eyelinerColor?: string;
  eyelinerOpacity?: number;
  eyelinerStyle?: 'none' | 'classic' | 'cat-eye' | 'winged';
  blushColor: string;
  blushOpacity: number;
  lipColor: string;
  lipOpacity: number;
  lipGloss: boolean;
  lashesStyle: 'none' | 'natural' | 'glam' | 'wispy';
  glitterLevel: number; // 0 to 100
  filter: 'none' | 'vintage' | 'warm-glow' | 'cool-cyber' | 'holographic';
  requestedBy?: string; // Attach original winning username if community preset
  isLocked?: boolean;
  tier?: 'free' | 'pro';
  /** Catalog id of the AR filter this look is, when it is one the app ships. */
  filterId?: string;
  /** The filter behind each region, for a look built from several shades. */
  filterIds?: Record<string, string>;
  /** Picture of the look, captured when it was saved. */
  coverImage?: string;
}

export interface ShadeProduct {
  id: string;
  name: string;
  category: 'eyelashes' | 'lips' | 'lip-liner' | 'eyeliner';
  categoryLabel: string;
  shadeName: string;
  colorHex?: string;
  finish: string;
  description: string;
  image: string;
  swatchImage?: string;
  targetInterests: number;
  currentInterests: number;
  priceEstimate: string;
  tags: string[];
  presetConfig: PresetLook;
}
