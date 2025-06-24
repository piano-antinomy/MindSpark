#!/usr/bin/env python3
"""
Script to categorize already-downloaded AMC problems.
Uses the ProblemAnalyzer to add categorization to existing problem files.
Accepts a JSON input file to specify which files to process.
Includes low confidence analysis in the final report.
"""

import json
import os
import shutil
import sys
from collections import defaultdict
from problem_analyzer import ProblemAnalyzer
from datetime import datetime

def load_file_list(config_file="test_config.json"):
    """Load the list of files to process from JSON config"""
    # Get the directory where this script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    config_path = os.path.join(script_dir, config_file)
    
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
        
        files_to_process = config.get('files_to_process', [])
        confidence_threshold = config.get('confidence_threshold', 0.8)
        
        if not files_to_process:
            print("Error: No files specified in config file")
            return None, None
            
        return files_to_process, confidence_threshold
            
    except FileNotFoundError:
        print(f"Error: Config file '{config_path}' not found")
        return None, None
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in config file: {e}")
        return None, None

def categorize_competition_file(file_path, analyzer, backup=True):
    """Categorize a single competition file"""
    print(f"Processing: {os.path.basename(file_path)}")
    
    # Create backup if requested
    if backup:
        backup_path = file_path + '.backup'
        shutil.copy2(file_path, backup_path)
        print(f"  Created backup: {os.path.basename(backup_path)}")
    
    # Load the file
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Analyze the competition
    analyzed_data = analyzer.analyze_competition(data)
    
    # Save the updated file
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(analyzed_data, f, indent=2, ensure_ascii=False)
    
    # Print summary
    summary = analyzed_data.get('analysis_summary', {})
    total_problems = summary.get('total_problems', 0)
    categorized = summary.get('categorized', 0)
    uncategorized = summary.get('uncategorized', 0)
    
    print(f"  ✓ Problems: {total_problems}, Categorized: {categorized}, Uncategorized: {uncategorized}")
    
    # Show category distribution
    category_dist = summary.get('category_distribution', {})
    if category_dist:
        print(f"  Categories: {dict(category_dist)}")
    
    # Show validation issues if any
    validation_issues = summary.get('validation_issues', [])
    if validation_issues:
        print(f"  ⚠ Validation issues: {len(validation_issues)} problems")
    
    return analyzed_data

def find_low_confidence_problems(analyzed_data, confidence_threshold, file_name):
    """Find problems with confidence below the threshold in a single file"""
    low_confidence_problems = []
    
    problems = analyzed_data.get('problems', [])
    year = analyzed_data.get('competition_info', {}).get('year', 'unknown')
    
    for i, problem in enumerate(problems, 1):
        category_info = problem.get('category', {})
        confidence = category_info.get('confidence', 0)
        
        if confidence < confidence_threshold:
            low_confidence_problems.append({
                'file': file_name,
                'year': year,
                'problem_number': i,
                'problem_id': problem.get('id', f'problem_{i}'),
                'primary_category': category_info.get('primary', 'unknown'),
                'confidence': confidence,
                'all_scores': category_info.get('all_scores', {}),
                'question_text': problem.get('question', {}).get('text', '')[:100] + '...' if len(problem.get('question', {}).get('text', '')) > 100 else problem.get('question', {}).get('text', '')
            })
    
    return low_confidence_problems

