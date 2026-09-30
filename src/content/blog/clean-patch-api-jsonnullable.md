---
title: "깨끗한 PATCH API 만들기 (JsonNullable)"
description: "\"안 보냄\" 과 \"null 로 지움\" 을 구분 못하는 PATCH API 를 고치다가, 자체 구현 타입을 버리고 JsonNullable 로 갈아탄 이야기. Java Spring, Kotlin Spring, Ktor 에서 각각 어떻게 짜는게 좋은지도 정리했다."
date: 2026-09-30
tags: ["spring", "kotlin", "ktor", "api-design"]
categories: ["backend"]
---

회사에서 관리자용 상품 카드 수정 API 를 PUT 에서 PATCH 로 바꾸는 작업을 했다. 처음엔 필드 몇개만 nullable 로 바꾸면 끝날 줄 알았는데 생각보다 고민할 게 많았다. ~~하루면 끝날 줄 알았다~~

고민하면서 팀에 공유할 가이드를 하나 만들었고, 쓰다보니 이건 블로그에도 남겨둘 만하다 싶어서 정리해본다. 순서는 이렇다.

1. 흔히 짜는 PATCH API 가 뭐가 문제인지
2. 그래서 어떻게 고쳤는지
3. Java Spring 에서는 어떻게 짜는게 좋은지
4. Kotlin Spring 에서는 어떻게 짜는게 좋은지
5. Ktor 에서는 어떻게 짜는게 좋은지

# 기존 PATCH API 의 문제점

## 흔한 구현

PATCH 는 "보낸 필드만 바꾼다" 는 약속이다. 그래서 보통 이렇게 짠다.

```kotlin
data class ProductPatchRequest(
    val displayName: String? = null,
    val thumbnailUrl: String? = null,
)

fun patch(product: Product, req: ProductPatchRequest) {
    req.displayName?.let { product.displayName = it }
    req.thumbnailUrl?.let { product.thumbnailUrl = it }
}
```

null 이면 안 건드리고 값이 있으면 바꾼다. 간단하고 대부분의 경우 잘 돌아간다.

## 그런데 썸네일을 지우고 싶다면?

문제는 **비울 수 있는 필드** 가 끼는 순간이다. 관리자가 썸네일을 지우고 싶어서 이렇게 보냈다고 해보자.

```json
{ "thumbnailUrl": null }
```

그리고 이름만 바꾸고 싶은 다른 요청은 이렇다.

```json
{ "displayName": "새 이름" }
```

서버 입장에서 두 요청의 `thumbnailUrl` 은 똑같이 null 이다. 앞의 요청은 "지워줘" 이고 뒤의 요청은 "건드리지 마" 인데 DTO 에 들어오는 순간 구분이 사라진다. 결국 썸네일을 지울 방법이 없다.

정리하면 PATCH 필드는 상태가 세개다.

| JSON | 의미 |
|---|---|
| 키 없음 | 유지 |
| `null` | 비움 |
| 값 | 변경 |

그런데 Kotlin 의 `String?` 이나 Java 의 `String` 은 상태를 두개밖에 못 담는다. 여기서 모든 문제가 시작된다.

## 흔히 쓰는 우회책들

필자가 보고 들은 것들을 적어보면 이렇다.

- **빈 문자열로 지우기.** `""` 를 보내면 지운다. 문자열이면 어떻게든 되는데 날짜나 숫자에서 막힌다. 그리고 "빈 문자열이 진짜 값" 인 필드가 생기면 끝이다.
- **clear 플래그.** `clearThumbnailUrl: true` 같은 필드를 따로 둔다. 동작은 확실한데 필드가 두배가 되고 `thumbnailUrl: "x", clearThumbnailUrl: true` 같은 모순된 요청도 처리해야 한다.
- **Map 으로 받기.** `Map<String, Any?>` 로 받아서 `containsKey` 로 본다. 세 상태는 구분되지만 타입 검증, Bean Validation, API 문서가 전부 날아간다.
- **Java `Optional` 필드.** Jackson 에서 키 없음은 `null`, 명시적 null 은 `Optional.empty()` 로 들어오는 걸 이용한다. 돌아가긴 하지만 Optional 을 필드에 쓰는 것 자체가 안티패턴이고 `Optional` 변수가 null 일 수 있다는게 영 찝찝하다.

