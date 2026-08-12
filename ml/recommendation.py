def generate_recommendations(risk_level, condition):
    """
    Generate customized clinical recommendations, exercises, summaries, 
    and diet recommendations based on risk assessment results.
    """
    if condition == "invalid":
        return {
            "summary": "Invalid audio recording detected. The recording contains non-respiratory sounds (such as speech, singing, songs, music, or environmental noise).",
            "recommendedExercise": "none",
            "recommendations": [
                "Ensure recording is taken in a quiet room with minimal ambient noise.",
                "Hold the microphone near the mouth or chest and take slow, deep breaths without speaking or playing audio in the background."
            ],
            "foodsToEat": ["warm ginger tea", "honey", "anti-inflammatory foods"],
            "foodsToAvoid": ["cold beverages", "dairy products"]
        }

    if risk_level == "Low":
        return {
            "summary": "Breathing pattern is healthy and clear. No signs of active wheezing, obstruction, or coughing detected.",
            "recommendedExercise": "none",
            "recommendations": [
                "Perform standard daily deep belly breathing to maintain respiratory wellness.",
                "Hydrate with warm water to keep mucosal linings lubricated."
            ],
            "foodsToEat": ["warm ginger tea", "honey", "anti-inflammatory foods"],
            "foodsToAvoid": ["cold beverages", "dairy products", "sulfites & processed foods"]
        }
        
    elif risk_level == "Moderate":
        return {
            "summary": f"Slight expiratory whistle or abnormal breath sound detected (indicative of {condition}). Moderate airway resistance present.",
            "recommendedExercise": "pursed",
            "recommendations": [
                "Perform a 3-minute Pursed Lip breathing session to ease possible air trapping.",
                "Rest in an upright seated position and avoid physical exertion for 15 minutes.",
                "Monitor your breathing cycle and record another sample if symptoms persist."
            ],
            "foodsToEat": ["warm ginger tea", "honey", "anti-inflammatory foods", "turmeric milk"],
            "foodsToAvoid": ["cold beverages", "dairy products", "sulfites & processed foods", "highly processed snacks"]
        }
        
    elif risk_level == "High":
        if condition == "asthma":
            summary = "High-risk acoustic respiratory markers detected. Significant wheezing, airway narrowing, and asthma exacerbation indicators identified."
            recs = [
                "Use your prescribed rescue inhaler (Albuterol) immediately.",
                "Sit upright and practice slow diaphragmatic breathing.",
                "Alert your emergency contact or seek immediate medical care if distress continues."
            ]
        elif condition == "copd":
            summary = "High-risk expiratory wheeze and bronchial obstruction detected. Features suggest active COPD airway restriction."
            recs = [
                "Administer prescribed bronchodilator or maintenance inhaler.",
                "Practice pursed-lip breathing to reduce work of breathing.",
                "Sit in a forward-leaning posture (tripod position) to optimize diaphragm usage."
            ]
        elif condition == "pneumonia":
            summary = "High-risk breath sound pattern detected. Crackles, rattle, or diminished lung sounds suggestive of fluid accumulation/pneumonia."
            recs = [
                "Seek clinical evaluation from a physician or pulmonologist promptly.",
                "Ensure maximum rest and maintain adequate hydration.",
                "Monitor body temperature and blood oxygen saturation (SpO2)."
            ]
        else:
            summary = "High-risk acoustic respiratory markers detected. Significant airway restriction identified in audio recording."
            recs = [
                "Use prescribed rescue medication immediately.",
                "Rest in an upright seated position.",
                "Seek immediate medical attention if breathing difficulty increases."
            ]
            
        return {
            "summary": summary,
            "recommendedExercise": "diaphragmatic",
            "recommendations": recs,
            "foodsToEat": ["warm ginger tea", "honey", "anti-inflammatory foods", "magnesium-rich foods", "omega-3 rich foods"],
            "foodsToAvoid": ["cold beverages", "dairy products", "sulfites & processed foods", "heavy/salty meals", "artificial preservatives"]
        }
    else:
        # Fallback
        return {
            "summary": "Breathing sounds are generally clear and healthy. No persistent wheezing or cough detected.",
            "recommendedExercise": "none",
            "recommendations": [
                "Practice calm deep nasal breathing (inhale 4 seconds, exhale 6 seconds).",
                "Maintain dynamic hydration and check local air quality index."
            ],
            "foodsToEat": ["warm ginger tea", "honey", "anti-inflammatory foods"],
            "foodsToAvoid": ["cold beverages", "dairy products", "sulfites & processed foods"]
        }
