import type { Site, Metadata, Socials, Project } from "@types";

export const SITE: Site = {
  NAME: "space-enthusiast",
  EMAIL: "jinding0829+blog@gmail.com",
  NUM_POSTS_ON_HOMEPAGE: 5,
};

export const HOME: Metadata = {
  TITLE: "Home",
  DESCRIPTION: "근본있는 공부를 추구하는 블로그",
};

export const BLOG: Metadata = {
  TITLE: "Blog",
  DESCRIPTION: "게으른 완벽주의자이자 백엔드 개발자의 블로그",
};

export const PROJECTS: Metadata = {
  TITLE: "Projects",
  DESCRIPTION: "Things I have built",
};

export const PROJECT_LIST: Project[] = [
  {
    TITLE: "Kotlin on Web Playground",
    DESCRIPTION: "Compile, run and autocomplete real Kotlin (K2) entirely inside your browser tab, no server",
    HREF: "https://space-enthusiast.github.io/kotlin-on-web-playground/",
    REPO: "https://github.com/space-enthusiast/kotlin-on-web-playground",
    DATE: "2026-10",
  },
];

export const SOCIALS: Socials = [
  {
    NAME: "github",
    HREF: "https://github.com/space-enthusiast",
  },
  {
    NAME: "twitter-x",
    HREF: "https://twitter.com/Tk2z3nhZm7JAMmX",
  },
];
