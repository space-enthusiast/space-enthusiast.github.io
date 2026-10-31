---
title: "AGIC 배포할 때마다 502 가 나는 문제 (sleep 말고는 답이 없을까)"
description: "AKS + Application Gateway + AGIC 환경에서 롤링 업데이트마다 502 가 나는 이유와, 공식 해결책인 preStop sleep 이 왜 먹히는지, 다른 클라우드는 왜 덜 아픈지, 그리고 sleep 말고 고를 수 있는 방법들을 정리했다."
date: 2026-10-31
tags: ["k8s", "azure", "aks", "agic"]
categories: ["infra"]
---

회사에서 AKS 에 Application Gateway(이하 AGW) 와 AGIC 를 붙여서 쓰고 있다. 그런데 배포만 하면 몇십 초 동안 502 가 튀었다. 코드는 멀쩡하고 Pod 도 멀쩡한데 배포 타이밍에만 에러가 난다. ~~배포 알림이 곧 장애 알림이었다~~

찾아보니 꽤 유명한 문제였고 공식 해결책도 있었다. 그런데 그 해결책이 **"preStop 에서 90초 sleep 해라"** 였다. 동작은 하는데 영 마음에 안 들어서 좀 더 파봤다. 순서는 이렇다.

1. 왜 502 가 나는지
2. 공식 해결책 (preStop sleep)
3. 다른 클라우드는 왜 이 문제로 덜 시끄러운지
4. sleep 말고 더 나은 방법은 없는지

# 왜 502 가 나는가

## AGW 는 Pod IP 를 직접 들고 있다

AGIC 는 Ingress 를 보고 AGW 설정을 만들어서 ARM 으로 밀어넣는 컨트롤러다. 여기서 중요한 건 AGW backend pool 에 들어가는게 Service 의 ClusterIP 가 아니라 **Pod IP** 라는 점이다. kube-proxy 를 안 거치고 Pod 로 바로 꽂는다.

홉이 하나 줄어드니 좋아 보이지만 대가가 있다. Pod 가 바뀔 때마다 AGW 설정도 바뀌어야 한다.

## Pod 가 죽는 순서

Pod 를 지우면 쿠버네티스는 아래 두 가지를 **동시에** 시작한다.

- Endpoints(EndpointSlice) 에서 Pod 를 뺀다
- 컨테이너에 SIGTERM 을 보낸다

kube-proxy 나 클러스터 안의 ingress 컨트롤러는 Endpoints 변화를 거의 바로 따라간다. 그런데 AGIC 는 이렇게 동작한다.

```
t=0   Pod 삭제
      → Endpoints 에서 제거 + SIGTERM
      → 앱 종료, Pod IP 죽음
t=?   AGIC 가 변경 감지
      → AGW 설정 전체 생성 → ARM 업데이트
t=??  AGW 반영 완료 (몇십 초 ~ 몇 분 뒤)

t=0 ~ t=?? 동안 AGW 는 죽은 IP 로 요청 → 502
```

공식 문서에도 AGW backend 에서 Pod 가 빠지는데 **"1초에서 몇 분"** 걸린다고 적혀 있다. GitHub 이슈에서는 AGW 재구성 한번에 45~60초 정도 걸리고, 이전 재구성이 끝나야 다음 재구성이 시작된다는 얘기도 나온다. 롤링 업데이트처럼 Pod 가 줄줄이 바뀌면 AGW 는 계속 한 박자씩 늦는다.

