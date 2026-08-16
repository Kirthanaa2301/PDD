import unittest
import os
import json
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

# Import pages
try:
    from QA.selenium.pages.LoginPage import LoginPage
    from QA.selenium.pages.DashboardPage import DashboardPage
except ImportError:
    import sys
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
    from QA.selenium.pages.LoginPage import LoginPage
    from QA.selenium.pages.DashboardPage import DashboardPage

class TestAsthmaSenseUI(unittest.TestCase):
    
    @classmethod
    def setUpClass(cls):
        # Load config
        config_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "config", "config.json")
        with open(config_path, "r") as f:
            cls.config = json.load(f)

        # Setup browser options
        chrome_options = Options()
        if cls.config.get("headless", True):
            chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        
        try:
            cls.driver = webdriver.Chrome(options=chrome_options)
            cls.driver.implicitly_wait(cls.config.get("timeout", 10))
            cls.driver.get(cls.config.get("target_url", "http://localhost:3000"))
            cls.enabled = True
        except Exception as e:
            print(f"Skipping live Selenium UI tests: Browser or Driver not available. Detail: {e}")
            cls.enabled = False

    @classmethod
    def tearDownClass(cls):
        if cls.enabled:
            cls.driver.quit()

    def setUp(self):
        if not self.enabled:
            self.skipTest("Webdriver or target environment unavailable.")

    def test_verify_launch_and_login_page_elements(self):
        """TC-SEL-001: Verify successful page launch and element visibility."""
        login_page = LoginPage(self.driver)
        self.assertTrue(login_page.is_visible(*LoginPage.EMAIL_INPUT))
        self.assertTrue(login_page.is_visible(*LoginPage.PASSWORD_INPUT))
        self.assertTrue(login_page.is_visible(*LoginPage.SUBMIT_BUTTON))

    def test_invalid_login_shows_error(self):
        """TC-SEL-002: Verify invalid credentials display error alert message."""
        login_page = LoginPage(self.driver)
        login_page.login("invalid_user@asthmasense.ai", "wrongpassword")
        error_msg = login_page.get_error_message()
        self.assertIsNotNone(error_msg)

if __name__ == "__main__":
    unittest.main()
