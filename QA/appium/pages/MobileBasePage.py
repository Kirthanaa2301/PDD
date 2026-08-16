import time
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class MobileBasePage:
    """Base Page Object for Appium React Native mobile testing."""
    def __init__(self, driver, timeout=10):
        self.driver = driver
        self.timeout = timeout
        self.wait = WebDriverWait(driver, timeout)

    def find_element(self, by, locator):
        return self.wait.until(EC.presence_of_element_located((by, locator)))

    def click(self, by, locator):
        element = self.wait.until(EC.element_to_be_clickable((by, locator)))
        element.click()

    def send_keys(self, by, locator, text):
        element = self.find_element(by, locator)
        element.clear()
        element.send_keys(text)

    def is_visible(self, by, locator):
        try:
            self.wait.until(EC.visibility_of_element_located((by, locator)))
            return True
        except Exception:
            return False

    def swipe(self, start_x, start_y, end_x, end_y, duration=800):
        self.driver.swipe(start_x, start_y, end_x, end_y, duration)

    def hide_keyboard(self):
        try:
            self.driver.hide_keyboard()
        except Exception:
            pass
