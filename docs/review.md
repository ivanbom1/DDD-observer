# Code Review

The code does a solid job of applying DDD. Branded types on `OrderId` and `Amount` kill primitive obsession right at the root, and `Money` works as a proper value object — immutable, validated through `createMoney`, never existing in an invalid state. The `Order` entity has clear lifecycle management with status transitions that enforce business rules (can't add items to a confirmed order, can't complete without confirming first, etc.).

The Observer Pattern is cleanly bolted on at the end like the spec asked. `Observable<T>` is generic and reusable, the three observers (log, email, UI) each have a single responsibility, and the unsubscribe before `completeOrder` shows the pattern working in practice.

The FP approach is consistent — all order functions return new objects instead of mutating, which pairs well with the immutable types.

A few small things worth noting: `OrderItem.quantity` is a raw `number` with no brand, which leaves a small hole for primitive obsession. The status casts like `"CONFIRMED" as OrderStatus` work but feel slightly loose — a discriminated union narrowing would be cleaner. Also `cancelOrder` allows cancelling a CONFIRMED order, which may or may not reflect the intended business rules.

Overall though, this hits what the spec asked for. The "parse, don't validate" principle is visible throughout, and the line between factory functions and smart constructors is clear.
