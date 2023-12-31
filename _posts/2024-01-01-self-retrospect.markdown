---
layout: post
title: "2023년 회고"
tags: [post, 회고]
date: 2024-01-01 00:00:00 +0000
---

2024년이 되서 드디어 여유가 조금 생긴 것 같다. 3년을 일하면서 단 한번도 자기회고를 안했다는 점이 마음을 아프지만 늦었다고 생각할때가 가장 빠른것 아니겠는가 ~~아니야 늦었어...~~
거두절미하고 바로 시작해보겠다.

회고는 KTP 방식으로 해볼 것이다. (Keep Try Problem) 연간 회고를 하기에 적절한 포맷은 아니지만 필자는 해당 방식이 가장 익숙하므로 해당 방식으로 진행하겠다(?)

# 업무 회고

## Keep

업무 방식 재정의 스스로 한것은 아니지만 년초에 백엔드 팀을 통합하면서 자연스럽게 해당 팀의 효율적인 업무 방식을 흡수하였다. 흡수한 업무 방식중 가장 좋았던 핵심 하나에 대해 말해보겠다

### 야근을 하지 마라

개발자들이 야근을 많이 한다. 실제로 예측하지 못하는 일이 많아 야근이 많을 수 있지만 예측 가능한 작업량인데도 불구하고 야근을 하는 경우가 있다. 당연한 소리지만 자신의 하루 순수하게 8시간 순공 계획을 짠다고 해서 8시간 순공을 하는 사람은 극히 드물다 일정을 짤 때도 어느 정도 상황을 예측해서 일정을 짜야 된다. ~~노력으로 커버할 수 있느면 대단하겠지만 보통 사람은 그렇게 하지 못한다...~~

![img11.png](/assets/self-retrospect/graph.png)

위 그래프는 시간에 따른 코드 작업량에 개발자 작업량 그래프이다. 당여하지만 아무리 코드를 잘짜도 기능이 많아지고 프로젝트에 기여하는 시간이 길어질수록 복잡도도 늘어나고 작업량도 늘어난다. 이에 따라 개발자의 작업량도 늘어나면 좋겠지만 개인적 경험으로는 이것을 따라가기란 거의 불가능에 가깝다. 이런 경우 처음의 일정대로 프로젝트일정을 짯다가 봉변을 당하는 시간이 많은데 이 봉변을 커버하기 위해 야근(~~체력 정신력 사채~~)를 하게 되고 이러다 번아웃 또는 최악의 경우 버티지 못해 퇴사를 하게 된다.

그래서 조금 구체적인 아래 해결방안을 통해 필자는 이것을 50% 정도 개선하였다. ~~아직 50%는 야근한다 갈길이 멀다~~

- 70% 의 리소스만을 정규 작업에 할당해라 나머지 30% 이슈 (서버 개발자라 급작스러운 중요도 높은 이슈 발생 가능) 에 할당하며 실제 작업 효율이 상승
- 작업 시간에 퇴근후 시간을 절대로 넣지 말아라 이것은 사채다 **정신적 체력적 사채**이다. 퇴근후 시간 정규 작업 시간이 아닌 시간에 작업을 해서 작업을 성공하였다면 당신은 실제로 프로젝트 시간 계산을 실패한 것이다.

핵심은 이것이다. 30%의 여유시간 업무 외 시간에 작업을 하지 말것 물론 이루기 어려운 제안 이라는 것은 안다. 실제로 회사에서 스터디나 회고 평가 같은 것들은 회사 시간에 하기 애매한 경우도 있으니 필자는 그래도 최대한 개인 시간에는 개인을 위한 것을 하는 것 (여가생활, 자기계발, ~~라고 말하지만 롤, 옵치, 백준도 좀 풀고, 사이드 프젝도 하고~~)과 최대한 연관짓기를 바란다.

### 따라큐 같이(?)

필자는 카피능력이 생각보다 좋다(?) 이것이 무슨뜻이냐 베끼는거 잘하는 거냐(?) 라고 말할까봐 조금 설명해주자면 필자가 말하는 카피능력이란

> 기존의 설게 및 디자인 패턴에 맞는 방향으로 코드 작성 능력

이라고 생각한다. 2023년도 중순에 새로운 코드베이스에 던져지며 일주일 정도만에 적응해서 코드를 뱉어냈는데(?) 이떄 팀장님에게 이 능력 하나 만큼은 팀내 1등이라는 소리를 들어서 참 뿌듯하였다.

## Problem

### 낙후된 시스템 방치

우리는 시간이 없이 코드를 짜다보면 소위 **악취를 풍기는 코드**를 적을 때가 있다. 이것이 싸이고 싸여 기술적 부채가 되는 것이다. 코드 구석구석 이런것이 쌓이게 되면 결국 시스템 안전성이 떨어지고 코드 퀄리티는 더더욱 떨어진다 생각된다.

코드 뿐만 아니라 설계 자체에서부터 잘못된 시스템은 두고두고 개발자들을 괴롭힌다. 이것들을 고칠 시간을 확보하는 것은 매우 힘들지만 그럼에도 불구하고 우리는 이것을 방어해야 한다.

해당 사항의 구체적인 예로 필자는 회사에 들어와 1년 정도 되었을때 **PM 자동화 업무** 를 진행하였다. 이때 많이 잘못된 설계를 하여 ~~지금 생각하면 멍청한 설계였다~~ 이것이 1년동안 나를 괴롭혔다.

## Try

#### 낙후된 시스템 개선

**악취를 풍기는 코드** 및 **낙후된 시스템** 개선을 하기 위해서는 어떻게 해야 할까. 필자는 이것을 상시 리펙토링 + 리펙토링의 날로 해결할 예정이다.

- 상시 리펙토링: 개발해야 할 구역이 리펙토링할 구역과 겹치는 경우 리펙토링과 동시에 개발을 하여 혹시라도 설계 리펙토링일 경우 해당 개발 QA에 엎혀서 리펙토링 검증까지 같이 진행한다. 물론 리펙토링을 할때에는 사이드 이펙트가 나지 않게 해야겠지만 중요한 기능 리펙토링일 경우 개발자 한명이 스스로 검증할시 문제가 생길 수 있기 떄문에 이와 같이 안전선 한개가 더 있어서 나쁠것은 없다.
- 리펙토링의 날: 안정된 시스템이지만 리펙토링이 필요한 경우가 있다. 이 경우 스스로 여유 시간을 만들어 리펙토링을 하는 것이 좋다. 검증할 수 있는 자가 개발자 한명밖에 없는 경우가 많을 것이기 때문에 이 경우 코드 변경으로 인한 사이드 이펙트가 나지 않게 조심해서 리펙토링을 해야 한다.

그와 별개로 위의 구체적인 예였던 필자가 잘못 마든 시스템을 팀장에게서 개선할 10주를 받았다. 이와 같이 위 리펙토링 방법으로 해결하지 못하는 것들은 아예 팀 내에까지 공유해서 시간 및 리소스를 받는 것도 하나의 방법이다.


이상 업무 회고를 마친다. 쓰다보니 살짝 두서없이 쓰게 되었고 너무 구체적인 예를 적은것 같지만 첫 연간 회고인 만큼 너그럽게 봐주기를 바란다. 다음에는 셀프 개발자로서 성장에 대한 회고로 돌아오겠다.
