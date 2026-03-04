import { v4 as uuidv4 } from "uuid"


type Currency = "EUR" | "USD" | "GBP";
type Amount = number & { readonly __brand: "Amount" };

type Money = {
    readonly amount: Amount;
    readonly currency: Currency;
};


function createMoney(amount: number, currency: Currency): Money {
    if (amount < 0) throw new Error("Amount cannot be negative!");
    if (!Number.isFinite(amount)) throw new Error("Amount must be valid!");
    
    const brandedAmount = amount as Amount;
    
    return {
        amount: brandedAmount,
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

function format(money: Money): string {
    return `${money.amount.toFixed(2)} ${money.currency}`;
}

type Order = {
    readonly id: string;
    readonly name: string;
    readonly price: Money;
    readonly quantity: number;
    readonly total: Money;
};

function createOrder(name: string, price: Money, qty: number): Order {
    if (qty <= 0) throw new Error("Quantity must be positive!");
    if (qty > 1000) throw new Error("You cannot order this many!");
    
    const total = multiply(price, qty);
    
    return {
        id: uuidv4(),
        name,
        price,
        quantity: qty,
        total
    };
}


const priceEUR = createMoney(12.99, "EUR");
const priceUSD = createMoney(50, "USD");

const orderOne = createOrder("Burger", priceEUR, 2);
const orderTwo = createOrder("Steak", priceUSD, 1);

console.log("Order One:", orderOne);
console.log("Formatted price:", format(priceEUR));

const total = add(priceEUR, createMoney(5.01, "EUR"));
console.log("Combined:", format(total));

function updateOrderPrice(order: Order, newPrice: Money): Order {
    const newTotal = multiply(newPrice, order.quantity);
    return {
        ...order,
        price: newPrice,
        total: newTotal
    };
}

const updatedOrder = updateOrderPrice(orderOne, createMoney(15.99, "EUR"));
console.log("Original:", orderOne.price);
console.log("Updated:", updatedOrder.price);
console.log("Same object?", orderOne === updatedOrder);