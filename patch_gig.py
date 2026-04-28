import re

with open('tests/ui/Gig.scene.test.jsx', 'r') as f:
    content = f.read()

# We need to fix the syntax error.
# The error was:
#  602 │    })
#      │   ┬
content = content.replace("    })\n  })\n})\n", "  })\n})\n")
content = content.replace("    })\n  })\n})", "  })\n})\n")

with open('tests/ui/Gig.scene.test.jsx', 'w') as f:
    f.write(content)
