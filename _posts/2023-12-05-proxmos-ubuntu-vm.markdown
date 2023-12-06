---
layout: post
title:  "Proxmox에 VM 돌려보기"
tags: [proxmox, vm]
categories: [home-lab]
date: 2023-12-05 07:07:10 +0000
---

# Proxmox에 VM 돌리기

## Proxmox 란?

![proxmox-logo.png](/assets/proxmox/proxmox-logo.png)

- Proxmox VE(Proxmox Virtual Environment)는 가상화 및 컨테이너 관리를 위한 주요 플랫폼이다.
  - KVM(Kernel-based Virtual Machine) 가상화 기술로 **가상 머신**을 생성 및 관리한다.
  - LXC(Linux Containers)로 **컨테이너화** 기술을 제공한다.

자세한 내용은 추후 Proxmox VE에 대한 포스트로 다루겠다. 우선 이미 설치된 Proxmox 기준으로 시작하겠다.

다음은 Proxmox 는 기본적으로 지원하는 웹 콘솔의 모습이다.

> `메인페이지`
![img1.png](/assets/proxmox/proxmox.png)


## ISO 이미지 Proxmox 업로드

우리는 [Ubuntu 22.04.3 live server amd 64](https://releases.ubuntu.com/jammy/) ISO 이미지를 쓸것이다. ~~Ubuntu 이미지가 근본있으니?~~

> ubuntu `live server` vs `server` 차이점은 설치의 편리함에 있다. `live server`의 설치가 편하니 되도록이면 `live server`를 선택하자.
{: .prompt-info }

Proxmox는 ISO이미지를 쓰기전에 Proxmox 로컬 저장소에 업로드를 하는것이 편하다. 아래 사진의 메뉴대로 따라가 ISO 이미지를 업로드하자.

> `메인페이지 -> 사이드바 -> 노드 선택 (esteban) -> local (esteban) -> ISO Images -> upload 버튼`
![upload-iso.png](/assets/proxmox/upload-iso.png)

## VM 생성하기

그럼 VM 을 한번 만들어보자

> VM ID를 900번대로 설정하는 이유는 추후에 나올 것이다.
{: .prompt-tip }
> `메인페이지 -> Create VM 클릭 -> Node, VM ID, name 설정`
![create-vm-1.png](/assets/proxmox/create-vm/1.png)

> `ISO image 선택`
![create-vm-2.png](/assets/proxmox/create-vm/2.png)

> `그대로`
![create-vm-3.png](/assets/proxmox/create-vm/3.png)

> Disk size를 적게 잡는 이유는 추후 해당 ubuntu vm을 k8s-node 용으로 쓰기 위해서라 처음 계획했지만 k8s-volume 이라는 것도 존재해서 node를 어떤 사이즈를 잡아야 될지 정확한 메트릭은 현재 못찾았다. 필자 마음대로 64gb 설정하였다(?)
{: .prompt-tip }
> `Disk size 설정`
![create-vm-4.png](/assets/proxmox/create-vm/4.png)

> 필자의 컴퓨터에는 cpu core가 많지 않아 2개로 설정했지만 많으면 많이 설정하여도 된다.
{: .prompt-tip }
> `Cores 설정`
![create-vm-5.png](/assets/proxmox/create-vm/5.png)

> 위와 동일하게 많으면 많이 설정하여도 된다.
{: .prompt-tip }
> `Memory 설정`
![create-vm-6.png](/assets/proxmox/create-vm/6.png)

> 기본 설정대로라면 vmbrxx 이라고 되있을 것이다. 원하는 네트워크 브릿지를 연결해야 하지만 현재는 그대로 둔다.
{: .prompt-warning }
> 참고로 vmbr은 virtual switch 이다.
{: .prompt-tip }
![create-vm-7.png](/assets/proxmox/create-vm/7.png)

> `Start after created 체크, Finish 클릭`
![create-vm-8.png](/assets/proxmox/create-vm/8.png)

## Ubuntu Server 초기설정

위 프로세스를 정직히 따라했다면 아래와 같이 `ubuntu`이름을 가진 VM이 성공적으로 뜰것이다.

> 처음 VM이 이니셜라이즈 될때 초록색 마크가 뜨지 않을 수 있다. 이니셜라이징 중이라는 뜻이니 당황하지 말자
{: .prompt-tip }
![ubuntu-side.png](/assets/proxmox/ubuntu-boot/ubuntu-side.png)

그럼 Ubuntu Server Image 초기 설정을 시작해보자 크게 어렵지 않아 대부분의 과정을 생략하겠다.

> 필자는 name은 모두 `ubuntu`로 고정하고 password는 `0000`으로 고정하였다. 왜냐하면 실제로 해당 VM은 외부로 열지 않을 것이고 앞으로 많은 VM을 생성할때 헷갈리지 않기 위해 보안을 포기하고 단순한 이름 및 비밀번호룰 택하였다.
{: .prompt-tip }
> name, server's name, username, password 설정
![ubuntu-boot-2.png](/assets/proxmox/ubuntu-boot/ubuntu-boot-2.png)

> open ssh 서버 설정 (optional)
![ubuntu-boot-4.png](/assets/proxmox/ubuntu-boot/ubuntu-boot-4.png)

이제 마지막으로 네트워크 설정및 `ubuntu` VM이 잘 돌아가는지 검증하기 위헤 VM 콘솔로 들어가 `ping google.com` 커맨드로 테스트해보자
> `메인페이지 -> 사이드바 -> 노드 선택 (esteban) -> 900 (ubuntu) -> console -> ping google.com
![ubuntu-ping.png](/assets/proxmox/ubuntu-boot/ubuntu-ping.png)

성공적으로 `ping google.com` 이 작동되는 것을 확인하였다. 축하한다 드디어 VM 생성을 완료했다!

다음은 편의 설정인데 작업하다 보면 proxmox VE를 재시작하는 일도 번번히 생긴다. 그때마다 VM을 손수 켜기는 힘드므로 `start at boot` 설정을 켜주도록 하자

> `메인페이지 -> 사이드바 -> 노드 선택 (esteban) -> 900 (ubuntu) -> options -> start at boot` (optional)
![start-at-boot.png](/assets/proxmox/ubuntu-boot/start-at-boot.png)

## VM 템플릿화

VM 을 성공적으로 생성했다. 추후에 이런 과정으로 다시 하면 번거로우므로 현재 VM을 템플릿화 시켜준다.
> 템츨릿화를 하기 위해서는 해당 VM이 꺼져 있어야 한다
{: .prompt-warning }
> ![template1.png](/assets/proxmox/template/template1.png)

아까전 900번으로 VM을 만든 이유는 Proxmox VE는 왼쪽 사이드바에서 번호 순서대로 소팅하는데 미관상(?) 템플릿이 가장 밑에 있는 편이 좋기 때문이다.
생각보다 별거없지만 추후 많은 VM을 생성하면 100번대로 구분하는 일이 많아 좋다.
> ![template3.png](/assets/proxmox/template/template3.png)

이제 생성한 템플릿을 Clone 해준다.
![clone.png](/assets/proxmox/clone/clone.png)

> `Linked Clone`은 부모 VM 템플릿의 disk space를 공유한다. 다만 부모 VM 템플릿이 존재해야만 동작한다.
> 그에 반해 `Full Clone`은 모든 설정값을 copy 한 또다른 VM을 생성한다. [출처](https://pve.proxmox.com/wiki/VM_Templates_and_Clones#Definitions)
{: .prompt-info }
![clone1.png](/assets/proxmox/clone/clone1.png)



## qemu guest agent 설정

qemu guest agent 라니 생전 처음 보는 VM 용어라고 생각할 수 있다. 맞다 생전 처음 볼 것이다(?)

간단히 말해 host (Proxmox VE)와 guest (VM) 간의 정보 전달 및 커맨드 실행을 위한 helper [daemon](https://en.wikipedia.org/wiki/Daemon_(computing)) 이다.
> The qemu-guest-agent is a helper daemon, which is installed in the guest. It is used to exchange information between the host and guest, and to execute command in the guest. ([출처](https://pve.proxmox.com/wiki/Qemu-guest-agent))

> [daemon](https://en.wikipedia.org/wiki/Daemon_(computing)) 단순히 백그라우드 프로세스로 도는 컴퓨터 프로그램을 뜻한다.
{: .prompt-tip }

### qemu guest agent (host) 설정

기본적으로 `qemu guest agent`설정은 꺼져있을 것이다. 가서 켜주자

> `메인페이지 -> 사이드바 -> 노드 선택 (esteban) -> 900 (ubuntu) -> options -> QEMU Guest Agent`
![qemu-host.png](/assets/proxmox/qemu/qemu-host.png)

> 켤때 VM 사이드에서 qemu guest agent가 존재해야 된다고 말하지만 어차피 추후에 설정해도 문제없이 돌아가기 때문에 무시하고 켜주자
{: .prompt-tip }
> `Use QEMU Guest agent 체크 -> OK`
![qemu-warning.png](/assets/proxmox/qemu/qemu-warning.png)

### qemu guest agent (guest) 설정

이제 guest (VM) 애서도 qemu guest agent 를 설정하여야 한다. 당연히 `linux`, `window`, `redhat` 등등 OS 에 따라 설치 방법이 나뉜다.
필자는 `linux`로 설정을 진행하겠다.

```shell
sudo apt update && sudo apt dist-upgrade
sudo apt install qemu-guest-agent
```

성공적으로 `qemu-guest-agent` daemon이 실행됬으면 다음 커맨드로 확인할 수 있다.
```shell
systemctl status qemu-guest-agent
```

성공적인 경우 아래와 같은 결과가 나온다.
![qemu-warning.png](/assets/proxmox/qemu/qemu-active.png)

> OS에 따라서 qemu-guest-agent이 제대로 동작하지 않을 수 있다 그럴땐 다음 커멘드를 입력해보자 `systemctl start qemu-guest-agent`
> 그리고 부팅때마다 켜주도록 auto start 를 켜준다. `systemctl enable qemu-guest-agent` 이래도 되지 않으면 host 쪽 qemu 설정을 켜준뒤 VM을 껏다킨다.
{: .prompt-warning }

Host 설정을 따라가보면 성공적으로 qemu를 깔았을시 볼수 있는 IP가 나오는것을 볼 수 있다. (내부 IP이다 IP 보인다고 베껴서 해킹할 생각하지 마라)
> `메인페이지 -> 사이드바 -> 노드 선택 (esteban) -> 800 (ubuntu) -> summary
![qemu-warning.png](/assets/proxmox/qemu/qemu-ip.png)

## 후기

Proxmox VM 생각보다 간단하다고 생각했는데 막상 정리해보니 양이 상당히 많았다. 네트워크 까지 하면 산더미일거 같아 여기서 끊었다.
qemu 까지 설정했으니 추후에 네트워크 설정으로 다시한번 돌아오겠다.
