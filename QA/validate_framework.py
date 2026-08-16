import os
import openpyxl
import yaml

def validate_excel_report(file_path, expected_prefix, expected_count=300):
    print(f"Validating: {os.path.basename(file_path)}...")
    if not os.path.exists(file_path):
        print(f"  [ERROR] File does not exist: {file_path}")
        return False
        
    try:
        wb = openpyxl.load_workbook(file_path)
    except Exception as e:
        print(f"  [ERROR] Failed to load workbook: {e}")
        return False
        
    # Check sheet existence
    if "Executive Summary" not in wb.sheetnames:
        print("  [ERROR] Missing sheet 'Executive Summary'")
        return False
    if "Test Cases Detail" not in wb.sheetnames:
        print("  [ERROR] Missing sheet 'Test Cases Detail'")
        return False
        
    ws_det = wb["Test Cases Detail"]
    
    # Check headers
    headers = [cell.value for cell in ws_det[1]]
    required_cols = ["Test ID", "Test Case Name", "Module", "Category", "Endpoint/Screen", "Method/Action", "Priority", "Status", "Duration (ms)", "Actual Result"]
    for col in required_cols:
        if col not in headers:
            print(f"  [ERROR] Required column '{col}' is missing from header row")
            return False
            
    # Check rows and values
    ids = []
    descriptions = []
    
    row_count = 0
    for row in range(2, ws_det.max_row + 1):
        tc_id = ws_det.cell(row=row, column=1).value
        name = ws_det.cell(row=row, column=2).value
        
        if tc_id is None:
            # Reached empty rows
            continue
            
        row_count += 1
        ids.append(tc_id)
        descriptions.append(name)
        
        # Verify Test ID format and prefix
        expected_id = f"{expected_prefix}-{str(row_count).zfill(3)}"
        if tc_id != expected_id:
            print(f"  [ERROR] Row {row} ID is '{tc_id}', expected sequential '{expected_id}'")
            return False

    if row_count != expected_count:
        print(f"  [ERROR] Detailed sheet contains {row_count} test cases, expected exactly {expected_count}")
        return False
        
    # Check duplicate IDs
    if len(ids) != len(set(ids)):
        print("  [ERROR] Duplicate Test IDs found in sheet")
        return False
        
    # Check duplicate descriptions
    if len(descriptions) != len(set(descriptions)):
        print("  [ERROR] Duplicate Test Case Names (descriptions) found in sheet")
        # Find which ones are duplicated
        seen = set()
        dupes = []
        for name in descriptions:
            if name in seen:
                dupes.append(name)
            seen.add(name)
        print(f"  First few duplicate descriptions: {dupes[:3]}")
        return False
        
    print(f"  [SUCCESS] Workbook verified: exactly {row_count} sequential, unique test cases.")
    return True

def validate_executive_report(file_path):
    print(f"Validating Executive Report: {os.path.basename(file_path)}...")
    if not os.path.exists(file_path):
        print(f"  [ERROR] File does not exist: {file_path}")
        return False
    try:
        wb = openpyxl.load_workbook(file_path)
    except Exception as e:
        print(f"  [ERROR] Failed to load workbook: {e}")
        return False
        
    ws = wb["Executive Summary"]
    
    # Check cells for 1200 count
    found_total = False
    for r in range(4, 20):
        val_a = ws.cell(row=r, column=1).value
        val_b = ws.cell(row=r, column=2).value
        if val_a == "TOTAL" and val_b == 1200:
            found_total = True
            break
            
    if not found_total:
        print("  [ERROR] Executive Report summary table total row check failed. Expected TOTAL = 1200.")
        return False
        
    print("  [SUCCESS] Executive report validated.")
    return True

def validate_github_workflow():
    print("Validating GitHub Actions workflow...")
    workflow_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".github", "workflows", "qa.yml")
    if not os.path.exists(workflow_path):
        print("  [WARNING] GitHub Actions workflow does not exist yet.")
        return False
        
    try:
        with open(workflow_path, "r") as f:
            yaml.safe_load(f)
        print("  [SUCCESS] GitHub Actions workflow has valid YAML syntax.")
        return True
    except Exception as e:
        print(f"  [ERROR] Invalid YAML in GitHub Actions workflow: {e}")
        return False

def run_all_validations():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    reports_dir = os.path.join(os.path.dirname(base_dir), "reports")
    
    sel_path = os.path.join(reports_dir, "Selenium_300_Test_Report.xlsx")
    app_path = os.path.join(reports_dir, "Appium_300_Test_Report.xlsx")
    sec_path = os.path.join(reports_dir, "Security_300_Test_Report.xlsx")
    load_path = os.path.join(reports_dir, "Load_300_Test_Report.xlsx")
    exec_path = os.path.join(reports_dir, "QA_Executive_Report.xlsx")
    exec_1200_path = os.path.join(reports_dir, "QA_1200_Test_Executive_Report.xlsx")
    
    success = True
    success &= validate_excel_report(sel_path, "TC-SEL", 300)
    success &= validate_excel_report(app_path, "TC-APP", 300)
    success &= validate_excel_report(sec_path, "TC-SEC", 300)
    success &= validate_excel_report(load_path, "TC-LOAD", 300)
    success &= validate_executive_report(exec_path)
    success &= validate_executive_report(exec_1200_path)
    success &= validate_github_workflow()
    
    if success:
        print("\n[CONGRATULATIONS] All 1,200 QA validation checks passed successfully!")
        return 0
    else:
        print("\n[FAILURE] QA validation checks failed. See errors above.")
        return 1

if __name__ == "__main__":
    import sys
    sys.exit(run_all_validations())