## 그래서 직접 만들었다

필자도 처음에는 Kotlin sealed 타입을 직접 만들었다.

```kotlin
sealed interface Patch<out T> {
    data object Absent : Patch<Nothing>
    data object Clear : Patch<Nothing>
    data class Value<T>(val value: T) : Patch<T>
}
```

`when` 으로 세 갈래를 컴파일러가 강제해주니까 Kotlin 답고 예뻤다. ~~만들 때는 뿌듯했다~~

그런데 이걸 실제로 쓰려면 딸려오는게 많았다.

- Jackson 역직렬화기. 키가 없을 때와 null 일 때를 구분하려면 `getNullValue`, `getAbsentValue`, `createContextual` 같은 훅을 직접 구현해야 한다.
- Bean Validation 값 추출기. `@Size(max = 2048)` 를 `Patch<String>` 안쪽 문자열에 걸려면 `ValueExtractor` 를 만들어 ServiceLoader 에 등록해야 한다. 게다가 Kotlin 은 타입 인자 어노테이션을 바이트코드에 안 내보내서 이 파일 하나는 **Java 로** 써야 했다.
- API 문서. springdoc 은 `Patch<String>` 이 뭔지 모르니 필드마다 `@Schema(implementation = String::class, nullable = true)` 를 붙여야 했다. 필드가 바뀌면 이것도 같이 고쳐야 한다.
- 이것들 전부의 단위 테스트.

다 합치니 200줄 정도에 Java 예외 파일 하나가 나왔다. PATCH 하나 하려고 우리가 소유해야 하는 코드치고는 너무 많았다.

# 개선방안

## 표준부터 보자

RFC 7396 JSON Merge Patch 가 이 모양을 정해둔 문서다. 바꿀 필드만 보내고 null 은 "지워라" 라는 뜻이다. Zalando, Azure 같은 큰 회사 API 가이드라인도 PATCH 는 Merge Patch 를 1순위로 둔다.

다만 RFC 는 요청 본문 모양만 정하고 서버에서 어떤 타입으로 받을지는 안 정한다. 서버 쪽은 크게 세 갈래다.

| 방식 | 장점 | 단점 |
|---|---|---|
| JSON 레벨 병합 (`readerForUpdating`, `JsonMergePatch`) | 필드 타입 걱정이 없다 | 보낸 필드만 골라서 검증하기 어렵다 |
| 자체 sealed 타입 | Kotlin 답고 컴파일러가 세 갈래를 강제한다 | 역직렬화, 검증, 문서를 전부 직접 챙겨야 한다 |
| `JsonNullable` | Java, OpenAPI 생태계의 사실상 기본값이다 | Java 식 래퍼라 컴파일러가 세 갈래를 강제하지 않는다 |

## JsonNullable 로 바꿨다

`JsonNullable` 은 OpenAPITools 의 `jackson-databind-nullable` 라이브러리에 있는 타입이다. OpenAPI Generator 가 nullable 필드를 만들 때 쓰는 그 타입이다.

```java
JsonNullable.undefined() // 키 없음 → 유지
JsonNullable.of(null)    // null     → 비움
JsonNullable.of("x")     // 값       → 변경
```

바꾼 이유는 세가지다.

**1. 우리가 들고 있던 코드가 거의 다 사라진다.**

