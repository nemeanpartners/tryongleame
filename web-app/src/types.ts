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
}

export interface ChallengeSubmission {
  id: string;
  username: string;
  lookName: string;
  description: string;
  makeupConfig: {
    eyeshadowColor: string;
    eyeshadowOpacity: number;
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
  blushColor: string;
  blushOpacity: number;
  lipColor: string;
  lipOpacity: number;
  lipGloss: boolean;
  lashesStyle: 'none' | 'natural' | 'glam' | 'wispy';
  glitterLevel: number; // 0 to 100
  filter: 'none' | 'vintage' | 'warm-glow' | 'cool-cyber' | 'holographic';
}
