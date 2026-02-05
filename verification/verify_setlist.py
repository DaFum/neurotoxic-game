import sys
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Capture console logs to debug
        page.on("console", lambda msg: print(f"BROWSER CONSOLE: {msg.type}: {msg.text}"))
        page.on("pageerror", lambda exc: print(f"BROWSER ERROR: {exc}"))

        try:
            print("Navigating to http://localhost:5173/...")
            page.goto("http://localhost:5173/")

            # Start Tour
            page.wait_for_selector("text=Start Tour", timeout=10000)
            page.click("text=Start Tour")

            # Wait for Overworld
            page.wait_for_selector("text=TOUR PLAN", timeout=15000)
            print("In Overworld.")

        except Exception as e:
            print(f"Intermediate failure: {e}")

        # RESTART to test Main Menu -> Band HQ flow
        page.goto("http://localhost:5173/")
        page.wait_for_selector("text=Band HQ", timeout=10000)
        print("Clicking Band HQ in Main Menu...")
        page.click("text=Band HQ")

        # Wait for Band HQ Modal
        page.wait_for_selector("text=Stendal Rehearsal Room", timeout=5000)
        print("Band HQ Open.")

        # Click SETLIST tab
        print("Clicking SETLIST tab...")
        page.click("text=SETLIST")

        # Verify Songs are listed
        print("Verifying song list...")
        page.wait_for_selector("text=01 Kranker Schrank_V matze", timeout=5000)
        print("Found '01 Kranker Schrank_V matze'.")

        # Click SELECT
        print("Selecting song...")
        # Use a more specific locator strategy
        # Find the specific row containing the text, then find the button within it.
        # We assume the layout is a div with flex-row containing the name and the button.

        # This locator finds the container that has the text, and specifically a button inside it.
        # We use .first() to get the specific song row if multiple containers match (e.g. parent list).
        # We target the row by class if possible, but we don't have unique classes.
        # We can look for the 'SELECT' button that is visually near the text.

        # Using xpath for precision: Find button 'SELECT' that is a descendant of a div containing the song title
        page.click("div:has-text('01 Kranker Schrank_V matze') >> button:has-text('SELECT')")

        # Verify it changes to ACTIVE
        page.wait_for_selector("text=ACTIVE", timeout=2000)
        print("Song marked as ACTIVE.")

        # Take screenshot
        page.screenshot(path="verification/setlist_success.png")
        print("Verification Passed!")

        browser.close()

if __name__ == "__main__":
    run()
