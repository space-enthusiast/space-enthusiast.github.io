---
layout: post
title:  "데이터베이스 공부 - 5"
tags: [database,oracle-21c]
categories: [school]
---

# 데이터 무결성(Data Integrity)

## 데이터 무결성 정의
- 데이터의 정확서, 일관성, 유효성, 신뢰성을 위해 유효하지 않은 데이터의 수정으로부터 데이터를 보호
- 데이터베이스 내의 데이터가 현실 세계의 올바른 데이터를 갖도록 보장
- 데이터 무결성 갈화(enforcement) -> 데이터 무결성을 가지도록 하는 행위

## 데이터 무결성 종류
- 개체 무결성(Entity): 테이블의 데이터 인스턴스(로우, 행)를 유일하게 식별할 수 이쓴 속성이나 속성 그룹을 가져야 함
- 영역 무결성(Domain): 해당 컬럼의 값이 컬럼이 가질수 있는 값의 영역(도메인)내에 속한 값이어야 함
- 참조 무결성(Reference): 해당 컬럼의 값이 참조할 수 없는 값을 가질 수 없도록 함
- 사용자 정의 무결성: 다양하게 정의될 수 있는 비즈니스 규칙에 따라 일관성을 유지함

## 무결성 강화 방법
- 애플리케이션: 데이터를 조작하는 프로그램 내에 데이터 생성, 수정, 삭제 시 무결성 조건을 검정하는 코드를 추가
  - 장점: 사용자 정의 같은 복잡한 무결성 조건을 구현함
  - 단점:
    - 소스코드에 분산되어 관리의 어려움이 있음
    - 개별적으로 실행되므로 적정성 검토에 어려움

- 데이터베이스 트리거: 트리거 이벤트 시 적정한 SQL을 실행하여 무결성 조건을 실행함
  - 장점:
    - 통합 관리가 가능함
    - 복잡한 요건 구현 가능
  - 단점:
    - 운영 중 변경이 어려움
    - 사용자 주의가 필요함

- 제약조건: 데이터베이스 제약조건을 선언하여 무결성을 유지함
  - 장점:
    - 통합관리가 가능함
    - 간단한 선언으로 구현 가능
    - 변경이 용이하고 유효/무효 상태 변경이 가능함
    - 원천적으로 잘못된 데이터 발생을 막을 수 있음
  - 단점:
    - 복잡한 제약조건 구현이 불가능
    - 예외적인 처리가 불가능


# 개체 무결성(Entity Integrity)

## 개체 무결성 정의
- 테이블에 저장되는 각각의 로우에 대해서 유일성을 보장하기 위한 무결성
- 반드시 보장되어야 하므로, 프로그램이나 트리거 보다는 DBMS가 제공하는 **기본키(Primary Key)제약조건** 이나 유일성(Unique) 제약조건** 등을 이용하여 구현함

### 유일키(Unique Key) 제약조건
- 지정된 컬럼의 값이 중복되는 것을 허용하지 않음
- 테이블에 여러 개가 존재할 수 있음
- NULL 값은 허용
- + 복합 유일키(Composite Unique Key)

#### 유일키 제작조건 생성 예시 (oracle-21C)
```sql
CREATE TABLE unique_test (
    col1 VARCHAR2(10) UNIQUE,
    col2 VARCHAR2(10),
    col3 VARCHAR2(10),
    col4 VARCHAR2(10),

    CONSTRAINT "col2_UK" UNIQUE(col2),
    CONSTRAINT "col3col4_UK" UNIQUE(col3, col4)
);
```
![img1.png](/assets/database/chapter5/img1.png)

### 기본키(Primary Key) 제약조건
- 테이블에 있는 데이터를 유일하게 식별하기 위한 무결성 제약조건
- 테이블 당 하나만 지정 가능함
- **유일(Unique) 해야 하고, NULL 값을 가지면 안됨**
- 특정 컬럼(들)을 기본키로 지정하면, 자동으로 Unique 인덱스와 NOT NULL 속성을 가지게 됨
- 하나 또는 여러 개의 컬럼을 하나의 기본키로 만들 수 있음
- 기본키를 만들면 Primary Key 제약조건이, 유일키를 만들면 Unique 제약조건이 생성되며, 둘 모두 Unique 인덱스가 생성됨

### 기본키 제작조건 생성 예시 (oracle-21C)
```sql
CREATE TABLE pk_test(
    col1 VARCHAR2(10) PRIMARY KEY,
    col2 VARCHAR2(10)
);
```
```sql
CREATE TABLE pk_test(
    col1 VARCHAR2(10),
    col2 VARCHAR2(10),

    CONSTRAINT "col1_PK" PRIMARY KEY (col1)
);
```
![img2.png](/assets/database/chapter5/img2.png)


# 영역 무결성(Domain Integrity)

## 영역 무결성 정의
- 해당 컬럼의 값이 컬럼이 가질 수 있는 값의 영역(도메인) 내에 속한 값이어야 함
- 애플리케이션 프로그램의 기능에 의해 유효 값에 대한 검증을 선행
- 데이터베이스 제약조건을 선언하여 무결성을 강화

## 컬럼 데이터 타입(Data Type) 정의
- 데이터 타입은 컬럼에 저장되는 값의 형식과 범위를 제한하기 때문에 도메인 무결성을 위한 기초 단위

### 데이터 타입의 결정
- 데이터 타입 선정의 기본 원칙은 **최소한의 크기**로 사용자의 데이터 요구를 만족할 수 있는 타입을 선정하는 것임
- 저장되는 데이터가 차지하는 공간이 적을 수록 한 블록(페이지)에 더 많은 로우를 저장할 수 있으며 결과적으로 **데이터블록(페이지) 로딩 수가 줄어들어 좋은 성능을 발휘**하게 됨
- 문자와 숫자 데이터 형식은 일반적으로 데이터베이스에 정의되는 모든 데이터 형식의 90% 이상을 차지함

