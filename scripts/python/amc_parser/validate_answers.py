#!/usr/bin/env python3
"""
AMC Answer Validation Script

This script fetches official answer sheets from AoPS and validates them against
the answers stored in the JSON files. It identifies any discrepancies between
the official answers and the stored answers.

Usage:
    python validate_answers.py [options]

Options:
    --competition-dir: Directory containing AMC JSON files (default: backend-java/resources/math/questions)
    --output-file: Output file for validation report (default: answer_validation_report.json)
    --verbose: Enable verbose output
    --dry-run: Show what would be validated without making network requests
"""

import os
import json
import argparse
import sys
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import requests
from bs4 import BeautifulSoup
import time

# Add the current directory to path to import AMCParser
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from amc_parser import AMCParser

class AnswerValidator:
    def __init__(self, competition_dir: str, verbose: bool = False):
        self.competition_dir = Path(competition_dir)
        self.verbose = verbose
        self.parser = AMCParser(use_answer_sheets=True)
        self.validation_results = {
            "summary": {
                "total_competitions": 0,
                "total_problems": 0,
                "mismatches_found": 0,
                "validation_errors": 0,
                "network_errors": 0
            },
            "competitions": []
        }
        
    def log(self, message: str, level: str = "INFO"):
        """Log message with optional verbose filtering"""
        if level == "VERBOSE" and not self.verbose:
            return
        if level == "WARN":
            return  # Don't show warnings during processing
        print(f"[{level}] {message}")
    
    def get_competition_info_from_filename(self, filename: str) -> Optional[Dict]:
        """Extract competition info from JSON filename"""
        # Remove .json extension
        name = filename.replace('.json', '')
        
        # Parse different filename formats
        parts = name.split('_')
        
        if len(parts) < 3:
            return None
            
        try:
            year = int(parts[0])
            
            if parts[1] == 'AMC':
                level = parts[2]
                suffix = parts[3] if len(parts) > 3 else ''
                fall_version = False
                is_ajhsme = False
            elif parts[1] == 'Fall' and parts[2] == 'AMC':
                level = parts[3]
                suffix = parts[4] if len(parts) > 4 else ''
                fall_version = True
                is_ajhsme = False
            elif parts[1] == 'AJHSME':
                level = '8'  # AJHSME is grouped with AMC 8
                suffix = ''
                fall_version = False
                is_ajhsme = True
            else:
                return None
                
            return {
                'year': year,
                'level': level,
                'suffix': suffix,
                'fall_version': fall_version,
                'is_AJHSME': is_ajhsme,
                'filename': filename
            }
        except (ValueError, IndexError):
            return None
    
    def load_json_answers(self, file_path: Path) -> Tuple[List[str], Dict]:
        """Load answers from JSON file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            problems = data.get('problems', [])
            answers = []
            
            for problem in problems:
                answer = problem.get('answer', '')
                if answer in ['A', 'B', 'C', 'D', 'E']:
                    answers.append(answer)
                else:
                    answers.append('')  # Invalid answer format
            
            return answers, data.get('competition_info', {})
            
        except Exception as e:
            self.log(f"Error loading {file_path}: {e}", "ERROR")
            return [], {}
    
    def fetch_answer_sheet(self, competition_info: Dict) -> Optional[List[str]]:
        """Fetch answer sheet for a competition"""
        try:
            # Create competition object for AMCParser
            competition = {
                'year': competition_info['year'],
                'level': competition_info['level'],
                'suffix': competition_info['suffix'],
                'fall_version': competition_info['fall_version'],
                'is_AJHSME': competition_info['is_AJHSME'],
                'num_problems': 25  # Standard AMC problem count
            }
            
            answer_sheet = self.parser.fetch_answer_sheet(competition)
            
            if answer_sheet:
                return answer_sheet
            else:
                self.log(f"Failed to fetch answer sheet for {competition_info['filename']}", "ERROR")
                return None
                
        except Exception as e:
            self.log(f"Error fetching answer sheet for {competition_info['filename']}: {e}", "ERROR")
            return None
    
    def validate_competition(self, file_path: Path) -> Dict:
        """Validate answers for a single competition"""
        filename = file_path.name
        print(f"Processing {filename}...")
        
        # Extract competition info from filename
        competition_info = self.get_competition_info_from_filename(filename)
        if not competition_info:
            self.log(f"Could not parse competition info from {filename}", "ERROR")
            return {
                "filename": filename,
                "status": "error",
                "error": "Could not parse competition info from filename",
                "mismatches": []
            }
        
        # Load answers from JSON file
        json_answers, json_competition_info = self.load_json_answers(file_path)
        if not json_answers:
            self.log(f"No answers found in {filename}", "ERROR")
            return {
                "filename": filename,
                "status": "error", 
                "error": "No answers found in JSON file",
                "mismatches": []
            }
        
        # Fetch official answer sheet
        official_answers = self.fetch_answer_sheet(competition_info)
        if not official_answers:
            self.log(f"Could not fetch answer sheet for {filename}", "ERROR")
            return {
                "filename": filename,
                "status": "error",
                "error": "Could not fetch official answer sheet",
                "mismatches": []
            }
        
        # Compare answers
        mismatches = []
        max_problems = min(len(json_answers), len(official_answers))
        
        for i in range(max_problems):
            problem_num = i + 1
            json_answer = json_answers[i]
            official_answer = official_answers[i]
            
            if json_answer != official_answer:
                mismatches.append({
                    "problem_number": problem_num,
                    "json_answer": json_answer,
                    "official_answer": official_answer,
                    "json_problem_id": f"amc_{competition_info['year']}_{competition_info['level']}{competition_info['suffix'].lower()}_{problem_num}"
                })
        
        # Check for length mismatches
        if len(json_answers) != len(official_answers):
            self.log(f"  Length mismatch: JSON has {len(json_answers)} answers, official has {len(official_answers)}", "WARN")
        
        status = "success" if not mismatches else "mismatches_found"
        
        return {
            "filename": filename,
            "competition_info": {
                "json_info": json_competition_info,
                "parsed_info": competition_info
            },
            "status": status,
            "total_problems": max_problems,
            "mismatches_count": len(mismatches),
            "mismatches": mismatches,
            "json_answers": json_answers,
            "official_answers": official_answers
        }
    
    def validate_all_competitions(self) -> Dict:
        """Validate all AMC competitions in the directory"""
        print(f"Scanning directory: {self.competition_dir}")
        
        # Find all AMC JSON files
        amc_dirs = ['AMC_8', 'AMC_10', 'AMC_12']
        json_files = []
        
        for amc_dir in amc_dirs:
            dir_path = self.competition_dir / amc_dir
            if dir_path.exists():
                for file_path in dir_path.glob('*.json'):
                    if file_path.name != 'problematic_ones':  # Skip non-competition files
                        json_files.append(file_path)
        
        print(f"Found {len(json_files)} competition files to validate\n")
        
        # Validate each competition
        for i, file_path in enumerate(json_files, 1):
            try:
                result = self.validate_competition(file_path)
                self.validation_results["competitions"].append(result)
                
                # Update summary
                self.validation_results["summary"]["total_competitions"] += 1
                self.validation_results["summary"]["total_problems"] += result.get("total_problems", 0)
                self.validation_results["summary"]["mismatches_found"] += result.get("mismatches_count", 0)
                
                if result["status"] == "error":
                    self.validation_results["summary"]["validation_errors"] += 1
                
            except Exception as e:
                self.log(f"Unexpected error processing {file_path.name}: {e}", "ERROR")
                self.validation_results["summary"]["network_errors"] += 1
                self.validation_results["competitions"].append({
                    "filename": file_path.name,
                    "status": "error",
                    "error": str(e),
                    "mismatches": []
                })
            
            # Add small delay to be respectful to the server
            time.sleep(0.5)
        
        return self.validation_results
    
    def generate_report(self, output_file: str):
        """Generate validation report"""
        print(f"\nGenerating validation report...")
        
        # Print summary
        summary = self.validation_results["summary"]
        print(f"\n{'='*60}")
        print("VALIDATION SUMMARY")
        print(f"{'='*60}")
        print(f"Total competitions processed: {summary['total_competitions']}")
        print(f"Total problems validated: {summary['total_problems']}")
        print(f"Mismatches found: {summary['mismatches_found']}")
        print(f"Validation errors: {summary['validation_errors']}")
        print(f"Network errors: {summary['network_errors']}")
        
        # Collect all mismatch problem IDs
        all_mismatches = []
        for comp in self.validation_results["competitions"]:
            if comp.get("mismatches_count", 0) > 0:
                for mismatch in comp['mismatches']:
                    all_mismatches.append({
                        "problem_id": mismatch['json_problem_id'],
                        "filename": comp['filename'],
                        "problem_number": mismatch['problem_number'],
                        "json_answer": mismatch['json_answer'],
                        "official_answer": mismatch['official_answer']
                    })
        
        if all_mismatches:
            print(f"\n{'='*60}")
            print("ALL MISMATCH PROBLEM IDs")
            print(f"{'='*60}")
            for mismatch in all_mismatches:
                print(f"{mismatch['problem_id']} | {mismatch['filename']} Problem {mismatch['problem_number']} | JSON='{mismatch['json_answer']}' vs Official='{mismatch['official_answer']}'")
        else:
            print(f"\n✅ No mismatches found! All answers are correct.")
        
        # Save detailed report to file
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(self.validation_results, f, indent=2, ensure_ascii=False)
        
        print(f"\nDetailed report saved to: {output_file}")
        
        return self.validation_results

def main():
    parser = argparse.ArgumentParser(description='Validate AMC answers against official answer sheets')
    parser.add_argument('--competition-dir', 
                       default='backend-java/resources/math/questions',
                       help='Directory containing AMC JSON files')
    parser.add_argument('--output-file',
                       default='answer_validation_report.json', 
                       help='Output file for validation report')
    parser.add_argument('--verbose', '-v',
                       action='store_true',
                       help='Enable verbose output')
    parser.add_argument('--dry-run',
                       action='store_true',
                       help='Show what would be validated without making network requests')
    
    args = parser.parse_args()
    
    # Convert relative path to absolute
    competition_dir = os.path.abspath(args.competition_dir)
    
    if not os.path.exists(competition_dir):
        print(f"Error: Competition directory not found: {competition_dir}")
        sys.exit(1)
    
    if args.dry_run:
        print("DRY RUN MODE - No network requests will be made")
        print(f"Would validate competitions in: {competition_dir}")
        
        # Just list the files that would be processed
        amc_dirs = ['AMC_8', 'AMC_10', 'AMC_12']
        total_files = 0
        
        for amc_dir in amc_dirs:
            dir_path = Path(competition_dir) / amc_dir
            if dir_path.exists():
                json_files = list(dir_path.glob('*.json'))
                print(f"  {amc_dir}: {len(json_files)} files")
                total_files += len(json_files)
        
        print(f"Total files to validate: {total_files}")
        return
    
    # Run validation
    validator = AnswerValidator(competition_dir, verbose=args.verbose)
    results = validator.validate_all_competitions()
    validator.generate_report(args.output_file)
    
    # Exit with error code if mismatches found
    if results["summary"]["mismatches_found"] > 0:
        print(f"\n⚠️  Found {results['summary']['mismatches_found']} answer mismatches!")
        sys.exit(1)
    else:
        print(f"\n✅ All answers validated successfully!")

if __name__ == "__main__":
    main()
