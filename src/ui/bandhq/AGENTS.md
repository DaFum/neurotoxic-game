# src/ui/bandhq - Agent Instructions

- `CatalogTab` callback prop names (`*Callback`) are shared by `CatalogTabProps`, `ShopTab`, `UpgradesTab`, tests, and mocks; rename only after updating every typed caller in the app.
- Shop/catalog labels use `ui:shop.messages.unknownItem` when `item.name` is not a string.
- Band HQ open behavior must route through the `MenuAction` action map (`openHQ`), not Overworld category index/order. If a change introduces order dependence, refactor it out.
