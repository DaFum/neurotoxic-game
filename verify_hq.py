import time
import json
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError

def setup_and_verify(page):
    print("Navigating to dev server...")
    page.goto('http://localhost:5173/')

    print("Checking for SKIP INTRO...")
    try:
        page.get_by_text("SKIP INTRO").click(timeout=3000)
        print("Clicked SKIP INTRO.")
    except PlaywrightTimeoutError:
        print("No SKIP INTRO button found.")

    print("Checking for SKIP ALL (tutorial)...")
    try:
        page.get_by_text("SKIP ALL").click(timeout=3000)
        print("Clicked SKIP ALL.")
    except PlaywrightTimeoutError:
        print("No SKIP ALL button found.")

    print("Waiting for BAND HQ button...")
    try:
        page.get_by_role("button", name="BAND HQ").click(timeout=5000)
        print("Clicked BAND HQ.")
    except PlaywrightTimeoutError:
        print("Could not find BAND HQ button. Taking debug screenshot...")
        page.screenshot(path='/home/jules/verification/hq_debug.png')
        raise

    time.sleep(1)

    print("Looking for UPGRADES tab...")
    try:
        page.locator('button:has-text("UPGRADES")').click(timeout=5000)
        print("Clicked UPGRADES tab.")
    except PlaywrightTimeoutError:
        print("Could not find UPGRADES tab. Taking debug screenshot...")
        page.screenshot(path='/home/jules/verification/hq_debug_tabs.png')
        raise

    time.sleep(1)

    print("Looking for HQ tab...")
    try:
        page.get_by_role("button", name="HQ").click(timeout=3000)
        print("Clicked HQ tab.")
    except PlaywrightTimeoutError:
        print("No inner HQ tab found or already on it.")

    time.sleep(1)

    print("Taking final screenshot...")
    page.screenshot(path='/home/jules/verification/pr_manager_contract.png')
    print("Verification complete.")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    context = browser.new_context()
    page = context.new_page()

    page.goto('http://localhost:5173/')

    injected_state = {
      "version": "1.0",
      "player": {
        "money": 10000,
        "fame": 1000,
        "hqLevel": 1,
        "inventory": [],
        "activeEffects": []
      },
      "stats": {
        "currentScene": "OVERWORLD"
      }
    }

    state_str = json.dumps(injected_state)
    page.evaluate(f"localStorage.setItem('neurotoxic_v3_save', JSON.stringify({state_str}))")

    page.reload()

    try:
        setup_and_verify(page)
    except Exception as e:
        print(f"Error: {e}")
    finally:
        browser.close()
