from playwright.sync_api import sync_playwright
import json
import time

def verify_post_gig():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Minimal valid save state
        save_data = {
            "currentScene": "POSTGIG",
            "player": {
                "money": 500,
                "day": 1,
                "time": 12,
                "score": 0,
                "fame": 0,
                "fameLevel": 0,
                "tutorialStep": 99,
                "van": {
                    "fuel": 100,
                    "condition": 100,
                    "upgrades": [],
                    "breakdownChance": 0.05
                },
                "stats": { "totalDistance": 0, "conflictsResolved": 0, "stageDives": 0 }
            },
            "band": {
                "members": [
                    {"name": "Matze", "mood": 80, "stamina": 100, "traits": []},
                    {"name": "Lars", "mood": 80, "stamina": 100, "traits": []},
                    {"name": "Marius", "mood": 80, "stamina": 100, "traits": []}
                ],
                "harmony": 80,
                "inventory": { "strings": True },
                "performance": { "guitarDifficulty": 1 }
            },
            "social": {
                "instagram": 10000,
                "tiktok": 5000,
                "youtube": 2000,
                "newsletter": 0,
                "viral": 0,
                "lastGigDay": None,
                "controversyLevel": 0,
                "loyalty": 0,
                "egoFocus": None,
                "sponsorActive": False,
                "trend": "DRAMA",
                "activeDeals": []
            },
            "gameMap": {
                "nodes": {
                    "node_0": { "id": "node_0", "x": 100, "y": 100, "type": "START", "layer": 0, "connections": [] }
                },
                "connections": []
            },
            "currentGig": {
                "id": "test_gig",
                "venue": { "name": "The Rusty Spoon", "capacity": 100, "type": "BAR" },
                "pay": 500,
                "type": "BAR",
                "ticketPrice": 15
            },
            "lastGigStats": {
                "score": 45000,
                "accuracy": 92,
                "maxCombo": 55,
                "events": []
            },
            "settings": { "crtEnabled": False, "tutorialSeen": True }
        }

        print("Navigating to app...")
        page.goto("http://localhost:5173")
        time.sleep(2)

        print("Injecting save data...")
        page.evaluate(f"localStorage.setItem('neurotoxic_v3_save', '{json.dumps(save_data)}');")
        page.evaluate("localStorage.setItem('neurotoxic_global_settings', '{\"tutorialSeen\": true}');")

        print("Reloading...")
        page.reload()
        time.sleep(3)

        # Check current state
        state = page.evaluate("window.gameState || {}")
        print(f"Current Scene (After Reload): {state.get('currentScene')}")

        # SKIP INTRO
        if state.get('currentScene') == 'INTRO':
            print("Skipping INTRO...")
            page.mouse.click(100, 100)
            time.sleep(2)
            state = page.evaluate("window.gameState || {}")
            print(f"Current Scene (After Skip): {state.get('currentScene')}")

        try:
            # Try to click LOAD GAME
            try:
                page.wait_for_selector("button:has-text('LOAD GAME')", timeout=3000)
            except:
                pass

            load_btn = page.get_by_role("button", name="LOAD GAME")
            if load_btn.is_visible():
                print("Found LOAD GAME button, clicking...")
                load_btn.click()
                time.sleep(3)

                # Check state again
                state = page.evaluate("window.gameState || {}")
                print(f"Current Scene (After Load): {state.get('currentScene')}")

                # Force scene change if needed
                if state.get('currentScene') == 'OVERWORLD':
                     print("Forcing scene change to POSTGIG...")
                     page.evaluate("window.gameState.changeScene('POSTGIG')")
                     time.sleep(2)

            else:
                print("LOAD GAME button not visible.")

        except Exception as e:
            print(f"Could not find/click LOAD GAME: {e}")

        # Verify PostGig
        try:
            page.wait_for_selector("text=GIG REPORT", timeout=5000)
            print("Successfully reached GIG REPORT phase")
            page.screenshot(path="verification_report.png")

            # Click NEXT (CONTINUE TO SOCIALS >)
            # Use get_by_role("button") and filter by text containing "CONTINUE"
            next_btn = page.get_by_role("button", name="CONTINUE TO SOCIALS")
            if not next_btn.is_visible():
                 next_btn = page.get_by_text("CONTINUE TO SOCIALS")

            if next_btn.is_visible():
                next_btn.click()
                time.sleep(2)

                # Verify Social Phase
                page.wait_for_selector("text=SOCIAL MEDIA STRATEGY", timeout=5000)
                print("Successfully reached SOCIAL MEDIA STRATEGY phase")

                # Verify Trend Display
                content = page.content()
                if "CURRENT TREND: DRAMA" in content:
                    print("Successfully verified Trend Display: DRAMA")
                else:
                    print("Trend Display not found or incorrect")

                page.screenshot(path="verification_social.png")

                # Select a post to trigger Deals Phase
                # Click the first social option
                # They are ActionButtons inside SocialPhase
                # We can click one.
                print("Selecting a social option...")
                social_opts = page.locator("button").filter(has_text="Platform")
                if social_opts.count() > 0:
                     social_opts.first.click()
                     time.sleep(2)

                     # Check if we reached Deals Phase
                     if "BRAND OFFERS" in page.content():
                         print("Successfully reached DEALS phase")
                         page.screenshot(path="verification_deals.png")

                         # Accept a deal? Or skip.
                         # Let's skip.
                         skip_btn = page.get_by_role("button", name="SKIP OFFERS")
                         if skip_btn.is_visible():
                             skip_btn.click()
                             time.sleep(2)
                     else:
                         print("Did not reach DEALS phase (maybe no deals generated or went straight to complete)")

                     # Verify Complete Phase
                     if "TOUR UPDATE" in page.content() or "CONTINUE TO NEXT CITY" in page.content():
                         print("Successfully reached COMPLETE phase")
                         page.screenshot(path="verification_complete.png")
                else:
                     print("No social options found to click")

            else:
                print("CONTINUE button not found")

        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification_failed.png")

        browser.close()

if __name__ == "__main__":
    verify_post_gig()
