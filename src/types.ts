export type Site = {
  NAME: string;
  EMAIL: string;
  NUM_POSTS_ON_HOMEPAGE: number;
};

export type Metadata = {
  TITLE: string;
  DESCRIPTION: string;
};

export type Socials = {
  NAME: string;
  HREF: string;
}[];

export type Project = {
  TITLE: string;
  DESCRIPTION: string;
  HREF: string;
  REPO?: string;
  DATE: string;
};
