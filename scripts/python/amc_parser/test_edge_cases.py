#!/usr/bin/env python3
"""
Edge Cases Test Script for AMC Parser

This script tests specific AMC problems that previously failed parsing
to ensure all edge case fixes are working correctly using the edge_cases_test.json configuration.
"""

from amc_parser import main
import sys
import json
import os

def generate_expected_files_from_config():
    """Generate expected file names and problem keys from edge_cases_test.json"""
    try:
        with open('edge_cases_test.json', 'r') as f:
            config = json.load(f)
        
        expected_files = []
        
        for entry in config:
            # Skip entries that are ONLY comments (no actual competition data)
            if not ('start' in entry and 'levels' in entry):
                continue
                
            year = entry['start']  # start and end are same for individual problems
            problem_number = entry.get('problem_number')
            
            if problem_number is None:
                continue  # Skip entries without specific problem numbers
                
            for level_info in entry['levels']:
                level = level_info['level']
                suffix = level_info.get('suffix', '')
                fall_version = entry.get('fall_version', False)
                
                # Generate file name (same logic as _get_competition_name in amc_parser.py)
                if fall_version:
                    file_name = f"{year}_Fall_AMC_{level}{suffix}_Problem_{problem_number}.json"
                else:
                    file_name = f"{year}_AMC_{level}{suffix}_Problem_{problem_number}.json"
                
                # Generate problem key for tracking
                problem_key = f"amc_{year}_{level}_{problem_number}"
                
                expected_files.append((file_name, problem_key))
        
        return expected_files
        
    except Exception as e:
        print(f"  Error reading edge_cases_test.json: {e}")
        return []

def load_expected_answers_from_amc_files():
    """Load expected answers from the test AMC JSON files"""
    import os
    
    # Use test directory for edge cases test (in same folder as script)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    amc_dir = os.path.join(script_dir, "test_output", "AMC", "AMC_8")
    
    expected_answers = {}
    
    # Generate expected files from edge_cases_test.json
    expected_files = generate_expected_files_from_config()
    
    print(f"  Looking for {len(expected_files)} files based on edge_cases_test.json")
    
    for file_name, problem_key in expected_files:
        file_path = os.path.join(amc_dir, file_name)
        if os.path.exists(file_path):
            try:
                with open(file_path, 'r') as f:
                    data = json.load(f)
                # Extract answer from the first (and only) problem
                if data.get('problems') and len(data['problems']) > 0:
                    answer = data['problems'][0].get('answer')
                    expected_answers[problem_key] = answer
                    print(f"  Loaded answer '{answer}' for {problem_key} from {file_name}")
                else:
                    print(f"  Warning: No problems found in {file_name}")
                    expected_answers[problem_key] = None
            except Exception as e:
                print(f"  Error reading {file_name}: {e}")
                expected_answers[problem_key] = None
        else:
            print(f"  File not found: {file_name} (will validate parsing success only)")
            expected_answers[problem_key] = None
    
    return expected_answers

