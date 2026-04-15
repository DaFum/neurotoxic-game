import re

with open('tests/PostGig.component.test.jsx', 'r') as f:
    content = f.read()

# I see what I did wrong. The mock already contained `div data-testid='...'` inside the return statement, and I basically duplicated it by replacing the signature with `... => (\n <div...`. This caused nesting issues. I need to be more careful.

content = content.replace(
"""  ReportPhase: ({ onNext }) => (
    <div data-testid='mock-report-phase'>""",
"""  ReportPhase: ({ financials, onNext, ...layoutProps }) => (
    <div data-testid='mock-report-phase' {...layoutProps}>""")

content = content.replace(
"""  SocialPhase: ({ options = [], onSelect }) => (
    <div data-testid='mock-social-phase'>""",
"""  SocialPhase: ({ options = [], onSelect, trend, zealotryLevel, ...layoutProps }) => (
    <div data-testid='mock-social-phase' {...layoutProps}>""")

content = content.replace(
"""  DealsPhase: ({ offers = [], onAccept, onSkip }) => (
    <div data-testid='mock-deals-phase'>""",
"""  DealsPhase: ({ offers = [], onAccept, onSkip, ...layoutProps }) => (
    <div data-testid='mock-deals-phase' {...layoutProps}>""")

content = content.replace(
"""  CompletePhase: ({ onContinue, onSpinStory, player }) => (
    <div data-testid='mock-complete-phase'>""",
"""  CompletePhase: ({ onContinue, onSpinStory, player, social, result, ...layoutProps }) => (
    <div data-testid='mock-complete-phase' {...layoutProps}>""")

with open('tests/PostGig.component.test.jsx', 'w') as f:
    f.write(content)
