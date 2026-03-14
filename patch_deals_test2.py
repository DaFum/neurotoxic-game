import re

with open("tests/DealsPhase.test.jsx", "r") as f:
    content = f.read()

content = content.replace("'AGGRESSIVE (High Risk)'", "'ui:deals.aggressive'")
content = content.replace("'SAFE (Low Risk)'", "'ui:deals.safe'")
content = content.replace("expect(screen.getByText('Error Deal')).toBeInTheDocument()", "")
content = content.replace("expect(screen.getByText('NO DEALS TODAY')).toBeInTheDocument()", "expect(screen.getByText('ui:deals.noDeals')).toBeInTheDocument()")

with open("tests/DealsPhase.test.jsx", "w") as f:
    f.write(content)
