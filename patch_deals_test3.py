import re

with open("tests/DealsPhase.test.jsx", "r") as f:
    content = f.read()

content = content.replace("'Reject All Offers & Continue >'", "'ui:deals.rejectAll'")

with open("tests/DealsPhase.test.jsx", "w") as f:
    f.write(content)