심한 경우는 더 있다. [#1124](https://github.com/Azure/application-gateway-kubernetes-ingress/issues/1124) 에서는 새 Pod 가 AGW 에 반영되는데 10~45분이 걸렸다는 보고가 있고, Azure 지원팀은 "40분 걸리는 것도 정상 동작" 이라고 답했다고 한다. ~~정상이라니~~

<!-- TODO: 여기에 우리 환경에서 실제로 측정한 반영 시간 / 502 그래프 넣기 -->

# 공식 해결책: preStop sleep

## 원리

Pod 를 바로 죽이지 말고 **AGW 가 따라올 때까지 살려두자** 는 거다.

preStop hook 이 있으면 쿠버네티스는 preStop 이 끝난 다음에 SIGTERM 을 보낸다. 그 사이 Pod 는 Endpoints 에서 이미 빠졌지만 앱은 살아있다. AGW 가 늦게라도 이 Pod 로 보낸 요청은 정상 처리되고, 그동안 AGIC 가 backend pool 에서 Pod 를 뺀다.

## 공식 문서 설정

[AGIC 공식 문서](https://azure.github.io/application-gateway-kubernetes-ingress/how-tos/minimize-downtime-during-deployments/) 가 권장하는 조합은 이렇다.

```yaml
spec:
  template:
    spec:
      terminationGracePeriodSeconds: 101
      containers:
        - name: app
          lifecycle:
            preStop:
              exec:
                command: ["sleep", "90"]
          livenessProbe:
            httpGet:
              path: /
              port: 80
            periodSeconds: 4
            timeoutSeconds: 5
            failureThreshold: 3
```

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  annotations:
    kubernetes.io/ingress.class: azure/application-gateway
    appgw.ingress.kubernetes.io/connection-draining: "true"
    appgw.ingress.kubernetes.io/connection-draining-timeout: "30"
```

- **preStop sleep 90초.** AGW 가 따라올 때까지 Pod 를 살려둔다.
- **`terminationGracePeriodSeconds` 90초 이상.** sleep 도중에 SIGKILL 당하지 않게 한다.
- **connection draining 30초.** pool 에서 빠진 뒤 진행중인 요청을 마저 처리한다.
- **짧은 probe 주기 (4초 × 3회).** AGIC 가 AGW health probe 에도 반영해서 죽은 Pod 를 빨리 걸러낸다.

## 함정 두개

**1. grace period 를 안 늘리면 아무 효과가 없다.**

`terminationGracePeriodSeconds` 기본값은 30초고 preStop 시간도 여기에 포함된다. sleep 90 만 넣으면 30초에 SIGKILL 로 죽는다. [#75](https://github.com/Azure/application-gateway-kubernetes-ingress/issues/75) 에도 "sleep 넣었는데 효과가 없다" 는 댓글에 이게 답으로 달려 있다.

**2. 이미지에 `sleep` 이 없으면 hook 이 실패한다.**

distroless 나 scratch 이미지에는 `sleep` 바이너리가 없다. 이럴 때는 쿠버네티스 자체 sleep action 을 쓰면 된다.

```yaml
lifecycle:
  preStop:
    sleep:
      seconds: 90
```

[KEP-3960](https://www.kubernetes.dev/resources/keps/3960/) 으로 들어온 기능이고 1.30 부터 기본으로 켜져 있다. 셸을 안 띄우니 exec 보다 깔끔하다.

## 그런데 마음에 안 든다

동작은 한다. 그런데 이게 결국 **"90초면 되겠지"** 라는 감이다.

- AGW 가 90초 안에 따라온다는 보장이 없다. 공식 문서도 "확률을 줄일 뿐 0 으로 만들지는 못한다" 고 적어놨다.
- 반대로 AGW 가 5초 만에 반영해도 Pod 는 90초를 꼬박 기다린다. 레플리카가 많으면 배포 시간이 그대로 늘어난다.
- 죽는 쪽만 다룬다. **새 Pod 가 AGW 에 아직 안 들어갔는데 구 Pod 가 다 빠지는 경우** 는 sleep 으로 못 막는다. #1124 가 정확히 이 경우였다.

그래서 다른 데는 어떻게 하는지 찾아봤다.

# 다른 클라우드는 왜 덜 시끄러운가

먼저 오해 하나를 짚자. **다른 클라우드도 preStop sleep 을 쓴다.** 심지어 GKE 공식 트러블슈팅 문서는 예시로 120초 sleep 을 쓴다. Endpoints 제거와 SIGTERM 이 동시에 일어나는 건 쿠버네티스 자체의 성질이라서, Pod IP 로 직접 꽂는 LB 는 어디든 같은 경쟁 상태를 겪는다.

차이는 **얼마나 늦게 따라오는지** 와 **새 Pod 쪽을 막아주는 장치가 있는지** 다.

| 구분 | Azure AGIC | AWS LB Controller | GKE (NEG) |
|---|---|---|---|
| 백엔드 갱신 방식 | AGW 리소스 전체를 ARM 으로 업데이트 | Target Group 에 변경된 타겟만 Register / Deregister | NEG 에 엔드포인트 attach / detach |
| 업데이트 단위 | 게이트웨이 하나에 한번에 하나 | 타겟 단위 | 엔드포인트 단위 |
| 새 Pod 쪽 보호 | 없음 | Pod Readiness Gate | NEG Readiness Gate |
| 종료 쪽 보호 | preStop sleep + draining | preStop sleep + deregistration delay | preStop sleep + drain timeout |

## 1. 바뀐 것만 고치느냐, 전부 다시 쓰느냐

AWS 나 GCP 는 "이 IP 하나 빼줘" 라는 API 가 따로 있다. 변경분만 보내니 가볍고, 다른 Pod 변경과 서로 막지 않는다.

AGIC 는 AGW 라는 리소스 하나의 설정 전체를 다시 쓴다. listener, rule, probe, backend pool 이 한 덩어리라서 Pod IP 하나 바꾸려고 해도 게이트웨이 전체 업데이트가 돈다. 그리고 AGW 는 업데이트가 진행 중이면 다음 업데이트를 받지 못한다. 롤링 업데이트에서 줄줄이 밀리는 이유가 이거다.

## 2. Readiness Gate

이게 더 큰 차이라고 본다.

AWS Load Balancer Controller 는 namespace 에 `elbv2.k8s.aws/pod-readiness-gate-inject: enabled` 라벨을 달면 Pod 에 readiness gate 를 넣어준다. GKE 는 NEG 를 쓰면 `cloud.google.com/load-balancer-neg-ready` gate 를 자동으로 넣는다. 둘 다 **LB 쪽에서 타겟이 healthy 가 되어야 Pod 를 Ready 로 쳐준다.**

Pod 가 Ready 가 안 되면 Deployment 는 구 Pod 를 안 지운다. 그래서 LB 가 아무리 늦어도 "새 Pod 는 아직 LB 에 없는데 구 Pod 는 다 죽었다" 는 상황이 구조적으로 안 생긴다. LB 의 느림이 **배포 속도** 로 흡수되지 **장애** 로 나오지 않는다.

AGIC 에는 이게 없다. 그래서 AGW 의 느림이 그대로 502 로 튀어나온다.

정리하면 다른 클라우드라고 sleep 이 필요 없는 건 아니다. 다만 짧은 sleep 이면 충분하고, 새 Pod 쪽은 readiness gate 가 막아주니 덜 아픈 거다.

# sleep 말고 더 나은 방법

먼저 하나 인정할 건 있다. 쿠버네티스에는 **"LB 에서 나 빠졌어"** 라는 신호가 없다. 그래서 쿠버네티스 자체도 결국 sleep 을 정식 lifecycle action 으로 만들었다. sleep 을 완전히 없애는 건 어렵고, 현실적인 목표는 **sleep 을 짧게 만들고 감에 덜 의존하는 것** 이다.

## 1. AGW 뒤에 클러스터 내부 ingress 를 둔다 (추천)

AGW 를 Pod 에 직접 꽂지 말고 한단계를 끼운다.

```
AGW (WAF, TLS)
  → 내부 LB (고정 IP)
  → 클러스터 내부 ingress / Gateway
  → Pod
```

- AGW backend pool 에는 내부 LB IP 하나만 들어간다. 앱을 배포해도 **AGW 설정이 아예 안 바뀐다.**
- Pod 변경은 클러스터 안의 ingress 컨트롤러가 EndpointSlice 를 보고 거의 바로 따라간다.
- preStop sleep 은 5~10초 정도로 줄일 수 있다. 쿠버네티스 자체의 전파 지연만 커버하면 된다.

#1124 의 작성자도 내부 LB 앞에 AGW 를 두는 구성으로 바꾸고 배포가 아주 매끄러워졌다고 했다. 마이크로소프트의 AKS baseline 아키텍처도 대부분 AGIC 가 아닌 다른 ingress 컨트롤러를 쓴다.

단점도 있다.

- 홉이 하나 늘어난다.
- 관리할 컴포넌트가 늘어난다. 내부 ingress 컨트롤러 자체를 업그레이드할 때는 같은 문제를 한번 더 겪는다. 대신 앱 배포보다 훨씬 드물다.
- **ingress-nginx 는 고르지 말자.** 업스트림 ingress-nginx 는 2026년 3월로 유지보수가 끝났고, AKS App Routing 애드온의 NGINX 도 2026년 11월까지만 보안 패치가 나온다. 지금 새로 고른다면 Gateway API 구현체 (AKS App Routing Gateway API, Envoy Gateway, Traefik 등) 가 맞다.

## 2. Application Gateway for Containers (AGC) 로 간다

마이크로소프트가 AGIC 후속으로 내놓은 제품이다. AGIC 공식 문서 맨 위에도 새 배포라면 AGC 를 고려하라고 적혀 있고, GitHub 이슈나 Q&A 에서도 마이크로소프트 쪽 답변은 대부분 "AGC 로 가라" 다.

AGW 와는 별개 리소스이고, 클러스터 안의 ALB Controller 가 Gateway API / Ingress 를 보고 설정한다. AGIC 처럼 게이트웨이 전체를 ARM 으로 덮어쓰는 구조에서 벗어난 게 핵심이다.

다만 엔드포인트 반영 속도가 몇 초인지 공식 수치는 못 찾았다. 넘어간다면 우리 환경에서 직접 재봐야 한다. 그리고 WAF 등 기존 AGW 에서 쓰던 기능이 AGC 에서 똑같이 되는지도 확인이 필요하다.

<!-- TODO: AGC 로 옮겼거나 테스트했다면 결과 넣기 -->

## 3. 그래도 AGIC 를 써야 한다면

당장 구조를 못 바꾼다면 sleep 을 덜 무지성으로 만드는 방법들이 있다.

**새 Pod 쪽을 막는다.** readiness gate 가 없으니 비슷한 효과를 롤아웃 설정으로 흉내낸다.

```yaml
spec:
  minReadySeconds: 60        # Ready 후 이만큼 지나야 available 로 친다
  strategy:
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
```

`minReadySeconds` 동안은 새 Pod 가 available 로 안 쳐져서 구 Pod 를 안 지운다. 그 사이 AGIC 가 새 Pod 를 AGW 에 넣을 시간을 번다. 이것도 시간 기반이긴 하지만 sleep 이 못 막던 "새 Pod 가 아직 없음" 문제를 다룬다.

**sleep 을 조건으로 바꾼다.** preStop 에서 고정 90초를 자는 대신, 자기 IP 가 AGW backend pool 에서 빠졌는지 확인하고 빠지면 바로 끝내는 방식이다. 최대 대기 시간은 그대로 둔다.

```sh
# 개념 예시: 실제로는 Pod 에 AGW 조회 권한(Workload Identity)이 필요하다
deadline=$(( $(date +%s) + 120 ))
while [ "$(date +%s)" -lt "$deadline" ]; do
  az network application-gateway address-pool show ... | grep -q "$POD_IP" || break
  sleep 3
done
sleep 5   # pool 에서 빠진 뒤 진행중인 요청 마무리
```

AGW 가 빨리 반영하면 빨리 끝나고, 늦으면 끝까지 기다린다. 대신 모든 Pod 에 Azure 권한을 줘야 하고 ARM API 호출이 Pod 수만큼 생긴다. 솔직히 이걸 할 바에는 1번으로 가는게 낫다고 본다. ~~sleep 을 없애려다 sleep 을 while 문에 넣었다~~

**앱 graceful shutdown 은 기본으로 챙긴다.** Spring 이면 `server.shutdown=graceful`. SIGTERM 을 받으면 새 요청을 막고 진행중인 요청을 끝낸 뒤 죽는다. 이건 sleep 의 대안이 아니라 sleep 이 끝난 다음 단계라서 어느 방법을 고르든 필요하다.

## 비교

| 방법 | 502 | 배포 시간 | 작업량 |
|---|---|---|---|
| sleep 90 (공식) | 줄어듦 | +90초 | 적음 |
| + minReadySeconds | 더 줄어듦 | 더 늘어남 | 적음 |
| 조건부 preStop | 줄어듦 | AGW 만큼 | 중간 |
| 내부 ingress | 원인 제거 | +5~10초 | 중간 |
| AGC 이전 | 원인 제거 | 측정 필요 | 큼 |

# 마치며

정리하면 이렇다.

- AGIC 502 는 AGW 가 Pod IP 를 직접 들고 있는데 설정 반영이 느려서 생긴다. 반영이 게이트웨이 단위 전체 업데이트라 롤링 중에 계속 밀린다.
- 공식 해결책인 preStop sleep 은 먹힌다. 단 `terminationGracePeriodSeconds` 를 같이 늘려야 하고, 확률을 줄일 뿐이다.
- 다른 클라우드도 sleep 을 쓴다. 다만 변경분만 반영하는 API 와 readiness gate 덕분에 짧은 sleep 이면 충분하다.
- sleep 을 무지성으로 늘리기 싫다면 AGW 가 Pod 를 직접 보지 않게 하는게 근본적인 해결이다. 내부 ingress 를 끼우거나 AGC 로 간다.

처음에는 "sleep 90 이 정답이라니" 하고 투덜거렸는데, 파보니 sleep 자체는 쿠버네티스에서 어쩔 수 없는 부분이었다. 진짜 문제는 sleep 이 아니라 **sleep 을 90초나 해야 할 만큼 느린 구조** 였다. 결국 sleep 시간을 튜닝할 게 아니라 그 구조를 바꾸는 쪽이 맞는 것 같다.

# 참고

- [AGIC: Minimizing Downtime During Deployments](https://azure.github.io/application-gateway-kubernetes-ingress/how-tos/minimize-downtime-during-deployments/)
- [AGIC Issue #75: Rolling updates cause 502](https://github.com/Azure/application-gateway-kubernetes-ingress/issues/75)
- [AGIC Issue #1124: Slow pod IP updates](https://github.com/Azure/application-gateway-kubernetes-ingress/issues/1124)
- [AGIC Annotations](https://learn.microsoft.com/azure/application-gateway/ingress-controller-annotations)
- [KEP-3960: Pod lifecycle sleep action](https://www.kubernetes.dev/resources/keps/3960/)
- [GKE 로드 밸런싱 트러블슈팅](https://docs.cloud.google.com/kubernetes-engine/docs/troubleshooting/load-balancing)
- [AWS Load Balancer Controller readiness gate 이슈 #1205](https://github.com/kubernetes-sigs/aws-load-balancer-controller/issues/1205)
- [Why graceful pod shutdown on EKS kept throwing 502s (DEV)](https://dev.to/claire_nguyen/why-graceful-pod-shutdown-on-eks-kept-throwing-502s-on-deploy-2f1h)
- [Application Gateway for Containers 구성요소](https://learn.microsoft.com/azure/application-gateway/for-containers/application-gateway-for-containers-components)
- [AKS App Routing 과 ingress-nginx 업데이트](https://blog.aks.azure.com/2025/11/13/ingress-nginx-update)
