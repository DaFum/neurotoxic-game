# Perfect TSDoc Example

Use this as a model when a user asks for a complete TSDoc block rather than a quick tag lookup.

```ts
/**
 * Calculates the total price of the items in the cart.
 *
 * @remarks
 * This function applies the regional tax rate but does not factor in shipping costs.
 *
 * @typeParam T - The currency payload type extending `BaseCurrency`.
 * @param cart - The cart items to process. Must not be empty.
 * @param discountCode - An optional promotional discount code.
 * @returns The final calculated total in the specified currency.
 *
 * @throws {@link InvalidCartError}
 * Thrown if the cart is empty.
 *
 * @example
 * ```ts
 * const total = calculateTotal(myCart, 'SUMMER20');
 * console.log(`Total: $${total}`);
 * ```
 */
export function calculateTotal<T extends BaseCurrency>(
  cart: CartItem[],
  discountCode?: string
): number {
  // Implementation
}
```

Notice what the comment does not say:

- It does not restate that `cart` is `CartItem[]`.
- It does not restate that `discountCode` is `string | undefined`.
- It explains the empty-cart failure mode because that affects how callers should use the function.
