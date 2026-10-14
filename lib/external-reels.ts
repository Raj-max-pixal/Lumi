export type ExternalReel = {
  id: string;
  source: "youtube";
  videoId: string;
  title: string;
  creator: string;
  description: string;
  topic: string;
  publishedAt: string;
};

export type ExternalReelsResponse = {
  items: ExternalReel[];
  configured: boolean;
  error?: string;
};
