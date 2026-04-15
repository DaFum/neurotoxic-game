import re

with open('tests/PostGig.leaderboard.test.jsx', 'r') as f:
    content = f.read()

# Fix CompletePhase
content = content.replace("CompletePhase: ({ onContinue, onSpinStory, player }) => (", "CompletePhase: ({ onContinue, onSpinStory, player, social, result, ...layoutProps }) => (\n    <div data-testid='mock-complete-phase' {...layoutProps}>")

with open('tests/PostGig.leaderboard.test.jsx', 'w') as f:
    f.write(content)
