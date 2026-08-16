from selenium.webdriver.common.by import By
from QA.selenium.pages.BasePage import BasePage

class DashboardPage(BasePage):
    """DashboardPage object mapping elements on the home dashboard."""
    USER_NAME_TEXT = (By.ID, "dashboard-username")
    STREAK_VAL_TEXT = (By.ID, "dashboard-streak-count")
    SYMPTOM_LOG_BTN = (By.ID, "dashboard-log-symptoms-btn")
    BREATHING_EXERCISE_BTN = (By.ID, "dashboard-breathing-exercise-btn")
    AUDIO_UPLOAD_BTN = (By.ID, "dashboard-audio-upload-btn")
    LOGOUT_BTN = (By.ID, "dashboard-logout-btn")
    RISK_CARD = (By.ID, "dashboard-risk-level-card")

    def get_username(self):
        return self.get_text(*self.USER_NAME_TEXT)

    def get_streak(self):
        return self.get_text(*self.STREAK_VAL_TEXT)

    def click_log_symptoms(self):
        self.click(*self.SYMPTOM_LOG_BTN)

    def click_breathing_exercise(self):
        self.click(*self.BREATHING_EXERCISE_BTN)

    def click_audio_upload(self):
        self.click(*self.AUDIO_UPLOAD_BTN)

    def logout(self):
        self.click(*self.LOGOUT_BTN)