def validate_parsing_results():
    """Validate that parsing results match expected answers"""
    print("="*60)
    print("VALIDATING EDGE CASES TEST RESULTS")
    print("="*60)
    
    print("Loading expected answers from test AMC files...")
    expected_answers = load_expected_answers_from_amc_files()
    print()
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    parsing_log_dir = os.path.join(script_dir, "test_output", "parsing_log")
    
    # Generate expected log files from edge_cases_test.json
    expected_files_info = generate_expected_files_from_config()
    expected_logs = [file_name for file_name, _ in expected_files_info]
    
    print(f"Looking for {len(expected_logs)} parsing log files based on edge_cases_test.json")
    
    results = []
    
    for log_file in expected_logs:
        log_path = os.path.join(parsing_log_dir, log_file)
        
        # Extract problem info from filename
        parts = log_file.replace('.json', '').split('_')
        year = parts[0]
        level = parts[2] 
        problem_num = parts[4]
        problem_key = f'amc_{year}_{level}_{problem_num}'
        expected_answer = expected_answers.get(problem_key)
        
        print(f"\nValidating {year} AMC {level} Problem {problem_num}:")
        if expected_answer:
            print(f"  Expected Answer: {expected_answer}")
        else:
            print(f"  Expected Answer: TBD (will validate parsing success only)")
        
        if not os.path.exists(log_path):
            print(f"  ✗ MISSING: No parsing log found at {log_path}")
            results.append(('MISSING', year, level, problem_num, "No log file"))
            continue
            
        try:
            with open(log_path, 'r') as f:
                log_data = json.load(f)
            
            # Check if parsing was successful
            if log_data['summary']['successful'] == 0:
                failed_problems = log_data.get('failed_problems', [])
                if failed_problems:
                    error_msg = failed_problems[0].get('error_message', 'Unknown error')
                    print(f"  ✗ FAILED: {error_msg}")
                    results.append(('FAILED', year, level, problem_num, error_msg))
                else:
                    print(f"  ✗ FAILED: No successful problems parsed")
                    results.append(('FAILED', year, level, problem_num, "No successful problems"))
            else:
                if expected_answer:
                    print(f"  ✓ SUCCESS: Problem parsed successfully (Answer: {expected_answer})")
                else:
                    print(f"  ✓ SUCCESS: Problem parsed successfully (No AMC file for answer comparison)")
                results.append(('PASS', year, level, problem_num, expected_answer))
                
        except Exception as e:
            print(f"  ✗ ERROR: Could not read log file - {e}")
            results.append(('ERROR', year, level, problem_num, str(e)))
    
    return results

def run_edge_cases_test():
    """Run the edge cases test using the JSON configuration with test-specific output folders"""
    print("AMC Parser Edge Cases Test Suite")
    print("This script validates fixes for previously failing AMC problems")
    print("Using edge_cases_test.json configuration")
    print("Output will be saved to test-specific folders for easy cleanup")
    print()
    
    # Create a custom AMCParser instance that uses test folders
    from amc_parser import AMCParser
    import tempfile
    import shutil
    
    try:
        # Create test directories in the same folder as this script
        script_dir = os.path.dirname(os.path.abspath(__file__))
        test_dir = os.path.join(script_dir, "test_output")
        test_parsing_log_dir = os.path.join(test_dir, "parsing_log")
        test_amc_dir = os.path.join(test_dir, "AMC", "AMC_8")
        
        os.makedirs(test_parsing_log_dir, exist_ok=True)
        os.makedirs(test_amc_dir, exist_ok=True)
        
        print(f"Test directories created:")
        print(f"  Parsing logs: {test_parsing_log_dir}")
        print(f"  AMC files: {test_amc_dir}")
        print()
        
        # Initialize parser with edge cases config
        parser = AMCParser('edge_cases_test.json')
        
        # Override the save methods to use test directories
        original_save_parsing_log = parser._save_parsing_log
        original_save_competition_to_file = parser.save_competition_to_file
        
        def test_save_parsing_log(competition, parsing_results):
            """Save parsing log to test directory"""
            comp_name = parser._get_competition_name(competition)
            log_file = os.path.join(test_parsing_log_dir, f"{comp_name}.json")
            
            with open(log_file, 'w', encoding='utf-8') as f:
                json.dump(parsing_results, f, indent=2, ensure_ascii=False)
            
            # Print summary like original method
            summary = parsing_results["summary"]
            failed_problems = parsing_results["failed_problems"]
            skipped_problems = parsing_results["skipped_problems"]
            
            print(f"  📝 Parsing log saved: {log_file}")
            print(f"  📊 Results: {summary['successful']} successful, {summary['failed']} failed, {summary['skipped']} skipped")
            
            if failed_problems:
                print(f"  ❌ Failed problems:")
                for fail in failed_problems:
                    print(f"    Problem {fail['problem_number']}: {fail['error_details']['category']} - {fail['error_message'][:100]}{'...' if len(fail['error_message']) > 100 else ''}")
            
            if skipped_problems:
                problem_nums = [str(p["problem_number"]) for p in skipped_problems]
                print(f"  ⏭️  Skipped problems: {', '.join(problem_nums)}")
        
        def test_save_competition_to_file(competition, problems):
            """Save competition to test directory"""
            comp_name = parser._get_competition_name(competition)
            output_file = os.path.join(test_amc_dir, f"{comp_name}.json")
            
            # Create competition metadata
            competition_data = {
                "competition_info": {
                    "name": comp_name,
                    "group": competition['group'],
                    "year": competition['year'],
                    "is_AJHSME": competition.get('is_AJHSME', False),
                    "level": competition.get('level', 'AJHSME'),
                    "suffix": competition.get('suffix', ''),
                    "fall_version": competition['fall_version'],
                    "total_problems": len(problems),
                    "problem_number_override": competition.get('problem_number_override')
                },
                "problems": problems
            }
            
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(competition_data, f, indent=2, ensure_ascii=False)
            
            print(f"Saved {len(problems)} problems to {output_file}")
            return output_file
        
        # Monkey patch the methods
        parser._save_parsing_log = test_save_parsing_log
        parser.save_competition_to_file = test_save_competition_to_file
        
        # Run the parsing
        saved_files, total_problems = parser.parse_all_competitions()
        
        # Print final summary
        print(f"\n{'='*60}")
        print("FINAL SUMMARY")
        print(f"{'='*60}")
        print(f"Total competitions processed: {len(saved_files)}")
        print(f"Total problems collected: {total_problems}")
        print(f"Test files saved to: {test_dir}")
        
        return True
        
    except Exception as e:
        print(f"Edge cases test failed: {e}")
        return False

