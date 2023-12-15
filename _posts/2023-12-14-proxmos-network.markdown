---
layout: post
title:  "Ubuntu 22.04 staitc IP 설정"
tags: [proxmox, vm, ubuntu]
categories: [home-lab, network]
date: 2023-12-14 00:00:00 +0000
---

# Ubuntu 22.04 staitc IP 설정

저번 포스팅에서는 Proxmox에 `Ubuntu Server 22.04.03` VM을 설치하였다.
이번 포스팅은 해당 VM에 static IP를 할당해볼 것이다.


## netplan 커멘드
Ubuntu Server 22.04 이상부터는 [`netplan utility`](https://netplan.readthedocs.io/en/stable/)를 통해 네트워크를 설정한다.

> Netplan is a network configuration abstraction renderer.
> It is a utility for network configuration on a Linux system. You create a description of the required interfaces and define what each should do
> Netplan meets the need of easy, descriptive network configuration in YAML across a versatile set of server, desktop, cloud or IoT installations.

netplan의 공식적인 설명이다. 네트워크 설정관련된 유틸리티 툴이라는 것을 알 수 있다.
YAML 기반 설정 파일도 지원한다 나와있다.

## netplan 으로 static IP 설정

[netplan 공식 문서](https://netplan.readthedocs.io/en/stable/examples/#introduction)에 netplan 관련 설정은 `/etc/netplan/*.yaml` 형태로 저장되어있다고 나와있다.

```shell
$ cd /etc/netplan
$ ls -l
total 4
-rw-r--r-- 1 root root 116 Dec  6 00:46 00-installer-config.yaml
$ cat 00-installer-config.yaml
# This is the network config written by 'subiquity'
network:
  ethernets:
    ens18:
      dhcp4: true
  version: 2
```

> yaml 파일명은 시스템마다 조금씩 다를 수 있다.
{: .prompt-tip }

기본적으로 `Ubuntu Server 22.04.03`을 설치하면 DHCP로 설정되었을 것이다.
DHCP로 설정된 IP를 확인해보자

```shell
$ ip a
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host
       valid_lft forever preferred_lft forever
2: ens18: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000
    link/ether 6a:05:a9:08:cb:9b brd ff:ff:ff:ff:ff:ff
    altname enp0s18
    inet 192.168.35.166/24 metric 100 brd 192.168.35.255 scope global dynamic ens18
       valid_lft 2395sec preferred_lft 2395sec
    inet6 fe80::6805:a9ff:fe08:cb9b/64 scope link
       valid_lft forever preferred_lft forever
```

**192.168.35.166/24** 를 할당받은 것을 알 수 있다. 현재 해당 Ubuntu 서버가 연결된 네트워크의 subnet 또는 충돌하는 IP를 확인하기 번거로우므로 해당 IP를 그대로 쓴다.


[Netplan으로 Static IP](https://netplan.readthedocs.io/en/stable/examples/#how-to-configure-a-static-ip-address-on-an-interface)로 바꿔준다.

```yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    ens18:
      addresses:
        - 192.168.35.166/24
```
> ethernets.ens18는 네트워크 인터페이스 이름으로 기존과 동일하게 해야한다.
{: .prompt-warning }

```shell
$ ls -l
total 4
-rw-r--r-- 1 root root 116 Dec  6 00:46 00-installer-config.yaml
$ sudo cp 00-installer-config.yaml 00-installer-config.yaml.backup
$ ls
00-installer-config.yaml  00-installer-config.yaml.backup
$ sudo rm -rf 00-installer-config.yaml
$ ls
00-installer-config.yaml.backup
$ vi config.yaml
$ ls
00-installer-config.yaml.backup config.yaml
```

[netplan try](https://netplan.readthedocs.io/en/0.106/netplan-try/) 설정을 테스트 및 적용한다.

```shell

```

[//]: # (ubuntu: 192.168.35.166)
[//]: # (ssh ubuntu@218.52.85.75 -p 9001 )
