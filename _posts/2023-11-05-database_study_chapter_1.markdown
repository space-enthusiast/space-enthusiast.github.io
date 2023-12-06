---
layout: post
title:  "데이터베이스 공부 - 1"
tags: [database,oracle-21c]
categories: [school]
---

# relation database

## relational data model

### history
- 1963: need for computer-centered database
- 1960: navigational DBMS (tree)
- 1970: relational DBMS
- 1970~: SQL DBMS
- 1980: pbject-oriented databases
- 21 centuary: NOSQL databases

### 관계형 데이터 모델 (relational data model)


| 학번 | 이름     | 학과 |
|----|--------|----|
| 1  | alive  | SE |
| 2  | bob    | EE |


- 1970 IBM 연구소에서 "A Relational Model for Large Shared Data Banks" 라는 논문에서 소개
- 수학적 릴레이션 (Mathematical relation)의 개념을 사용해서 테이블의 형태로 표현
- 관계형 데이터베이스는 **릴레이션**의 집합

### 릴레이션의 구조
![img1.png](/assets/database/chapter1/img1.png)
- 추가용어
    - 도메인(Domain): 애트리뷰트가 가질 수 있는 값의 범위 또는 값의 집합
    - 차수(Degree): 릴레이션의 애트리뷰트의 개수
    - 카디날리티(Cardinality): 릴레이션을 구성하는 튜플의 개수
- 특징
    - 집합 이론(set theory)에 기초
    - 한  릴레이션에 포함된 튜플들은 모두 상이하다(유니크하다).
    - 모든 애트리뷰트 값은 원자값(atomic value)이다.
    - 한 릴레이션을 구성하는 튜플과 애트리뷰트 사이에는 순서가 없다.
        - 집합은 안의 원소가 순서가 없다.
        - 집합의 집합도 순서가 없다.

## DBMS
- Database Management System
- ![ch1-img2.png](/assets/database/chapter1/img2.png)
- 정의(definition)
    - 데이터의 논리적 구조, 물리적 구조, 제약조건 등을 정의
- 조작(manipulation)
    - 사용자와 데이터베이스 사이의 인터페이스를 위한 수단
    - 데이터의 검색, 수정, 삽입, 삭제 등 데이터베이스 연산을 지원하는 도구(언어)를 통해 구현 (sql)
- 제어(contral)
    - 스키마 관리, 디스크 관리, 사용자 관리, 백압, 복제 등
    - 데이터베이스의 내용에 대해 항상 적확성과 안전성을 유지

### DBMS 구조
![ch1-img3.png](/assets/database/chapter1/img3.png)

### 관계형(relational) DBMS
- 관계형 데이터베이스 모델을 기반으로 하는 DBMS
- 표준 SQL을 데이터베이스 언어로 기본 제공
- 특징
    - select, project, join 관계 대수를 사용
    - 모델이 단순 모델링이 쉬움
    - sql을 이용한 간단한 조작
    - 많은 사용자수, 대규모 트랜잭션으로 인한 성능 및 처리 능력을 요구
    - 분산 데이터베이스, 미러링, 복제 등 장애 복구 기능 등

#### Oracle (commercial relational DBMS)
#### Microsoft SQL Server (commercial relational DBMS)
#### MySQL (open source relational DBMS)
- open source DBMS
- 데이터베이스 국제 표준 충실하게 구현
    - ANSI SQL 99
    - SQL/PSM
#### MariaDB (open source relation DBMS)
- MariaDB foundation
- MySQl 호환 가능한 MariaDB 출시 (2013)

