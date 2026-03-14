import re

with open("src/context/reducers/clinicReducer.js", "r") as f:
    content = f.read()

# Replace executeClinicAction definition
content = re.sub(
    r"const executeClinicAction = \(state, payload, memberUpdater\) => \{.*?\n\s+const \{ memberId \} = payload",
    r"import { CLINIC_CONFIG } from '../gameConstants.js'\n\nconst executeClinicAction = (state, payload, memberUpdater) => {\n  const { memberId, type } = payload\n  const currentVisits = state.player?.clinicVisits || 0\n  const costMultiplier = Math.pow(CLINIC_CONFIG.VISIT_MULTIPLIER, currentVisits)",
    content,
    flags=re.DOTALL
)

content = re.sub(
    r"  // Normalize and validate costs\n  const cost = Number\.isFinite\(payload\.cost\) \? Math\.max\(0, payload\.cost\) : 0\n  const fameCost = Number\.isFinite\(payload\.fameCost\) \? Math\.max\(0, payload\.fameCost\) : 0",
    r"  // Calculate costs directly from state\n  const cost = type === 'heal' ? Math.floor(CLINIC_CONFIG.HEAL_BASE_COST_MONEY * costMultiplier) : 0\n  const fameCost = type === 'enhance' ? Math.floor(CLINIC_CONFIG.ENHANCE_BASE_COST_FAME * costMultiplier) : 0",
    content
)

with open("src/context/reducers/clinicReducer.js", "w") as f:
    f.write(content)
