
import asyncio
from playwright.async_api import async_playwright
import os

async def verify_leaderboard_v2():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()

        try:
            print("Navigating to app...")
            await page.goto("http://localhost:5173")

            print("Clearing localStorage to force Identity Modal...")
            await page.evaluate("window.localStorage.clear()")
            await page.reload()

            # --- Intro Video Handling ---
            print("Checking for Intro Video...")
            try:
                await page.wait_for_selector("video", timeout=3000)
                print("Video element detected. Handling Intro Scene...")

                play_button = page.locator("button:has-text('Start Tour')")
                if await play_button.is_visible(timeout=2000):
                    print("Autoplay blocked (Intro). Clicking 'Start Tour' to play video...")
                    await play_button.click()
                    await page.wait_for_timeout(500)

                skip_button = page.locator("button:has-text('Skip Intro')")
                if await skip_button.is_visible(timeout=5000):
                    print("Clicking Skip Intro...")
                    await skip_button.click()
                else:
                    await page.wait_for_selector("video", state="detached", timeout=30000)

            except Exception as e:
                print(f"Intro handling note: {e}")

            # --- Main Menu Handling ---
            print("Waiting for Main Menu...")
            await page.wait_for_selector("video", state="detached", timeout=5000)

            print("Looking for Main Menu 'Start Tour' button...")
            start_game_btn = page.locator("button:has-text('Start Tour')")
            await start_game_btn.wait_for(state="visible", timeout=10000)

            print("Clicking Start Tour to trigger Identity Modal...")
            await start_game_btn.click()

            # --- Tutorial Handling ---
            # The Tutorial "WELCOME TO THE GRIND" might appear and block clicks.
            print("Checking for Tutorial...")
            try:
                tutorial_locator = page.locator("text=WELCOME TO THE GRIND")
                if await tutorial_locator.is_visible(timeout=2000):
                    print("Tutorial detected. Clicking 'SKIP ALL'...")
                    await page.click("text=SKIP ALL")
                    await page.wait_for_timeout(500) # Wait for animation
                else:
                    print("No tutorial detected immediately.")
            except Exception as e:
                print(f"Tutorial check warning: {e}")

            # --- Identity Modal ---
            print("Waiting for Identity Modal...")
            await page.wait_for_selector("text=IDENTITY REQUIRED", timeout=5000)
            print("Identity Modal found!")

            print("Entering Player Name...")
            await page.fill("input[placeholder='ENTER NAME...']", "TestGrinder")

            # Check for tutorial again just in case it popped up late
            if await page.locator("text=WELCOME TO THE GRIND").is_visible():
                 print("Tutorial popped up late. Clicking 'SKIP ALL'...")
                 await page.click("text=SKIP ALL")
                 await page.wait_for_timeout(500)

            print("Confirming Identity...")
            await page.click("button:has-text('CONFIRM IDENTITY')")

            # Wait for transition (Overworld)
            await page.wait_for_timeout(2000)

            print("Verifying Identity Storage...")
            player_id = await page.evaluate("localStorage.getItem('neurotoxic_player_id')")
            player_name = await page.evaluate("localStorage.getItem('neurotoxic_player_name')")

            print(f"Player ID: {player_id}")
            print(f"Player Name: {player_name}")

            if not player_id:
                raise Exception("Player ID not saved in localStorage!")
            if player_name != "TestGrinder":
                raise Exception(f"Player Name mismatch! Expected 'TestGrinder', got '{player_name}'")

            # --- Persistence Check ---
            print("Identity Verified. Reloading to check persistence and access Leaderboard...")
            await page.reload()

            # Handle Intro again on reload
            try:
                await page.wait_for_selector("video", timeout=3000)
                play_button = page.locator("button:has-text('Start Tour')")
                if await play_button.is_visible(timeout=2000):
                    await play_button.click()
                    await page.wait_for_timeout(500)
                skip_button = page.locator("button:has-text('Skip Intro')")
                if await skip_button.is_visible(timeout=5000):
                    await skip_button.click()
                else:
                    await page.wait_for_selector("video", state="detached", timeout=30000)
            except:
                pass

            print("Waiting for Main Menu (Reload)...")
            await page.wait_for_selector("button:has-text('Start Tour')", timeout=10000)

            if await page.locator("text=WELCOME TO THE GRIND").is_visible(timeout=2000):
                 print("Tutorial detected on reload. Clicking 'SKIP ALL'...")
                 await page.click("text=SKIP ALL")

            print("Opening Band HQ...")
            await page.click("button:has-text('Band HQ')")

            # --- Leaderboard Navigation ---
            print("Waiting for Band HQ...")
            # Band HQ starts with Stats Tab, looking for "CAREER STATUS"
            await page.wait_for_selector("text=CAREER STATUS", timeout=10000)

            print("Navigating to Leaderboard Tab...")
            # Tab text is "LEADERBOARD"
            await page.click("text=LEADERBOARD")

            print("Verifying Leaderboard UI...")
            # LeaderboardTab initially shows GLOBAL WEALTH button and TOP 100 WEALTHIEST panel
            try:
                await page.wait_for_selector("text=TOP 100 WEALTHIEST", timeout=5000)
                print("TOP 100 WEALTHIEST header found.")
            except:
                print("Header not found. Dumping content...")
                # print(await page.content())
                raise Exception("Leaderboard UI not verified.")

            print("Checking View Switcher...")
            await page.wait_for_selector("button:has-text('GLOBAL WEALTH')", timeout=5000)
            await page.wait_for_selector("button:has-text('SONG SCORES')", timeout=5000)

            await page.screenshot(path="verification/success_leaderboard.png")
            print("Success! Screenshot saved to verification/success_leaderboard.png")

        except Exception as e:
            print(f"Error: {e}")
            await page.screenshot(path="verification/error_state_v2.png")
            raise e
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_leaderboard_v2())
