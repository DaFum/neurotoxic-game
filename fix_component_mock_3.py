import re

with open('tests/PostGig.component.test.jsx', 'r') as f:
    content = f.read()

content = content.replace("""    <div data-testid='mock-report-phase' {...layoutProps}>
    <div data-testid='mock-report-phase'>""", """    <div data-testid='mock-report-phase' {...layoutProps}>""")

content = content.replace("""    <div data-testid='mock-social-phase' {...layoutProps}>
    <div data-testid='mock-social-phase'>""", """    <div data-testid='mock-social-phase' {...layoutProps}>""")

content = content.replace("""    <div data-testid='mock-deals-phase' {...layoutProps}>
    <div data-testid='mock-deals-phase'>""", """    <div data-testid='mock-deals-phase' {...layoutProps}>""")

content = content.replace("""    <div data-testid='mock-complete-phase' {...layoutProps}>
    <div data-testid='mock-complete-phase'>""", """    <div data-testid='mock-complete-phase' {...layoutProps}>""")

with open('tests/PostGig.component.test.jsx', 'w') as f:
    f.write(content)
