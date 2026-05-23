# src/ui/bandhq - Agent Instructions

- `CatalogTab` callback prop names (`*Callback`) are shared by `CatalogTabProps`, `ShopTab`, `UpgradesTab`, tests, and mocks; rename only after updating every typed caller in the app.
- Shop/catalog labels use `ui:shop.messages.unknownItem` when `item.name` is not a string.
- Band HQ open behavior must route through the `MenuAction` action map (`openHQ`), not Overworld category index/order. If a change introduces order dependence, refactor it out.
- `LeaderboardTab` numeric score columns render via `formatNumber(value, i18n.language)` (currency via `formatCurrency`). Do not regress to bare `value.toLocaleString()` — it ignores the i18n language.
