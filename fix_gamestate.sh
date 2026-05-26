#!/bin/bash

# In @src/utils/gameStateUtils.ts:
# Around line 530-536: The type guard isRelationshipChange currently trusts
# properties found via prototype chain because it only uses isLooseRecord and
# typeof checks; change it to verify the three properties are own properties using
# Object.hasOwn(value, 'member1'), Object.hasOwn(value, 'member2') and
# Object.hasOwn(value, 'change') in addition to the existing typeof checks so
# inherited/proto-backed keys are rejected; keep isLooseRecord(value) as the
# initial shape guard but require own-key presence before returning true.
#
# Around line 1288-1293: Update the ownership checks so prototype properties
# can't be used: in the block that returns the sponsorship active check (using
# isLooseRecord and SponsorshipDealLike / d), require Object.hasOwn(deal, 'type')
# before comparing d.type === 'SPONSORSHIP', and use Object.hasOwn(deal,
# 'remainingGigs') to decide whether to read remainingGigs (if owned, ensure it's
# a number > 0; if not owned, treat as default 1). This keeps isLooseRecord/deal
# from trusting prototype-provided type or remainingGigs.

cat << 'AWK_SCRIPT' > fix_gamestate.awk
/const isRelationshipChange = \(value: unknown\): value is RelationshipChange => \{/ {
  print $0
  getline
  print $0
  getline
  print "  return ("
  getline
  print "    Object.hasOwn(value, 'member1') && typeof value.member1 === 'string' &&"
  getline
  print "    Object.hasOwn(value, 'member2') && typeof value.member2 === 'string' &&"
  getline
  print "    Object.hasOwn(value, 'change') && typeof value.change === 'number'"
  getline
  print "  )"
  getline
  print $0
  next
}
/export const hasActiveSponsorship = \(/ {
  in_sponsorship = 1
  print $0
  next
}
in_sponsorship && /return socialState\.activeDeals\.some\(deal => \{/ {
  print $0
  getline
  print $0
  getline
  print $0
  getline
  print "    return ("
  getline
  print "      Object.hasOwn(d, 'type') &&"
  print "      d.type === 'SPONSORSHIP' &&"
  print "      (Object.hasOwn(d, 'remainingGigs')"
  print "        ? (typeof d.remainingGigs === 'number' ? d.remainingGigs : 1)"
  print "        : 1) > 0"
  print "    )"
  getline
  getline
  getline
  getline
  next
}
{ print $0 }
AWK_SCRIPT
awk -f fix_gamestate.awk src/utils/gameStateUtils.ts > src/utils/gameStateUtils.ts.tmp && mv src/utils/gameStateUtils.ts.tmp src/utils/gameStateUtils.ts
