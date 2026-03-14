import re

with open("tests/DealsPhase.test.jsx", "r") as f:
    content = f.read()

content = content.replace("'NO DEALS TODAY'", "'ui:deals.noDeals'")
content = content.replace("'CONTINUE TO OVERWORLD'", "'ui:deals.continue'")
content = content.replace("'NEGOTIATE'", "'ui:deals.negotiate'")
content = content.replace("'ACCEPT'", "'ui:deals.accept'")

with open("tests/DealsPhase.test.jsx", "w") as f:
    f.write(content)
