from ml import config

def assess_risk(predicted_class_name, confidence):
    """
    Map predicted respiratory condition class to risk score properties.
    Classes: asthma, copd, healthy, pneumonia, other_abnormal.
    
    Returns:
        dict: containing riskLevel, wheezingDetected, rr (respiratory rate),
              pattern, regularity, and confidence string.
    """
    # Determine confidence string
    conf_str = "High" if confidence > 0.75 else "Medium"
    
    if predicted_class_name == "healthy":
        return {
            "riskLevel": "Low",
            "wheezingDetected": "No",
            "rr": "14 bpm",
            "pattern": "Clear · Regular",
            "regularity": "96%",
            "confidence": conf_str,
            "condition": "healthy"
        }
    elif predicted_class_name == "other_abnormal":
        return {
            "riskLevel": "Moderate",
            "wheezingDetected": "Yes",
            "rr": "18 bpm",
            "pattern": "Mild whistle detected · Moderate restriction",
            "regularity": "84%",
            "confidence": conf_str,
            "condition": "other_abnormal"
        }
    elif predicted_class_name == "asthma":
        return {
            "riskLevel": "High",
            "wheezingDetected": "Yes",
            "rr": "22 bpm",
            "pattern": "Acoustic wheeze detected · High restriction",
            "regularity": "72%",
            "confidence": conf_str,
            "condition": "asthma"
        }
    elif predicted_class_name == "copd":
        return {
            "riskLevel": "High",
            "wheezingDetected": "Yes",
            "rr": "20 bpm",
            "pattern": "Expiratory wheeze and obstruction detected",
            "regularity": "68%",
            "confidence": conf_str,
            "condition": "copd"
        }
    elif predicted_class_name == "pneumonia":
        return {
            "riskLevel": "High",
            "wheezingDetected": "No",  # Pneumonia typically has crackles/diminished breath sounds rather than wheeze
            "rr": "24 bpm",
            "pattern": "Crackles & diminished lung aeration detected",
            "regularity": "75%",
            "confidence": conf_str,
            "condition": "pneumonia"
        }
    elif predicted_class_name == "invalid":
        return {
            "riskLevel": "Low",
            "wheezingDetected": "No",
            "rr": "N/A",
            "pattern": "Non-respiratory sound detected",
            "regularity": "N/A",
            "confidence": conf_str,
            "condition": "invalid"
        }
    else:
        # Fallback
        return {
            "riskLevel": "Low",
            "wheezingDetected": "No",
            "rr": "15 bpm",
            "pattern": "Clear · Regular",
            "regularity": "94%",
            "confidence": "Medium",
            "condition": "unknown"
        }
