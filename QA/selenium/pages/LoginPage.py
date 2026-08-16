from selenium.webdriver.common.by import By
from QA.selenium.pages.BasePage import BasePage

class LoginPage(BasePage):
    """LoginPage object mapping selectors and actions for login screen."""
    EMAIL_INPUT = (By.ID, "email-input")
    PASSWORD_INPUT = (By.ID, "password-input")
    SUBMIT_BUTTON = (By.ID, "login-submit-btn")
    ERROR_ALERT = (By.ID, "login-error-alert")
    REGISTER_LINK = (By.ID, "go-to-register-link")

    def login(self, email, password):
        self.send_keys(*self.EMAIL_INPUT, email)
        self.send_keys(*self.PASSWORD_INPUT, password)
        self.click(*self.SUBMIT_BUTTON)

    def get_error_message(self):
        if self.is_visible(*self.ERROR_ALERT):
            return self.get_text(*self.ERROR_ALERT)
        return None

    def click_register(self):
        self.click(*self.REGISTER_LINK)
