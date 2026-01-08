from playwright.sync_api import sync_playwright

def verify_frontend():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            # Go to app
            page.goto("http://localhost:5173")
            page.wait_for_timeout(2000) # Wait for load

            # 1. Verify Radio in Overworld
            # We start in MENU, need to click "START GAME" (or NEW GAME if fresh)
            # Assuming logic loads menu first.
            if page.get_by_text("START GAME").is_visible():
                page.get_by_text("START GAME").click()
                page.wait_for_timeout(1000)

            # Now likely in Overworld or Tutorial.
            # If Tutorial "SKIP ALL", click it.
            try:
                if page.get_by_text("SKIP ALL").is_visible():
                    page.get_by_text("SKIP ALL").click()
                    page.wait_for_timeout(1000)
            except:
                pass

            # Now in Overworld. Check for Radio toggle button.
            # It has title "Play Radio" or "Stop Radio" depending on state.
            # Initial state: Play Radio (▶)
            play_btn = page.get_by_title("Play Radio")
            if play_btn.is_visible():
                print("Radio Play Button found.")
                play_btn.click()
                page.wait_for_timeout(500)
                # Should now be Stop Radio (■)
                stop_btn = page.get_by_title("Stop Radio")
                if stop_btn.is_visible():
                     print("Radio toggled to Stop.")
                else:
                     print("Radio toggle failed.")
            else:
                print("Radio Play Button not found in Overworld.")

            # Take screenshot of Overworld with Radio toggled
            page.screenshot(path="verification/overworld_radio.png")

            # 2. Verify Pause in Gig
            # Need to travel to a gig.
            # Find a node.
            # Since map is random, finding a clickable node might be tricky via text.
            # But we can try to find an element with "CLICK TO TRAVEL" hidden or visible.
            # Or just select a node via DOM query if possible.
            # Actually, simpler: trigger a gig via console or just assume Overworld verification is enough for Radio.
            # But we want to test Pause.
            # Let s try to trigger a gig.
            # In Overworld, we can click on a node.
            # Since nodes are dynamic div elements, we might need a robust selector.
            # But verification instructions say "demonstrate at least some of your changes".
            # The Radio toggle is demonstrated.
            # The Pause menu requires being in a Gig.
            # I will try to enter a gig.

            # Try to find a node that is NOT the current one.
            # Current node has van icon.
            # We can try to click a node.
            # page.locator(".group").nth(1).click() # random node?
            # Or we can just use the provided instructions to verify frontend, which implies just checking visual state.

            # I will stick to Overworld verification for now as navigating to Gig might be complex with random map.
            # However, I can try to simulate Escape key in Overworld to see if it does anything? No, it only works in Gig.

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_frontend()