### 문자열 타입(Characcter Data Types) (oracle 21-C)
![img3.png](/assets/database/chapter5/img3.png)
![img4.png](/assets/database/chapter5/img4.png)
![img5.png](/assets/database/chapter5/img5.png)
![img6.png](/assets/database/chapter5/img6.png)

### 테이블 설계 시 고려사항
- 수직 분할
  - **컬럼 데이터의 길이 합이 블록 사이즈보다 큰 경우** 수직 분할을 고려 (속도 저라 현상을 유발)
  - **컬럼 길이가 길고 특정 컬럼의 사용 빈도 차이가 심한 경우** 이거나 **각기 다른 사용자 그룹이 특정 컬럼만을 사용하고 같이 처리되는 경우가 드문 경우**는 수직 분할을 고려
  - 수직 분할을 고려할 때에는 분할되는 테이블이 하나의 트랜잭션에 의해 동시에 처리되는 경우나 조인이 빈번히 발생되는 경우가 없어야 함

## NOT NULL 제약조건

### 널(NULL) 값
- 데이터베이스에서 널(Null)은 **아직 알려지지 않은(모르는) 값(Unknown value)이나, 해당 없음(Inapplicable)** 등의 이유로 정보 부재를 명시적으로 표시하기 위해 사용하는 특수한 데이터 값
- 공백(Blank)나 영(Zero)과는 분명히 다른 개념
- 숫자 타입의 컬럼은 계산에 이용되는 경우가 많은데, NULL 값이 존재하면 연산이 불가능하여 에러가 발생
- 이를 방지하기 위해 숫자 타입의 컬럼은 NOT NULL 제약조건을 부여하고 기본값으로 0을 정의하기도 함

### NOT NULL 제약조건
- 널 값을 가질 수 없는 컬럼은 NOT NULL 이라는 제약 조건을 별도로 명시해서 사용
- 컬럼의 순서는 일반적으로 테이블 내의 중요도에 따라 정해짐
- **검색에 자주 사용되는 컬럼을 앞으로 배치**
- 주로 앞쪽은 NOT NULL 컬럼, 뒤쪽은 NULL 컬럼이 되도록 적용

### CHECK 제약조건
- 컬럼 유효값에 대한 제약조건으로 CHECK를 이용
- 삽입(수정)되는 데이터를 검사해서 해당되는 영역의 데이터면 진행시키고, 그렇지 않으면 삽입(수정) 작업을 취소하는 역할을 수행
- TRUE 혹은 FALSE 값을 도출하는 어떤 조건도 포함될 수 있음

### CHECK 제약조건 생성 예시 (oracle-21C)
```sql
    CREATE TABLE emp_test(
    empid NUMBER(6,0) NOT NULL CHECK (empid>0),
    empname VARCHAR2(30) NOT NULL,
    address VARCHAR2(100) NULL CHECK (address like 'S%'),
    grade NUMBER(10,2) NULL,
    gender CHAR(2 CHAR) NULL,
    regdate DATE NULL ,

    CONSTRAINT check_gender CHECK ( gender IN ('남자','여자') )
)
```
![img7.png](/assets/database/chapter5/img7.png)
![img8.png](/assets/database/chapter5/img8.png)

### DEFAULT 속성

#### DEFAULT 정의
- DEFAULT는 데이터 제약조건에 포함되지는 않지만 컬럼단위로 설정되는 속성
- 데이터를 삽입할 때 컬럼의 값을 지정하지 않으면 미리 정의된 값을 자동으로 넣어주는 메커니즘
- 스칼라 값(문자, 숫자)와 스칼라 함수를 이용할 수 있음

#### DEFAULT 생성 예시 (oracle-21C)
```sql
CREATE TABLE emp_test(
    empid NUMBER(6,0) NOT NULL CHECK (empid>0),
    empname VARCHAR2(30) NOT NULL,
    address VARCHAR2(100) NULL CHECK (address like 'S%'),
    grade NUMBER(10,2) DEFAULT 3.9 NOT NULL,
    gender CHAR(2 CHAR) DEFAULT '남자' NOT NULL,
    regdate DATE DEFAULT SYSDATE NOT NULL ,

    CONSTRAINT check_gender CHECK ( gender IN ('남자','여자') )
);
```

# 참조 무결성(Referential Integrity)
- 테이블 사이의 관계 규칙을 정의하기 위한 제약조건
- 데이터가 입력, 수정, 삭제 될 때 두 테이블 로우 사이의 정합성과 일관성을 유지하는데 사용
- 참조하는 테이블(자식테이블)에 데이터가 삽입될 때에는 항상 참조되는 테이블(부모테이블)에 있는 값으로 들어가야 함
- 외래키 제약조건을 구현함

## 외래키(Foreign Key) 제약조건 설정 예시 (oracle-21C)
```sql
CREATE TABLE emp_test(
    empid NUMBER(6,0) NOT NULL CHECK (empid>0),
    empname VARCHAR2(30) NOT NULL,
    address VARCHAR2(100) NULL CHECK (address like 'S%'),
    grade NUMBER(10,2) DEFAULT 3.9 NOT NULL,
    gender CHAR(2 CHAR) DEFAULT '남자' NOT NULL,
    regdate DATE DEFAULT SYSDATE NOT NULL ,
    department_id NUMBER(4,0),

    CONSTRAINT check_gender CHECK ( gender IN ('남자','여자') ),
    CONSTRAINT fk_deptno FOREIGN KEY (department_id) REFERENCES DEPARTMENTS(DEPARTMENT_ID)
);
```
