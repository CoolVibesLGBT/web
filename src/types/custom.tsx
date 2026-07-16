import type { LucideProps } from "lucide-react";

export enum BurstType {
  LIKE = 'like',
  DISLIKE = 'dislike',
  BLOCK = 'block',
}

export interface BurstParticle {
  id: string;
  x: number;
  y: number;
  rotate: number;
  Icon: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;
  color: string;
}

export interface BurstConfetti {
  id: string;
  x: number;
  y: number;
  size: number;
  color: string;
  rotate: number;
  driftX: number;
  driftY: number;
  duration: number;
  delay: number;
  shape: 'square' | 'circle' | 'triangle';
}

export interface BurstStreak {
  id: string;
  angle: number;
  length: number;
  delay: number;
}


export interface BurstOverlayState {
  type: BurstType;
  key: number;
  particles: BurstParticle[];
  confetti: BurstConfetti[];
  streaks: BurstStreak[];
}
