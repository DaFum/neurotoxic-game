import re

with open("src/utils/postGig/derivations.ts", "r") as f:
    content = f.read()

content = content.replace("import { calculateGigFinancials, applySwingSmoothing } from '../economy'", "import { calculateGigFinancials } from '../economy'")

with open("src/utils/postGig/derivations.ts", "w") as f:
    f.write(content)
