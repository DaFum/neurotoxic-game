from playwright.sync_api import sync_playwright
import time

def verify_gig_visuals():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # 1. Load Game
        print("Loading game...")
        page.goto("http://localhost:5174")

        # 2. Start New Game
        print("Starting new game...")
        try:
            page.get_by_text("Start Tour", exact=True).click()
        except:
             page.locator("button:has-text('Start Tour')").click()

        # 3. Handle Overworld
        print("In Overworld.")
        page.wait_for_selector("text=TOUR PLAN")

        # 4. Find and Travel to a Gig
        max_attempts = 10
        found_gig = False

        for i in range(max_attempts):
            if page.get_by_text("PREPARATION").is_visible():
                found_gig = True
                print("Arrived at Gig (PreGig screen)!")
                break

            print(f"Attempt {i+1} to find a gig...")

            # Find reachable nodes
            reachable_nodes = page.locator(".cursor-pointer")
            count = reachable_nodes.count()

            if count == 0:
                print("No reachable nodes found? Waiting...")
                time.sleep(1)
                continue

            print(f"Clicking node...")
            reachable_nodes.first.click()

            # Wait for travel animation
            time.sleep(2.0)

            # Check for Event Modal
            if page.get_by_text("EVENT:").is_visible():
                print("Encountered Event. dismissing...")
                if page.get_by_text("Continue").is_visible():
                    page.get_by_text("Continue").click()
                elif page.get_by_text("Leave").is_visible():
                    page.get_by_text("Leave").click()
                elif page.get_by_text("Close").is_visible():
                    page.get_by_text("Close").click()
                time.sleep(1)

            # Check for PreGig
            if page.get_by_text("PREPARATION").is_visible():
                found_gig = True
                break

        if not found_gig:
            print("Failed to reach a Gig.")
            page.screenshot(path="verification/failed_to_reach_gig.png")
            browser.close()
            return

        # 5. Setup PreGig
        print("Setting up Gig...")
        try:
            page.locator("text=Diff:").first.click()
        except:
             print("Could not click song. Maybe already selected?")

        # Click Start Show
        page.get_by_text("START SHOW").click()

        # 6. Verify Gig
        print("Gig Started. Waiting for visuals...")
        # Wait for "CROWD ENERGY" which is in GigHUD
        page.wait_for_selector("text=CROWD ENERGY")

        time.sleep(3) # Let notes fall

        print("Taking screenshot...")
        page.screenshot(path="verification/gig_visuals.png")

        browser.close()
        print("Verification complete.")

if __name__ == "__main__":
    verify_gig_visuals()
