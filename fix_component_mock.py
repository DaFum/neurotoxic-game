import re

with open('tests/PostGig.component.test.jsx', 'r') as f:
    content = f.read()

# Fix ReportPhase
content = content.replace("ReportPhase: ({ onNext }) => (", "ReportPhase: ({ financials, onNext, ...layoutProps }) => (\n    <div data-testid='mock-report-phase' {...layoutProps}>")

# Fix SocialPhase
content = content.replace("SocialPhase: ({ options = [], onSelect }) => (", "SocialPhase: ({ options = [], onSelect, trend, zealotryLevel, ...layoutProps }) => (\n    <div data-testid='mock-social-phase' {...layoutProps}>")

# Fix DealsPhase
content = content.replace("DealsPhase: ({ offers = [], onAccept, onSkip }) => (", "DealsPhase: ({ offers = [], onAccept, onSkip, ...layoutProps }) => (\n    <div data-testid='mock-deals-phase' {...layoutProps}>")

# Fix CompletePhase
content = content.replace("CompletePhase: ({ onContinue, onSpinStory, player }) => (", "CompletePhase: ({ onContinue, onSpinStory, player, social, result, ...layoutProps }) => (\n    <div data-testid='mock-complete-phase' {...layoutProps}>")

with open('tests/PostGig.component.test.jsx', 'w') as f:
    f.write(content)
