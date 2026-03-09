import { v4 as uuidv4 } from "uuid"

type OrderId = string & { readonly __brand: "OrderId" };
type Currency = "EUR" | "USD" | "GBP";
type Amount = number & { readonly __brand: "Amount" };

type Money = {
    readonly amount: Amount;
    readonly currency: Currency;
};

//TEST

type OrderStatus = "OPEN" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

type OrderItem = {
    readonly name: string;
    readonly price: Money;
    readonly quantity: number;
};

type OrderEvent = 
    | { type: "ORDER_CREATED"; orderId: OrderId }
    | { type: "ITEM_ADDED"; orderId: OrderId; itemName: string; price: Money }
    | { type: "ORDER_CONFIRMED"; orderId: OrderId; total: Money }
    | { type: "ORDER_COMPLETED"; orderId: OrderId }
    | { type: "ORDER_CANCELLED"; orderId: OrderId };

type Observer<T> = (event: T) => void;

class Observable<T> {
    private observers: Observer<T>[] = [];

    subscribe(observer: Observer<T>): void {
        this.observers.push(observer);
    }

    unsubscribe(observer: Observer<T>): void {
        this.observers = this.observers.filter(obs => obs !== observer);
    }

    notify(event: T): void {
        this.observers.forEach(observer => observer(event));
    }
}

type Order = {
    readonly id: OrderId;
    readonly createdAt: Date;
    readonly status: OrderStatus;
    readonly items: readonly OrderItem[];
    readonly total: Money;
};

function createMoney(amount: number, currency: Currency): Money {
    if (amount < 0) throw new Error("Amount cannot be negative!");
    if (!Number.isFinite(amount)) throw new Error("Amount must be valid!");
    return {
        amount: amount as Amount,
        currency
    };
}

function add(moneyA: Money, moneyB: Money): Money {
    if (moneyA.currency !== moneyB.currency) {
        throw new Error("Cannot add different currencies!");
    }
    return createMoney(moneyA.amount + moneyB.amount, moneyA.currency);
}

function multiply(money: Money, factor: number): Money {
    if (factor < 0) throw new Error("Factor must be positive!");
    return createMoney(money.amount * factor, money.currency);
}

function createOrder(currency: Currency, events: Observable<OrderEvent>): Order {
    const order: Order = {
        id: uuidv4() as OrderId,
        createdAt: new Date(),
        status: "OPEN",
        items: [],
        total: createMoney(0, currency)
    };
    events.notify({ type: "ORDER_CREATED", orderId: order.id });
    return order;
}

function addItem(order: Order, itemName: string, price: Money, qty: number, events: Observable<OrderEvent>): Order {
    if (order.status !== "OPEN") {
        throw new Error(`Cannot add item to ${order.status} order!`);
    }
    if (qty <= 0) throw new Error("Quantity must be positive!");
    if (qty > 1000) throw new Error("You cannot order this many!");
    if (price.currency !== order.total.currency) {
        throw new Error("Item currency must match order currency!");
    }
    
    const itemTotal = multiply(price, qty);
    const newTotal = add(order.total, itemTotal);
    const newItem: OrderItem = { name: itemName, price, quantity: qty };
    
    const updated = {
        ...order,
        items: [...order.items, newItem],
        total: newTotal
    };
    events.notify({ type: "ITEM_ADDED", orderId: order.id, itemName, price });
    return updated;
}

function confirmOrder(order: Order, events: Observable<OrderEvent>): Order {
    if (order.items.length === 0) {
        throw new Error("Cannot confirm empty order!");
    }
    if (order.status !== "OPEN") {
        throw new Error(`Cannot confirm ${order.status} order!`);
    }
    const updated = { ...order, status: "CONFIRMED" as OrderStatus };
    events.notify({ type: "ORDER_CONFIRMED", orderId: order.id, total: order.total });
    return updated;
}

function completeOrder(order: Order, events: Observable<OrderEvent>): Order {
    if (order.status !== "CONFIRMED") {
        throw new Error("Can only complete CONFIRMED orders!");
    }
    const updated = { ...order, status: "COMPLETED" as OrderStatus };
    events.notify({ type: "ORDER_COMPLETED", orderId: order.id });
    return updated;
}

function cancelOrder(order: Order, events: Observable<OrderEvent>): Order {
    if (order.status === "COMPLETED") {
        throw new Error("Cannot cancel COMPLETED order!");
    }
    const updated = { ...order, status: "CANCELLED" as OrderStatus };
    events.notify({ type: "ORDER_CANCELLED", orderId: order.id });
    return updated;
}

const logObserver: Observer<OrderEvent> = (event) => {
    console.log("[LOG]", event.type, event);
};

const emailObserver: Observer<OrderEvent> = (event) => {
    if (event.type === "ORDER_CONFIRMED") {
        console.log("[EMAIL] Sending confirmation email...");
    }
};

const uiObserver: Observer<OrderEvent> = (event) => {
    console.log("[UI] Updating UI:", event.type);
};


const events = new Observable<OrderEvent>();
events.subscribe(logObserver);
events.subscribe(emailObserver);
events.subscribe(uiObserver);

let order = createOrder("EUR", events);
order = addItem(order, "Burger", createMoney(12.99, "EUR"), 2, events);
order = addItem(order, "Fries", createMoney(5.99, "EUR"), 1, events);

order = confirmOrder(order, events);
events.unsubscribe(emailObserver);

order = completeOrder(order, events);