---
layout: post
title:  "jekyll로 블로그 만들기"
date:   2023-10-24 05:49:10 +0000
tags: [jekyll,ssg]
categories: [blog]
---

- jekyll 이란?
  - 정적 사이트 생성기(Static Site Generator) 란?
  - jekyll 이 그래서 왜 좋아?
  - 맥에서 jekyll 로컬 설치의 어려움*
- jekyll 쉽게 사용하기
  - Docker을 이용한 jekyll 빌드 및 실행
  - single line install / exec
- 후기

---

## jekyll 이란?

> Jekyll is a **static site generator**. It takes text written in your favorite markup language and uses layouts to create a static website. You can tweak the site’s look and feel, URLs, the data displayed on the page, and more.
>
> [jekyll docs](https://jekyllrb.com/docs/)

jekyll 공식문서의 맨 위에 있는 문장이다. **정적 사이트 생성기**라고 쓰여있다.

---

### 정적 사이트 생성기(Static Site Generator) 란?

> 정적 사이트 생성기는 **원시 데이터와 템플릿 세트를 기반으로 완전한 정적 HTML 웹 사이트를 생성하는 도구입니다.** 기본적으로 정적 사이트 생성기는 개별 HTML 페이지를 코딩하는 작업을 자동화하고 해당 페이지를 사용자에게 미리 제공할 수 있도록 준비합니다.
>
> [cloudflare reference](https://www.cloudflare.com/ko-kr/learning/performance/static-site-generator/#:~:text=%EC%A0%95%EC%A0%81%20%EC%82%AC%EC%9D%B4%ED%8A%B8%20%EC%83%9D%EC%84%B1%EA%B8%B0%EB%8A%94%20%EC%9B%90%EC%8B%9C,%ED%95%A0%20%EC%88%98%20%EC%9E%88%EB%8F%84%EB%A1%9D%20%EC%A4%80%EB%B9%84%ED%95%A9%EB%8B%88%EB%8B%A4.)

cloudflare 정의를 보면 알수 있듯이 정적인 사이트 생성기는 말그대로 정적인 사이트 (주로 HTML 문서) 를 생성하는 생성기이다. **사용자의 원시데이터**(우리가 쓰는 마크다운 문서)와 **설정한 템플릿**에 따라 웹 사이트를 생성하는 도구이다. 이 도구도 여러가지가 존재하는데 그중 대표적인 것으로는

- **Jekyll**
- Gatsby
- Hugo
- Next.js(?)
- Eleventy

그럼 정적 웹사이트 생성기 장점과 단점은 무엇일까?

- 장점
  - 성능: 미리 웹 페이지를 생성해 놓아서 조금더 빨리 로드 엔드유저에게 더 빨리 콘텐츠를 전달 할 수 있다.
  - 사용자 지정: 원하는 템플릿을 어떤 것이라도 만들 수 있다.
  - 더 가벼운 백엔드: 정적 웹 사이트는 가볍고 서버 측에서 실행하는 데 많은 코드가 필요하지 않다.
- 단점
  - 미리 빌드된 템플릿이 거의 없거나 전혀 없음: 템플릿이 제공되어 있는것이 없다. 개발자라면 템플릿 구축비용이 존재한다.
  - 사용자 친화적인 인터페이스가 없음: 개발자가 아닌 사용자는 정적 사이트 생성기를 사용하기 어렵다.
- [cloudflare reference](https://www.cloudflare.com/ko-kr/learning/performance/static-site-generator/#:~:text=%EC%A0%95%EC%A0%81%20%EC%82%AC%EC%9D%B4%ED%8A%B8%20%EC%83%9D%EC%84%B1%EA%B8%B0%EB%8A%94%20%EC%9B%90%EC%8B%9C,%ED%95%A0%20%EC%88%98%20%EC%9E%88%EB%8F%84%EB%A1%9D%20%EC%A4%80%EB%B9%84%ED%95%A9%EB%8B%88%EB%8B%A4.)

사실 아래 단점은 개발자에게는 크게 상관없다. 대부분의 정적 사이트 생성기는 기본 템플릿 및 퀄리티 좋은 템플릿들이 널리 퍼져있고 개발자의 경우 원시데이터를 조작하는 것에 크게 어려움을 느끼지 않기 때문이다.

---

### jekyll 이 그래서 왜 좋아?
그럼왜 그저 정적 사이트 생성기의 jekyll이 이렇게 각광받을까?
필자는 그 이유를 jekyll의 **수많은 템플릿**와 근본기능만을 모아둔 jekyll의 기본템플릿의 조합 때문이라 생각한다.

그리고 jekyll의 경우에는 기본 템플릿 모음집 통해 정적 사이트를 만들기 위해 필요한 가장 기본적이 기능들을 지원하였고 **부가기능들을 플러그인**등을 이용하여 지원해서 개발자면 손쉽게 댓글, 좋아요 기능등을 추가할 수 있다.

---

### 맥에서 jekyll 로컬 설치의 어려움*

[jekyll 공식 페이지](https://jekyllrb.com/docs/installation/macos/#install-jekyll)에 나와있는 맥용 jekyll 설치 가이드이다.
```shell
# install correct ruby version
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install chruby ruby-install xz
ruby-install ruby 3.1.3

echo "source $(brew --prefix)/opt/chruby/share/chruby/chruby.sh" >> ~/.zshrc
echo "source $(brew --prefix)/opt/chruby/share/chruby/auto.sh" >> ~/.zshrc
echo "chruby ruby-3.1.3" >> ~/.zshrc # run 'chruby' to see actual version

ruby -v

# install jekyll
gem install jekyll
```

- 1, [mac 내장 ruby 버전 충돌](https://www.geeksforgeeks.org/how-to-install-jekyll-on-macos/)
- 2, sudo 문제 (jekyll과 상관없지만)
- 3, [apple sillicon 호환성 문제(m1 이상의 맥북)](https://talk.jekyllrb.com/t/issues-with-jekyll-rights-on-apple-m1/7479)

위의 단점들 때문에 너무 싫다. 필자는 저 스크립트만 따라하면 되겠지라는 안일한 생각으로 인해 2틀 저녁시간을 버렸다. 너무나도 아까운 시간이다.

---

## jekyll 쉽게 사용하기

소프트웨어를 동일한 환경을 세팅해 실행하기 힘들다 -> **가상화하자**

---

### Docker을 이용한 jekyll 빌드 및 실행

Docker 라고 했지만 결국 가상화시키는 방법중 가장 널리퍼져있는 소프트웨어라서 부득이하게 **컨테이너라이징 애플리케이션**이라 하지 않고 Docker 라고 했다.
실제로 도커라이징이라고 자주 부르기도 하니

다행히 jekyll은 [공식적인 이미지](https://hub.docker.com/r/jekyll/jekyll/tags)를 제공한다.

![jekyll_docker.png](/assets/img/jekyll_docker.png)

그런데... 1년전 이미지이다.. 제대로 유지보수되는지도 모르겠다.

[jekyll 실행을 위한 요구조건](https://jekyllrb.com/docs/)을 확인뒤 해당 이미지의 대체제를 찾아보자
- Ruby version 2.5.0 or higher
- RubyGems
- GCC and Make

![ruby_docker.png](/assets/img/ruby_docker.png)

도커 공식 딱지이다. Ruby는 심지어 8일전 업데이트 되었다. 아주 흐뭇하다. 해당 Ruby 이미지 기반으로 누군가는 [Dockerfile](https://github.com/BillRaymond/my-jekyll-docker-website/blob/main/dockerfile) 만들어둔걸 쓱싹(?) 해온다.

```dockerfile
# Create a Jekyll container from a Ruby Alpine image

# At a minimum, use Ruby 2.5 or later
FROM ruby:2.7-alpine3.15

# Add Jekyll dependencies to Alpine
RUN apk update
RUN apk add --no-cache build-base gcc cmake git

# Update the Ruby bundler and install Jekyll
RUN gem update bundler && gem install bundler jekyll
```

요구사항을 다 다운받았으면 컨테이너를 접속해서 jekyll [initialize](https://github.com/BillRaymond/my-jekyll-docker-website#step-7-build-the-jekyll-website) 및 [exec](https://github.com/BillRaymond/my-jekyll-docker-website#step-7-build-the-jekyll-website) 해보자

```shell
# execute and access container
docker exec -p 4000:4000 -it <mycontainer-id> bash

bundle init

# --- Decision time!
# Either install Jekyll 3.9.x for for official GitHub Pages support
bundle add jekyll --version "~>3.9.0"

# Or install the latest version of Jekyll 4.x
# bundle add jekyll --version "~>4"
# ---

bundle install
bundle update
bundle exec jekyll new --force --skip-bundle .
bundle add webrick
bundle install
bundle update

# execute jekyll
bundle exec jekyll serve --livereload
```

이제 끝이다. jekyll 사이트를 로컬에서 접속 가능하다.

---

### single line install / exec

위에 글을 읽은 독자는 순간 이렇게 생각할 것이다.

"아니 로컬 설치랑 docker 랑 두개다 복잡하잖아 하 jekyll 왤케 어려워"

그래서 찡찡거리지 말라고(? 사실 내가 이랬다) one line 솔루션을 가져왔다.

```shell
# initialize
docker run -v $(pwd):/site bretfisher/jekyll new .

# run
docker run -p 4000:4000 -v $(pwd):/site bretfisher/jekyll-serve
```
제 3자에의 의해 만들어진 컨테이너 이미지라 동작성은 보장하지 않는다. 대신 편하다 정말 편하다.

아래는 one-line 솔루션으로 만들어본 첫 블로그의 모습이다.

![jekyll_local_run.png](/assets/img/jekyll_local_run.png)

---

## 후기

첫 제대로된 블로그를 적으면서 배운것

- 1, 블로그 적는것 재밌다.
- 2, 누가 내 글을 읽는다는 것은 공포이다.
- 3, 근본있는 글을 적는 것은 힘들지만 재밌는 일이다.

지금 이 글도 근본 있는 글이라 생각하진 않는다. 조금더 구조적이게 글을 적고 싶었지만 필자의 첫글이라 너그러운 마음으로 봐주기를 바란다.
