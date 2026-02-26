export interface Studio {
  id: string;
  slug: string;
  name: string;
  nameKo: string;
  logo?: string;
  banner?: string;
  accentColor: string;
  description: string;
  descriptionKo: string;
  tagline: string;
  taglineKo: string;
  socialLinks?: {
    instagram?: string;
    website?: string;
    twitter?: string;
  };
  isActive: boolean;
  createdAt: string;
}