| 항목 | 자체 Patch | JsonNullable |
|---|---|---|
| 타입 + 역직렬화기 | 직접 구현 70줄 | 라이브러리 모듈 |
| 안쪽 값 검증 (`@Size` 등) | Java 로 쓴 추출기 + ServiceLoader 등록 | 라이브러리가 ServiceLoader 로 자동 등록 |
| API 문서 | 필드마다 `@Schema` | springdoc 이 알아서 |
| 단위 테스트 | 99줄 | 통합 테스트로 충분 |
| **우리가 쓰는 코드** | **약 200줄** | **약 5줄** |

남는 건 Jackson 모듈 빈 한줄이랑 확장 함수 한줄이다.

**2. springdoc 이 알아본다.**

이게 제일 컸다. springdoc 3.1.1 과 2.9.1 부터 `JsonNullable` 을 타입만 보고 안쪽 타입으로 풀어서 그려준다 ([PR #3340](https://github.com/springdoc/springdoc-openapi/pull/3340)). `JsonNullable<String>` 이면 `type: [string, null]` 로 나오고, required 에서 빠지고, 필드에 붙은 `@Size` 는 `maxLength` 로 그대로 나온다.

재밌는건 springdoc 이 이 라이브러리를 의존하지도 않는다는 거다. 클래스 이름 문자열로만 알아본다. 그러니까 이건 `JsonNullable` 이라는 이름이 OpenAPI 쪽에 워낙 퍼져 있어서 받는 대접이다. 필자가 만든 `Patch` 는 아무리 잘 만들어도 이 대접을 못 받는다. 받으려면 springdoc 변환기를 우리가 복제해야 하는데 그건 자체 구현을 줄이자는 취지랑 정반대다.

**3. "JsonNullable 은 Jackson 2 전용" 은 옛날 얘기다.**

처음 자체 타입을 만든 이유 중 하나가 이거였는데 틀린 정보였다. 0.2.10 부터 Jackson 3 을 지원한다. 같은 artifact 안에 Jackson 2 용 `JsonNullableModule` 과 Jackson 3 용 `JsonNullableJackson3Module` 이 같이 들어있다. ~~KDoc 에 틀린 정보를 당당하게 적어놨었다~~

## 잃는 것도 있다

공짜는 아니다.

- **세 갈래 강제가 사라진다.** sealed `when` 은 하나라도 빼먹으면 컴파일이 안 되는데 `JsonNullable` 은 `isPresent` 랑 `get()` 을 조합하는 식이라 실수해도 컴파일러가 안 잡아준다. 그래서 판별하는 코드를 한 곳에만 두는 규칙으로 보완했다.
- **Kotlin 에서 `get()` 이 플랫폼 타입으로 온다.** `of(null)` 이면 null 이 나오는데 Kotlin 이 경고를 안 해준다. 받는 쪽은 반드시 nullable 로 받아야 한다.
- **의존성이 하나 늘어난다.** 이건 팀에서 승인받았다.

셋 다 규칙 한두줄로 막을 수 있는 수준이라 200줄을 들고 있는 것보다 낫다고 판단했다.

## 모든 필드를 JsonNullable 로 만들지는 않는다

이건 꼭 짚고 넘어가고 싶다. `JsonNullable` 은 **비울 수 있는 필드에만** 쓴다.

- 썸네일 URL, 브로셔 URL, 신규 라벨 만료일처럼 null 로 지울 수 있는 필드는 `JsonNullable<T>`.
- 상품명, 카테고리처럼 null 이 될 수 없는 필드는 그냥 `T?` 로 두고 null 이면 유지.

모든 필드를 `JsonNullable` 로 감싸면 "상품명을 null 로 보내면 어떻게 되지?" 를 필드마다 따로 처리해야 한다. 타입만 보고 "이건 비울 수 있는 필드구나" 가 읽히는게 더 좋다.

그리고 Content-Type 은 `application/json` 을 유지했다. `application/merge-patch+json` 을 선언하면 RFC 7396 의 재귀 병합까지 지켜야 하는데, 필자의 API 에는 JSON 객체를 통째로 교체하는 필드가 있어서 거기서 어긋난다. 규칙은 API 문서의 연산 설명에 한번만 적었다.

> 보낸 필드만 바꾼다. 비울 수 있는 필드(thumbnailUrl, brochureUrl ...)는 null 을 보내면 비운다. 나머지 필드는 null 을 보내도 유지된다. 배열과 JSON 객체 필드는 통째로 교체한다.

이제 스택별로 실제 코드를 보자.

# Java Spring 에서의 구현

## 의존성

```kotlin
// build.gradle.kts
implementation("org.openapitools:jackson-databind-nullable:0.2.12")
```

## Jackson 모듈 등록

Spring Boot 는 모듈 타입 빈을 `ObjectMapper` 에 자동으로 붙여준다. 빈 하나만 등록하면 된다.

```java
@Configuration
public class JacksonConfig {

    // Spring Boot 4 (Jackson 3)
    @Bean
    public JacksonModule jsonNullableModule() {
        return new JsonNullableJackson3Module();
    }

    // Spring Boot 3 (Jackson 2) 라면 이쪽
    // @Bean
    // public Module jsonNullableModule() {
    //     return new JsonNullableModule();
    // }
}
```

## 요청 DTO

```java
@Getter
public class ProductPatchRequest {

    @Size(max = 100)
    private String displayName;              // 비울 수 없음. null 이면 유지

    @Size(max = 2048)
    private JsonNullable<String> thumbnailUrl = JsonNullable.undefined();

    private JsonNullable<Instant> newLabelUntil = JsonNullable.undefined();
}
```

포인트는 두개다.

- 기본값을 반드시 `JsonNullable.undefined()` 로 준다. 키가 없으면 이 기본값이 그대로 남아서 "유지" 가 된다.
- `@Size` 는 필드에 그냥 붙이면 된다. 라이브러리의 값 추출기가 안쪽 문자열에 적용해준다. `of(null)` 은 검증을 통과한다.

`@Schema` 는 하나도 없다. springdoc 이 알아서 그린다.

## 적용

Java 에서는 `ifPresent` 가 제일 깔끔하다.

```java
public void patch(Product product, ProductPatchRequest req) {
    if (req.getDisplayName() != null) {
        product.changeDisplayName(req.getDisplayName());
    }
    req.getThumbnailUrl().ifPresent(product::changeThumbnailUrl); // of(null) 이면 null 로 비움
    req.getNewLabelUntil().ifPresent(product::changeNewLabelUntil);
}
```

`ifPresent` 는 `undefined()` 면 아무것도 안 하고 `of(null)` 이면 null 을 넘긴다. 딱 원하는 동작이다. 주의할 건 `get()` 을 직접 부르지 않는 것이다. `undefined()` 에서 `get()` 을 부르면 예외가 터진다.

# Kotlin Spring 에서의 구현

의존성과 모듈 빈은 Java 랑 같다. `jackson-module-kotlin` 이 이미 있다면 추가할 건 없다.

```kotlin
@Configuration
class JacksonConfig {
    @Bean
    fun jsonNullableModule(): JacksonModule = JsonNullableJackson3Module()
}
```

## 요청 DTO

```kotlin
data class ProductPatchRequest(
    @field:Size(max = 100)
    val displayName: String? = null,

    @field:Size(max = 2048)
    val thumbnailUrl: JsonNullable<String> = JsonNullable.undefined(),

    val newLabelUntil: JsonNullable<Instant> = JsonNullable.undefined(),
)
```

Kotlin 모듈은 JSON 에 키가 없으면 생성자 기본값을 쓴다. 그래서 기본값 `undefined()` 가 그대로 "유지" 가 된다. `@field:` 를 붙이는 것만 잊지 말자. 안 붙이면 생성자 파라미터에 붙어서 검증이 조용히 안 돈다.

## 확장 함수 한줄

Kotlin 에서는 판별 로직을 확장 함수 하나에 몰아둔다.

```kotlin
/** undefined 는 current 유지, of(null) 은 null, of(값) 은 새 값. 세 갈래 판별은 여기에만 둔다. */
fun <T> JsonNullable<T>.applyTo(current: T?): T? = if (isPresent) get() else current
```

그러면 서비스 코드가 이렇게 된다.

```kotlin
fun patch(product: Product, req: ProductPatchRequest) {
    product.displayName = req.displayName ?: product.displayName
    product.thumbnailUrl = req.thumbnailUrl.applyTo(product.thumbnailUrl)
    product.newLabelUntil = req.newLabelUntil.applyTo(product.newLabelUntil)
}
```

비울 수 없는 필드는 `?:`, 비울 수 있는 필드는 `applyTo`. 코드 모양만 봐도 어떤 필드가 비울 수 있는지 보인다.

## 규칙 두개

sealed 타입을 포기한 대가로 팀 규칙 두개를 정했다.

1. **`applyTo` 바깥에서 `get()` 을 부르지 않는다.** `get()` 은 플랫폼 타입이라 `val url: String = req.thumbnailUrl.get()` 을 써도 컴파일러가 안 막는다. `of(null)` 이면 non-null 변수에 null 이 조용히 들어간다.
2. **`of(null)` 과 `undefined()` 를 헷갈리지 않는다.** 전자는 비움, 후자는 유지다. 테스트 코드 쓸 때 특히 잘 틀린다. ~~필자가 틀렸다~~

# Ktor 에서의 구현

여기서부터는 얘기가 좀 달라진다.

`JsonNullable` 을 고른 가장 큰 이유가 springdoc 이었다. 그런데 Ktor 에는 springdoc 이 없고, 보통 Jackson 대신 kotlinx.serialization 을 쓴다. `JsonNullable` 은 Jackson 전용 타입이라 kotlinx.serialization 에서는 쓸 수가 없다.

도구가 알아봐주는 이점이 없으니 이번엔 반대로 **sealed 타입을 직접 만드는게 최선** 이다. 그리고 kotlinx.serialization 에서는 이게 Jackson 때보다 훨씬 짧다.

## 세 상태 타입

```kotlin
@Serializable(with = PatchSerializer::class)
sealed interface Patch<out T> {
    data object Absent : Patch<Nothing>
    data class Present<T>(val value: T) : Patch<T>
}

class PatchSerializer<T>(private val valueSerializer: KSerializer<T>) : KSerializer<Patch<T>> {
    override val descriptor: SerialDescriptor = valueSerializer.descriptor

    override fun deserialize(decoder: Decoder): Patch<T> =
        Patch.Present(valueSerializer.deserialize(decoder))

    override fun serialize(encoder: Encoder, value: Patch<T>) {
        when (value) {
            Patch.Absent -> error("Absent 는 직렬화하지 않는다")
            is Patch.Present -> valueSerializer.serialize(encoder, value.value)
        }
    }
}
```

상태를 `Absent`, `Present` 두개로 나누고 `Present` 안에 nullable 값을 넣는게 요령이다. `Patch<String?>` 로 쓰면 `Present(null)` 이 비움이 된다.

동작은 이렇다.

- 키가 없으면 kotlinx.serialization 은 serializer 를 아예 안 부르고 프로퍼티 기본값을 쓴다. 기본값을 `Absent` 로 두면 끝이다.
- 키가 있으면 serializer 가 불린다. `T` 가 `String?` 이면 `valueSerializer` 가 nullable serializer 라서 null 도 그대로 받아 `Present(null)` 이 된다.

Jackson 때처럼 `getAbsentValue` 같은 훅을 구현할 필요가 없다.

하나 주의할 점은 `Json { encodeDefaults = true }` 로 설정해두면 `Absent` 가 든 객체를 직렬화할 때 위의 `error(...)` 가 터진다는 거다. 기본값인 `encodeDefaults = false` 에서는 `Absent` 필드가 그냥 빠진다. 요청 전용 타입이라 보통은 문제가 안 되지만 테스트 코드에서 이 DTO 를 직렬화한다면 기억해두자.

## 요청 DTO 와 적용

```kotlin
@Serializable
data class ProductPatchRequest(
    val displayName: String? = null,
    val thumbnailUrl: Patch<String?> = Patch.Absent,
)

fun <T> Patch<T>.applyTo(current: T): T = when (this) {
    Patch.Absent -> current
    is Patch.Present -> value
}
```

```kotlin
patch("/products/{id}") {
    val req = call.receive<ProductPatchRequest>()
    val product = repository.find(call.parameters["id"]!!)

    product.displayName = req.displayName ?: product.displayName
    product.thumbnailUrl = req.thumbnailUrl.applyTo(product.thumbnailUrl)

    call.respond(product)
}
```

이번엔 `when` 이 두 갈래를 강제해준다. Spring 에서 포기했던 걸 여기서는 그대로 가져간다.

## 검증은?

Ktor 에는 Bean Validation 이 기본으로 없다. `RequestValidation` 플러그인에서 직접 검사하면 된다.

```kotlin
install(RequestValidation) {
    validate<ProductPatchRequest> { req ->
        val url = (req.thumbnailUrl as? Patch.Present)?.value
        if (url != null && url.length > 2048) ValidationResult.Invalid("URL 은 2048자 이하여야 합니다")
        else ValidationResult.Valid
    }
}
```

참고로 Ktor 에서도 Jackson 을 쓰고 있다면 `ContentNegotiation` 에 `JsonNullableModule` 을 등록해서 `JsonNullable` 을 똑같이 쓸 수 있다. 다만 문서 도구 이점이 없는 이상 굳이 그럴 이유는 별로 없다고 본다.

# 마치며

정리하면 필자의 결론은 이렇다.

- PATCH 에서 비울 수 있는 필드는 세 상태가 필요하다. `T?` 하나로는 안 된다.
- Spring (Java, Kotlin) 에서는 `JsonNullable`. springdoc 이 알아보는 유일한 타입이라 직접 짤 코드가 5줄로 줄어든다.
- Ktor + kotlinx.serialization 에서는 sealed 타입을 직접 만든다. 도구 이점이 없고 serializer 가 짧다.
- 어느 쪽이든 판별 로직은 `applyTo` 한 곳에 모은다.

처음에 sealed 타입을 만들 때는 이게 제일 Kotlin 다운 정답이라고 생각했다. 그런데 결국 "예쁜 코드" 보다 "생태계가 알아보는 코드" 가 유지보수 비용을 훨씬 많이 줄여줬다. 같은 sealed 타입이 Ktor 에서는 또 정답이 되는걸 보면 결국 정답은 타입이 아니라 주변 도구가 정하는 것 같다.

# 참고

- [RFC 7396 JSON Merge Patch](https://datatracker.ietf.org/doc/html/rfc7396)
- [jackson-databind-nullable](https://github.com/OpenAPITools/jackson-databind-nullable)
- [springdoc JsonNullable 지원 PR #3340](https://github.com/springdoc/springdoc-openapi/pull/3340)
- [Zalando RESTful API Guidelines](https://github.com/zalando/restful-api-guidelines/blob/main/chapters/http-requests.adoc)
- [Microsoft Azure REST API Guidelines](https://github.com/microsoft/api-guidelines/blob/vNext/azure/Guidelines.md)
- [Handling optional JSON fields for PATCH APIs with Jackson Kotlin (Leo Huang)](https://leohuang.dev/2025/06/08/Handling-optional-JSON-fields-for-PATCH-APIs-with-Jackson-Kotlin/)
