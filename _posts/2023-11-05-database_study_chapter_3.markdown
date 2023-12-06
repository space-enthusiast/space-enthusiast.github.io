---
layout: post
title:  "데이터베이스 공부 - 3"
tags: [database,oracle-21c]
categories: [school]
---

# 데이터베이스 저장구조

## 데이터베이스 생성시 고려사항
- 데이터베이스의 용도: OLTP, OLAP에 따라 설계 요구사항이 달라짐
  - OLTP(Online Transaction Processing): 온라인 트랜잭션 처리
  - OLAP(Online Analytical Processing): 온라인 분석 처리
- 트랜잭션 처리도:
  - OLTP 데이터베이스는 많은 경우의 트랜잭션이 빠른 시간 내에 처리되어야 함
  - 정규화 레벨, 인덱스 전략, 데이터 분리 등의 방법으로 트랜잭션 처리도를 높임
- 데이터 증가량:
  - 대용량의 데이터는 그에 맞는 하드웨어 자원(DISK, MEMORY, CPU) 를 요구함
  - 월단위, 연단위의 데이터 증가량을 추정하여 데이터베이스가 지속적으로 운영되도록 관리
- 데이터 파일 분포도:
  - 데이터베이스 파일의 분포는 데이터베이스 전체 성능에 큰 영향을 줌
  - 데이터베이스 파일들을 여러개의 독립된 디스크에 나누어서 저장해야 함

## 오라클 데이터베이스 저장구조
### 데이터베이스의 물리적 실체
- 데이터베이스는 물리적으로 파일로 저장됨
- 하나의 데이터베이스는 기본적으로 데이터파일과 로그파일로 구성됨 (Orcale은 콘트롤 파일 존재)
- ![img1.png](/assets/database/chapter3/img1.png)

### 논리적 저장구조
- ![img2.png](/assets/database/chapter3/img2.png)

### 테이블스페이스(Tablespace)
- 오라클 데이터베이스는 **하나 또는 그 이상의 테이블 스페이스로 구성됨**
- 테이블스페이스는 하나 또는 여러개의 데이터 파일로 구성되는 논리적인 데이터 저장구조
- 데이터를 직접적으로 구성하는 **스키마 객체(테이블, 뷰, 인덱스, 클러스터, 시퀀스, 저장프로시저 등)** 의 모임
- 기본적으로 SYSTEM, UNDO, SYSAUX, TEMP 테이블 스페이스가 있으며 사용자에 의해 추가/삭제할 수 있음
- ![img3.png](/assets/database/chapter3/img3.png)

### 세그먼트(Segment)
- 테이블스페이스에 생성되는 데이터베이스 스키마 객체(테이블, 인덱스 등)을 저장하는 단위
- ![img4.png](/assets/database/chapter3/img4.png)

### 데이터블록(Data Block)
- 데이터 블록은 오라클 블록 또는 **페이지**라고 불리는 오라클 내의 **가장 적은 저장 단위**로 데이터베이스 데이터는 여기에 저장된다.
- 데이터 블록은 실제 **물리적 하드디스크상의 저장공간** 으로 데이터베이스가 생성될 때 오라클 파라미터 파일에서 그 크기를 지정함
- 블록이 클수록 I/O 횟수는 줄어들지만 공간의 낭비가 발생할 수 있다.
- ![img5.png](/assets/database/chapter3/img5.png)

### 익스텐트(Extent)
- 연속적으로 있는 블록들을 묶어 놓는 논리적 단위
- 연속적인 블록들을 **하나의 익스텐트로 묶어서 관리하면 연속된 데이터들을 관리하는데 효율적**
- 최초 테이블을 생성할 때 초기 크기를 정의하고 이후에 공간이 부족하며 다시 저장공간을 배정받아서 데이터를 저장

## 데이터베이스 아키텍처

### 트랜잭션(Transaction)
- 한 묶음으로 처리되어야 하는 데이터베이스 변경 명령어들의 집합
- ALL or NOTHING
```sql
SET TRANSACTION NAME 'bal_update';

UPDATE saving_accounts
SET balance = balance - 1000000
WHERE account = '3209';

UPDATE checking_accounts
SET balance = balance + 1000000
WHERE account = '3208';

COMMIT;
```

