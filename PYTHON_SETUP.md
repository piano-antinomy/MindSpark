## Python Virtual Environment Setup

### Prerequisites
- Python 3.7+ installed on your system
- pip package manager

### Setup Instructions

1. **Navigate to the Python directory:**
   ```bash
   cd scripts/python
   ```

2. **Create virtual environment:**
   ```bash
   python3 -m venv venv
   ```

3. **Activate virtual environment:**
   
   **On macOS/Linux:**
   ```bash
   source venv/bin/activate
   ```
   
   **On Windows:**
   ```bash
   venv\Scripts\activate
   ```

4. **Upgrade pip:**
   ```bash
   pip install --upgrade pip
   ```

5. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

6. **Verify installation:**
   ```bash
   pip list
   ```

### Current Dependencies

The `requirements.txt` includes:
- `requests==2.31.0` - HTTP library for web scraping
- `beautifulsoup4==4.12.2` - HTML parsing library

## Usage

### Running the AMC Parser

1. **Ensure virtual environment is activated:**
   ```bash
   source venv/bin/activate  # macOS/Linux
   # or
   venv\Scripts\activate     # Windows
   ```

2. **Navigate to the parser directory:**
   ```bash
   cd amc_parser
   ```

3. **Run the parser:**
   ```bash
   python amc_parser.py
   ```

### Development Workflow

1. **Always activate the virtual environment before working:**
   ```bash
   cd scripts/python
   source venv/bin/activate
   ```

2. **Install new dependencies:**
   ```bash
   pip install package_name
   pip freeze > requirements.txt  # Update requirements file
   ```

3. **Deactivate when done:**
   ```bash
   deactivate
   ```

## AMC Parser Module

### Features
- Scrapes AMC competition problems from Art of Problem Solving wiki
- Supports AJHSME (1985-1998) and AMC 8/10/12 (1999-2025)
- Handles regular and fall versions of competitions
- Extracts questions, multiple choice options, solutions, and answers
- Outputs structured JSON data

### Configuration
- Competition settings are defined in `competition_dict.json`
- Supports custom competition lists
- Configurable number of problems per competition

### Output
- Generates JSON files with parsed problems
- Saves to `../../backend-java/questions/level-1/` directory
- Includes comprehensive error handling and progress reporting

## Maintenance

### Updating Dependencies
```bash
# Activate environment
source venv/bin/activate

# Update packages
pip install --upgrade package_name

# Update requirements file
pip freeze > requirements.txt
```

### Adding New Python Modules
1. Create new directories under `scripts/python/`
2. Update `requirements.txt` if new dependencies are needed
3. Follow the same virtual environment workflow

## Troubleshooting

### Common Issues

1. **Virtual environment not found:**
   - Ensure you're in the `scripts/python` directory
   - Recreate the virtual environment: `python3 -m venv venv`

2. **Permission errors:**
   - On macOS/Linux: Check file permissions
   - On Windows: Run terminal as administrator if needed

3. **Package installation fails:**
   - Upgrade pip: `pip install --upgrade pip`
   - Clear pip cache: `pip cache purge`

4. **Import errors:**
   - Ensure virtual environment is activated
   - Verify all dependencies are installed: `pip list`

### Getting Help
- Check the main project README.md for general setup
- Review individual module documentation
- Ensure all prerequisites are met before running scripts 