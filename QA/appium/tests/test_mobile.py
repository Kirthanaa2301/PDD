import unittest
import os
import json
from appium import webdriver
from selenium.webdriver.common.by import By

class TestAsthmaSenseMobile(unittest.TestCase):
    
    @classmethod
    def setUpClass(cls):
        # Load caps config
        caps_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "config", "caps.json")
        with open(caps_path, "r") as f:
            cls.caps = json.load(f)

        try:
            # Attempt to connect to local Appium Server
            # Since live device or emulator is normally unavailable in headless CI, this will catch connection failure
            cls.driver = webdriver.Remote("http://localhost:4723/wd/hub", cls.caps)
            cls.enabled = True
        except Exception as e:
            print(f"Skipping live Appium Mobile tests: Appium connection failed. Detail: {e}")
            cls.enabled = False

    @classmethod
    def tearDownClass(cls):
        if cls.enabled:
            cls.driver.quit()

    def setUp(self):
        if not self.enabled:
            self.skipTest("Appium server or mobile emulator not active.")

    def test_verify_splash_screen_and_onboarding(self):
        """TC-APP-001: Verify mobile user can launch AsthmaSense AI and view splash onboarding."""
        # Locate React Native test ID accessibility labels
        onboarding_title = self.driver.find_element(By.ACCESSIBILITY_ID, "onboarding-welcome-title")
        self.assertIsNotNone(onboarding_title)
        
        # Click next button
        next_btn = self.driver.find_element(By.ACCESSIBILITY_ID, "onboarding-next-btn")
        next_btn.click()

if __name__ == "__main__":
    unittest.main()
