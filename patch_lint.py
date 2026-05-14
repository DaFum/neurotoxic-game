with open('src/hooks/useTravelLogic.ts', 'r') as f:
    text = f.read()
text = text.replace("onShowSupplyStop?: (inventory: any[]) => void", "onShowSupplyStop?: (inventory: import('../types/components').PurchaseItem[]) => void")
with open('src/hooks/useTravelLogic.ts', 'w') as f:
    f.write(text)

with open('src/scenes/Overworld.tsx', 'r') as f:
    text = f.read()
text = text.replace("useState<any[] | null>(null)", "useState<import('../types/components').PurchaseItem[] | null>(null)")
with open('src/scenes/Overworld.tsx', 'w') as f:
    f.write(text)

with open('src/ui/SupplyStopModal.tsx', 'r') as f:
    text = f.read()
text = text.replace("Warning: Purchasing goods here will negatively impact your band\\'s reputation.", "Warning: Purchasing goods here will negatively impact your band's reputation.")
with open('src/ui/SupplyStopModal.tsx', 'w') as f:
    f.write(text)

with open('src/utils/arrivalUtils.ts', 'r') as f:
    text = f.read()
text = text.replace("onShowSupplyStop?: (inventory: any[]) => void", "onShowSupplyStop?: (inventory: import('../types/components').PurchaseItem[]) => void")
with open('src/utils/arrivalUtils.ts', 'w') as f:
    f.write(text)
