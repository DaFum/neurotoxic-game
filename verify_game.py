import sys
import time
from playwright.sync_api import sync_playwright

def run():
    print("Starting verification script...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Capture console logs
        page.on("console", lambda msg: print(f"BROWSER LOG: {msg.text}"))
        page.on("pageerror", lambda exc: print(f"BROWSER ERROR: {exc}"))

        print("Navigating to game...")
        try:
            page.goto("http://localhost:5173/")
        except Exception as e:
            print(f"Failed to navigate: {e}")
            return

        # Wait for game to load
        try:
            print("Waiting for Start Tour...")
            page.wait_for_selector("text=Start Tour", timeout=10000)
            print("Menu loaded.")
        except:
            print("Timeout waiting for menu.")
            page.screenshot(path="menu_timeout.png")
            browser.close()
            return

        # Start Game
        print("Clicking Start Tour...")
        page.click("text=Start Tour")

        # Skip Tutorial - Handle "SKIP ALL" if tutorial manager is present
        try:
            print("Checking for Tutorial...")
            # Look for SKIP ALL button which is common in TutorialManager
            if page.locator("text=SKIP ALL").is_visible(timeout=5000):
                print("Found SKIP ALL button. Clicking...")
                page.click("text=SKIP ALL")
                print("Tutorial skipped.")
            elif page.locator("text=Skip Tutorial").is_visible(timeout=2000):
                page.click("text=Skip Tutorial")
                print("Tutorial skipped via 'Skip Tutorial'.")
        except:
            print("No tutorial found or skip failed.")

        # Wait for Overworld
        try:
            print("Waiting for Overworld...")
            page.wait_for_selector("text=Next Stop", timeout=10000)
            print("Overworld loaded.")
        except:
            print("Timeout waiting for Overworld.")
            page.screenshot(path="overworld_timeout.png")
            browser.close()
            return

        # Click a Gig node
        print("Looking for a gig node...")
        time.sleep(3) # Wait for map animation

        try:
            # Select the first available node that is likely a Gig
            # Nodes are divs with onclick.
            # We can use a more specific selector if we knew the class structure better,
            # but usually clicking the first interactive element in the map container works.
            # Assuming nodes have 'absolute' and 'cursor-pointer'

            clicked = page.evaluate("""() => {
                const nodes = Array.from(document.querySelectorAll('div.absolute.cursor-pointer'));
                console.log('Found ' + nodes.length + ' map nodes.');

                // Prioritize GIG nodes (contain "Pay:" or "Cap:" in their inner text/tooltip)
                for (const node of nodes) {
                    if (node.textContent.includes("Pay:") || node.textContent.includes("Cap:")) {
                        console.log("Found a GIG node.");
                        node.click();
                        return true;
                    }
                }

                // Fallback: Click the first one
                if (nodes.length > 0) {
                     console.log("No explicit GIG node found, clicking first available.");
                     nodes[0].click();
                     return true;
                }
                return false;
            }""")

            if clicked:
                print("Clicked a map node.")
            else:
                print("No map nodes found.")
                page.screenshot(path="no_nodes.png")
                browser.close()
                return
        except Exception as e:
            print(f"Error clicking node: {e}")

        # Loop to handle events until we reach PreGig or timeout
        print("Waiting for PreGig or Events...")
        for i in range(5):
            try:
                # Check for PreGig
                if page.locator("text=PREPARATION").is_visible(timeout=2000):
                    print("Entered Pre-Gig screen.")
                    break

                # Check for Event Modal
                if page.locator("text=⚠").is_visible(timeout=2000):
                    print("Event Modal detected. Resolving...")
                    page.screenshot(path=f"event_modal_{i}.png")
                    page.click(".fixed button")
                    print("Clicked event option.")
                    time.sleep(2)
                    continue

                # Check for Rest Stop (if we end up there instead of Gig)
                if page.locator("text=Rest").is_visible(timeout=1000):
                    print("Hit a Rest Stop. Cannot verify Gig.")
                    browser.close()
                    return

            except Exception as e:
                print(f"Loop iteration {i} error: {e}")
        else:
            print("Timed out waiting for PreGig.")
            page.screenshot(path="pregig_fail.png")
            browser.close()
            return

        # Select a song (toggle one)
        print("Selecting a song...")
        try:
            # Wait for song list
            page.wait_for_selector("text=Diff:", timeout=2000)
            # Click the first song
            page.click("text=Diff:")
            print("Song toggled.")
        except:
            print("Could not select a song.")

        # Click Start Show
        print("Clicking START SHOW...")
        page.click("text=START SHOW")

        # Wait for Gig to start
        print("Waiting for Gig canvas...")
        try:
            # Wait for canvas
            page.wait_for_selector("canvas", timeout=15000)
            print("Gig Canvas detected! Success.")
            time.sleep(2)
            page.screenshot(path="gig_success.png")
        except:
            print("Timeout waiting for Gig Canvas.")
            page.screenshot(path="gig_start_fail.png")

            # Check if we are back in Overworld
            if page.locator("text=Next Stop").is_visible():
                print("Detected bounce back to Overworld.")
            elif page.locator("text=PREPARATION").is_visible():
                print("Stuck on PreGig screen.")

        browser.close()

if __name__ == "__main__":
    run()
