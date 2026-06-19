# space-enthusiast.github.io

근본있는 공부를 추구하는 블로그. [Astro Nano](https://github.com/markhorn-dev/astro-nano) 기반.

## Local development

이 리포는 `flake.nix`로 Node.js 런타임을 고정합니다. Nix를 통한 dev shell 안에서 모든 명령을 실행하세요.

```bash
# enter dev shell (Node 22 from Nix)
nix develop

# install deps (writes to ./node_modules — repo-local)
npm install

# run dev server
npm run dev

# build for production
npm run build

# preview the built output
npm run preview
```

`direnv` 사용자는 `direnv allow`만 하면 디렉토리 진입 시 자동으로 dev shell이 활성화됩니다 (`.envrc` 참조).

## Writing a post

`src/content/blog/<slug>.md` 형식으로 생성:

```markdown
---
title: "포스트 제목"
description: "한 줄 요약"
date: 2026-06-20
tags: [tag1, tag2]
categories: [category]
---

본문 내용...
```

이미지는 `public/assets/<sub>/...` 에 두고 본문에서는 절대경로 `/assets/<sub>/...` 로 참조합니다.

## Deploy

`main` 브랜치에 푸시하면 `.github/workflows/deploy.yml` 이 Nix dev shell 안에서 빌드 후 GitHub Pages에 배포합니다.

레포 Settings → Pages → Source 가 "GitHub Actions" 로 설정되어 있어야 합니다.

## Stack

- [Astro 5](https://astro.build) + [Tailwind CSS](https://tailwindcss.com) + TypeScript
- 콘텐츠는 Astro content collections
- Node.js 런타임은 Nix flake로 핀