### SQL문 (트랜잭션)이 동작하는 과정
- ![img6.png](/assets/database/chapter3/img6.png)

### DBMS 성능
- 데이터베이스 성능에 가장 영향을 미치는 요소 -> 디스크 I/O
  - 디스크 I/O를 줄이고 메모리 I/O를 높이는 방향으로 설계
  - 장애나 오류 시에 원상태로 복구할 수 있어야 함
  - 다중 사용자 환경에서 데이터 일관성을 보장해야 함

## 오라클 데이터베이스 아키텍쳐
- ![img7.png](/assets/database/chapter3/img7.png)

### 오라클 구조

#### 메모리 영역
- 시스템 공유 영역(System Global Area, SGA)
  - **오라클에 할당된 메모리 버퍼들의 집합**
  - **하나의 SGA + 백그라운드 프로레스 -> 오라클 데이터베이스 인스턴스**
  - 인스턴스가 시작되면 메모리에서 인스턴스가 사용할 SGA를 할당 받고 종료될 때 반납
  - 데이터베이스에 연결된 사용자들은 SGA를 공유
  - SGA가 크면 메모리에 많은 데이터를 저장하여 성능을 높일 수 있음
- 시스템 공유 영역 구성요소
  - ![img8.png](/assets/database/chapter3/img8.png)
  - 데이터베이스 버퍼 캐시(Databse Buffer Cache)
    - **수행되는 질의문들이 필요로 하는 데이터를 보관하고 작업을 수행하는 공간**
    - **LRU(Least Recently Used) 알고리즘**에 의하여 가장 최근에 사용된 데이터 블록을 메모리에 유지
    - 메모리 사이즈는 최상의 성능을 유지하기 위해서 **DBMS가 지속적으로 조정**
  - 리두로그 버퍼(Redo Log Buffer)
    - 데이터베이스에 **변경되는 모든 사항**을 저장
      - DML, DML 명령에 의해 병경된 블록 번호, 변경 위치, 변경 전후 값
      - 버퍼에 저장된 리두(Redo) 항목 들은 데이터베이스 복구에 사용되는 온라인 리두 로그 파일에 저장
      - 온라인 리두 로그 파일이 재사용되는 시점의 로그데이터는 Archived Redo Log파일로 저장(백업)
  - 공유 풀(Shared Pool)
    - 라이브러리 캐시(Library Cache)는 공유 SQL 영역을 포함하며 최근에 사용한 SQL 문장과 PL/SQL 문에 대한 정보, 실행 계획 등의 정보가 저장됨
    - 데이터 사전 캐시는 데이터베이스에서 최근에 사용된 데이터베이스 파일, 테이블, 인덱스, 사용자, 권한, 기타 객체 들의 정보를 저장
    - 결과 캐시는 최근 조회된 결과값을 저장

#### 프로세스 영역
- 프로그램 공유 영역(Program Global Area)
  - **서버 프로세스나 백그라운드 프로세스에 대한 데이터나 제어 정보** 를 저장하는 메모리 버퍼
  - ![img9.png](/assets/database/chapter3/img9.png)
- 서버 프로세스
  - 사용자가 요청한 질의문을 실행시키고 결과를 다시 사용자 프로세스로 전달하는 역할
  - 사용자가 SGA의 버퍼에 없는 데이터 조회를 원한다면 서버프로세스는 데이터파일에서 SGA로 해당 데이터 블록을 가져오고 원하는 데이터를 사용자에게 전송
  - ![img10.png](/assets/database/chapter3/img10.png)
- 사용자 프로세스: 사용자가 응용 프로그램을 실행할 때 생기는 프로세스
- 백그라운드 프로세스
  - 데이터베이스 내의 물리적 구조(데이터 파일)와 메모리 구조(SGA) 사이를 관리
  - ![img11.png](/assets/database/chapter3/img11.png)
  - ![img12.png](/assets/database/chapter3/img12.png)
