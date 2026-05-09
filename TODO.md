# Fix lint errors (no-explicit-any)

## Plan (current)

- Replace all `any` types in the lint error paths with proper TypeScript interfaces/unions.
- Fix unused imports/vars where warnings are present.
- Re-run `npm run lint -- --max-warnings=0` until clean.

## Steps

1. app/api/orders/route.ts: replace `any` with typed order/item shapes.
2. app/api/orders/[id]/route.ts: replace `any` with typed order/item shapes.
3. app/api/menu/route.ts: replace `any` with typed menu shapes.
4. app/admin/page.tsx: replace `any` with typed supabase results; remove unused imports/vars.
5. app/order/[orderId]/page.tsx: remove `any` in items mapping.
6. components/admin/MenuTableClient.tsx, OrdersTableClient.tsx, OrderDetailClient.tsx: remove `any` in state/props and mapping.
7. Any remaining files reported by lint.
8. Run lint with `--max-warnings=0` to verify.
