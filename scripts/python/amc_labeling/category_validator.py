import json
import os

class CategoryValidator:
    """Validator for AMC problem categorizations."""
    
    def __init__(self):
        self.categories_file = os.path.join(os.path.dirname(__file__), 'amc_categories.json')
        self.valid_categories = self._load_categories()
    
    def _load_categories(self):
        """Load the official category definitions."""
        with open(self.categories_file, 'r') as f:
            data = json.load(f)
        return data['categories']
    
    def is_valid_category(self, category, sub_category):
        """
        Check if a category/sub_category combination is valid.
        
        Args:
            category (str): The main category
            sub_category (str): The sub category
            
        Returns:
            bool: True if valid, False otherwise
        """
        if category not in self.valid_categories:
            return False
        
        if sub_category not in self.valid_categories[category]:
            return False
            
        return True
    
    def get_valid_subcategories(self, category):
        """
        Get all valid subcategories for a given category.
        
        Args:
            category (str): The main category
            
        Returns:
            list: List of valid subcategories, or empty list if category is invalid
        """
        return self.valid_categories.get(category, [])
    
    def get_all_categories(self):
        """
        Get all valid categories.
        
        Returns:
            list: List of all valid categories
        """
        return list(self.valid_categories.keys())
    
    def validate_problem(self, problem):
        """
        Validate a single problem's categorization.
        
        Args:
            problem (dict): Problem dictionary with categorization
            
        Returns:
            dict: Validation result with errors and warnings
        """
        errors = []
        warnings = []
        
        problem_id = problem.get('id', 'Unknown')
        
        # Check if problem has categorization
        if 'categorization' not in problem or not problem['categorization']:
            errors.append("No categorization found")
            return {'errors': errors, 'warnings': warnings}
        
        categorization = problem['categorization'][0]
        category = categorization.get('category', '')
        sub_category = categorization.get('sub_category', '')
        
        # Validate category
        if not category:
            errors.append("Missing category")
        elif not self.is_valid_category(category, sub_category):
            if category not in self.valid_categories:
                errors.append(f"Invalid category '{category}'")
            else:
                errors.append(f"Invalid sub_category '{sub_category}' for category '{category}'")
        
        # Check confidence
        confidence = categorization.get('confidence', 0)
        if confidence < 0.5:
            warnings.append(f"Low confidence ({confidence})")
        
        return {'errors': errors, 'warnings': warnings} 