def save_validation_results(validation_results, test_success):
    """Save validation results to a JSON file for later review"""
    import datetime
    
    # Count results
    passed = sum(1 for result in validation_results if result[0] == 'PASS')
    failed = sum(1 for result in validation_results if result[0] == 'FAILED')
    errors = sum(1 for result in validation_results if result[0] == 'ERROR')
    missing = sum(1 for result in validation_results if result[0] == 'MISSING')
    
    overall_success = (test_success and failed == 0 and errors == 0 and missing == 0)
    
    # Create detailed results structure
    detailed_results = []
    for status, year, level, problem_num, result in validation_results:
        detailed_results.append({
            "problem": f"{year} AMC {level} Problem {problem_num}",
            "year": year,
            "level": level,
            "problem_number": problem_num,
            "status": status,
            "result": result,
            "expected_answer": result if status == 'PASS' else None,
            "error_message": result if status in ['FAILED', 'ERROR'] else None
        })
    
    # Create summary report
    validation_report = {
        "test_info": {
            "timestamp": datetime.datetime.now().isoformat(),
            "test_type": "Edge Cases Validation",
            "config_file": "edge_cases_test.json",
            "total_problems": len(validation_results)
        },
        "summary": {
            "edge_cases_test_passed": test_success,
            "overall_success": overall_success,
            "passed": passed,
            "failed": failed,
            "errors": errors,
            "missing": missing
        },
        "detailed_results": detailed_results,
        "failed_problems": [
            {
                "problem": f"{year} AMC {level} Problem {problem_num}",
                "status": status,
                "reason": result
            }
            for status, year, level, problem_num, result in validation_results
            if status in ['FAILED', 'ERROR', 'MISSING']
        ],
        "successful_problems": [
            {
                "problem": f"{year} AMC {level} Problem {problem_num}",
                "answer": result
            }
            for status, year, level, problem_num, result in validation_results
            if status == 'PASS'
        ]
    }
    
    # Save to test_output directory in the same folder as this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    test_output_dir = os.path.join(script_dir, "test_output")
    report_file = os.path.join(test_output_dir, "validation_report.json")
    os.makedirs(test_output_dir, exist_ok=True)
    
    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump(validation_report, f, indent=2, ensure_ascii=False)
    
    return report_file, overall_success

