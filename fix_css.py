import sys

with open("src/index.css", "r") as f:
    content = f.read()

import re
content = re.sub(
    r'(@import "\./overworld\.css";\n/\* stylelint-disable-next-line import-notation \*/\n@import \'tailwindcss\';)',
    r"/* stylelint-disable-next-line import-notation */\n@import 'tailwindcss';\n@import \"./overworld.css\";",
    content
)

with open("src/index.css", "w") as f:
    f.write(content)