def categorize_specified_files(files_to_process, confidence_threshold=0.8, backup=True, output_file=None):
    """Categorize only the files specified in the config"""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(script_dir)))
    amc_dir = os.path.join(project_root, "backend-java", "questions", "AMC")
    
    analyzer = ProblemAnalyzer()
    
    # Statistics
    total_files = 0
    total_problems = 0
    total_categorized = 0
    total_uncategorized = 0
    global_category_distribution = defaultdict(int)
    all_validation_issues = []
    processed_files = []
    failed_files = []
    all_low_confidence_problems = []
    
    # Store detailed results for JSON output
    detailed_results = {
        "metadata": {
            "timestamp": datetime.now().isoformat(),
            "confidence_threshold": confidence_threshold,
            "total_files_processed": 0,
            "total_problems": 0,
            "total_categorized": 0,
            "total_uncategorized": 0
        },
        "files": [],
        "category_distribution": {},
        "validation_issues": [],
        "low_confidence_problems": []
    }
    
    print("=== Categorizing Specified AMC Problems ===\n")
    print(f"Files to process: {len(files_to_process)}")
    print(f"Confidence threshold: {confidence_threshold*100:.0f}%")
    
    for file_spec in files_to_process:
        # Handle different file specification formats
        if isinstance(file_spec, str):
            # Simple string: assume it's a relative path from AMC directory
            file_path = os.path.join(amc_dir, file_spec)
        elif isinstance(file_spec, dict):
            # Dictionary with level and filename
            level = file_spec.get('level', 'AMC_8')
            filename = file_spec.get('filename')
            if not filename:
                print(f"Error: Missing filename in file spec: {file_spec}")
                continue
            file_path = os.path.join(amc_dir, level, filename)
        else:
            print(f"Error: Invalid file specification: {file_spec}")
            continue
        
        # Check if file exists
        if not os.path.exists(file_path):
            print(f"Error: File not found: {file_path}")
            failed_files.append(file_spec)
            continue
        
        total_files += 1
        
        try:
            # Categorize the file
            analyzed_data = categorize_competition_file(file_path, analyzer, backup)
            processed_files.append(file_spec)
            
            # Update global statistics
            summary = analyzed_data.get('analysis_summary', {})
            total_problems += summary.get('total_problems', 0)
            total_categorized += summary.get('categorized', 0)
            total_uncategorized += summary.get('uncategorized', 0)
            
            # Update global category distribution
            for category, count in summary.get('category_distribution', {}).items():
                global_category_distribution[category] += count
            
            # Collect validation issues
            all_validation_issues.extend(summary.get('validation_issues', []))
            
            # Find low confidence problems in this file
            file_name = os.path.basename(file_path)
            low_confidence_problems = find_low_confidence_problems(analyzed_data, confidence_threshold, file_name)
            all_low_confidence_problems.extend(low_confidence_problems)
            
            # Store detailed file results
            file_result = {
                "file_path": file_path,
                "file_spec": file_spec,
                "summary": summary,
                "low_confidence_count": len(low_confidence_problems)
            }
            detailed_results["files"].append(file_result)
            
        except Exception as e:
            print(f"Error processing {file_spec}: {e}")
            failed_files.append(file_spec)
    
    # Update metadata
    detailed_results["metadata"]["total_files_processed"] = total_files
    detailed_results["metadata"]["total_problems"] = total_problems
    detailed_results["metadata"]["total_categorized"] = total_categorized
    detailed_results["metadata"]["total_uncategorized"] = total_uncategorized
    detailed_results["category_distribution"] = dict(global_category_distribution)
    detailed_results["validation_issues"] = all_validation_issues
    detailed_results["low_confidence_problems"] = all_low_confidence_problems
    
    # Save results to JSON file if specified
    if output_file:
        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(detailed_results, f, indent=2, ensure_ascii=False)
            print(f"\nResults saved to: {output_file}")
        except Exception as e:
            print(f"Error saving results to {output_file}: {e}")
    
    return detailed_results

def main():
    """Main function to run the categorizer"""
    # Load configuration - look for config file relative to script location
    script_dir = os.path.dirname(os.path.abspath(__file__))
    config_file = os.path.join(script_dir, "test_config.json")
    
    if not os.path.exists(config_file):
        print(f"Error: Configuration file '{config_file}' not found!")
        return
    
    files_to_process, confidence_threshold = load_file_list(config_file)
    if files_to_process is None:
        print("No files specified for processing in the configuration.")
        return
    
    # Ensure output directory exists
    output_dir = os.path.join(script_dir, "categorization_results")
    os.makedirs(output_dir, exist_ok=True)
    
    # Generate output filename with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = os.path.join(output_dir, f"categorization_results_{timestamp}.json")
    
    results = categorize_specified_files(files_to_process, confidence_threshold, output_file=output_file)
    print(f"\n✓ Categorization complete! Processed {results['metadata']['total_files_processed']} files.")
    print(f"Results saved to: {output_file}")

if __name__ == "__main__":
    main() 