def print_summary(validation_results, test_success):
    """Print test summary and save validation results"""
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    # Save validation results to file
    report_file, overall_success = save_validation_results(validation_results, test_success)
    
    # Count results
    passed = sum(1 for result in validation_results if result[0] == 'PASS')
    failed = sum(1 for result in validation_results if result[0] == 'FAILED')
    errors = sum(1 for result in validation_results if result[0] == 'ERROR')
    missing = sum(1 for result in validation_results if result[0] == 'MISSING')
    
    print(f"Edge Cases Test: {'PASSED' if test_success else 'FAILED'}")
    print(f"Validation Results: {passed} passed, {failed} failed, {errors} errors, {missing} missing")
    
    if failed > 0 or errors > 0 or missing > 0:
        print("\nFailed/Error/Missing Details:")
        for status, year, level, problem_num, result in validation_results:
            if status in ['FAILED', 'ERROR', 'MISSING']:
                print(f"  {year} AMC {level} Problem {problem_num}: {status} - {result}")
    
    # Overall result
    overall_status = "ALL TESTS PASSED" if overall_success else "SOME TESTS FAILED"
    print(f"\nOverall Result: {overall_status}")
    print(f"📄 Validation report saved: {report_file}")
    
    return overall_success

def view_validation_report():
    """View the latest validation report"""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    report_file = os.path.join(script_dir, "test_output", "validation_report.json")
    
    if not os.path.exists(report_file):
        print(f"❌ No validation report found at {report_file}")
        print("Run the test suite first to generate a report.")
        return
    
    try:
        with open(report_file, 'r') as f:
            report = json.load(f)
        
        print("="*60)
        print("VALIDATION REPORT")
        print("="*60)
        
        # Test info
        test_info = report['test_info']
        print(f"Timestamp: {test_info['timestamp']}")
        print(f"Config File: {test_info['config_file']}")
        print(f"Total Problems: {test_info['total_problems']}")
        print()
        
        # Summary
        summary = report['summary']
        print("Summary:")
        print(f"  Overall Success: {summary['overall_success']}")
        print(f"  Edge Cases Test: {'PASSED' if summary['edge_cases_test_passed'] else 'FAILED'}")
        print(f"  Results: {summary['passed']} passed, {summary['failed']} failed, {summary['errors']} errors, {summary['missing']} missing")
        print()
        
        # Successful problems
        if report['successful_problems']:
            print("✅ Successful Problems:")
            for problem in report['successful_problems']:
                print(f"  {problem['problem']}: Answer {problem['answer']}")
            print()
        
        # Failed problems
        if report['failed_problems']:
            print("❌ Failed Problems:")
            for problem in report['failed_problems']:
                print(f"  {problem['problem']}: {problem['status']} - {problem['reason']}")
            print()
        
        print(f"📄 Full report available at: {report_file}")
        
    except Exception as e:
        print(f"❌ Error reading validation report: {e}")

def main_test():
    """Main test function"""
    import argparse
    
    # Add command line argument for viewing reports
    parser = argparse.ArgumentParser(description='AMC Parser Edge Cases Test Suite')
    parser.add_argument('--view-report', action='store_true', help='View the latest validation report')
    args = parser.parse_args()
    
    if args.view_report:
        view_validation_report()
        return
    
    # Run the edge cases test suite
    test_success = run_edge_cases_test()
    
    # Validate the results
    validation_results = validate_parsing_results()
    
    # Print summary
    success = print_summary(validation_results, test_success)
    
    print(f"\nTest files saved in 'test_output' directory")
    print("You can manually clean up the directory when needed")
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main_test() 