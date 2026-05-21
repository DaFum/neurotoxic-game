import sys

with open("src/utils/gameStateUtils.ts", "r") as f:
    content = f.read()

search = """          if ((rc as any).source === 'banter') {
            if (newBanterEvents === null) newBanterEvents = []
            if (now === 0) now = Date.now()
            newBanterEvents.push({
              member1: (rc as any).member1 as string,
              member2: (rc as any).member2 as string,
              delta: (rc as any).change as number,
              timestamp: (rc as any).timestamp ?? now
            })
          }"""

replace = """          const rcr = rc as RelationshipChange
          if (rcr.source === 'banter') {
            if (newBanterEvents === null) newBanterEvents = []
            if (now === 0) now = Date.now()
            newBanterEvents.push({
              member1: rcr.member1 as string,
              member2: rcr.member2 as string,
              delta: rcr.change as number,
              timestamp: rcr.timestamp ?? now
            })
          }"""

if search in content:
    content = content.replace(search, replace)
    with open("src/utils/gameStateUtils.ts", "w") as f:
        f.write(content)
    print("Replaced chunk 1 successfully")
else:
    print("Search string 1 not found")

with open("src/utils/gameStateUtils.ts", "r") as f:
    content = f.read()

search2 = """      if ((rawRC as any).source === 'banter') {
        nextBand.banterEvents = [
          ...(nextBand.banterEvents || []),
          {
            member1: (rawRC as any).member1 as string,
            member2: (rawRC as any).member2 as string,
            delta: (rawRC as any).change as number,
            timestamp: (rawRC as any).timestamp ?? Date.now()
          }
        ].slice(-50)
      }"""

replace2 = """      const rcr = rawRC as RelationshipChange
      if (rcr.source === 'banter') {
        nextBand.banterEvents = [
          ...(nextBand.banterEvents || []),
          {
            member1: rcr.member1 as string,
            member2: rcr.member2 as string,
            delta: rcr.change as number,
            timestamp: rcr.timestamp ?? Date.now()
          }
        ].slice(-50)
      }"""

if search2 in content:
    content = content.replace(search2, replace2)
    with open("src/utils/gameStateUtils.ts", "w") as f:
        f.write(content)
    print("Replaced chunk 2 successfully")
else:
    print("Search string 2 not found")
