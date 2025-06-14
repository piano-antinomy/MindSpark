from flask import Flask, request, jsonify, session
from flask_cors import CORS
import json
import os
from datetime import datetime
import random

app = Flask(__name__)
app.secret_key = 'mindspark_secret_key_2024'
CORS(app, supports_credentials=True)

# In-memory storage for demo purposes
users_db = {
    "student1": {
        "password": "password123",
        "score": 0,
        "math_level": None,
        "completed_lessons": [],
        "quiz_scores": []
    },
    "demo": {
        "password": "demo123",
        "score": 0,
        "math_level": None,
        "completed_lessons": [],
        "quiz_scores": []
    }
}

# Math content organized by level
math_content = {
    "beginner": {
        "topics": ["Basic Addition", "Basic Subtraction", "Numbers 1-100"],
        "lessons": {
            "Basic Addition": {
                "content": "Addition is combining two or more numbers to get a total. For example: 2 + 3 = 5",
                "examples": ["1 + 1 = 2", "5 + 3 = 8", "10 + 7 = 17"]
            },
            "Basic Subtraction": {
                "content": "Subtraction is taking away one number from another. For example: 5 - 2 = 3",
                "examples": ["10 - 3 = 7", "8 - 4 = 4", "15 - 6 = 9"]
            }
        }
    },
    "intermediate": {
        "topics": ["Multiplication", "Division", "Fractions"],
        "lessons": {
            "Multiplication": {
                "content": "Multiplication is repeated addition. For example: 3 × 4 = 12 (adding 3 four times)",
                "examples": ["2 × 3 = 6", "5 × 4 = 20", "7 × 6 = 42"]
            },
            "Division": {
                "content": "Division is splitting a number into equal parts. For example: 12 ÷ 3 = 4",
                "examples": ["15 ÷ 3 = 5", "24 ÷ 6 = 4", "35 ÷ 7 = 5"]
            }
        }
    },
    "advanced": {
        "topics": ["Algebra", "Geometry", "Calculus Basics"],
        "lessons": {
            "Algebra": {
                "content": "Algebra uses letters to represent unknown numbers. For example: x + 5 = 10, so x = 5",
                "examples": ["2x = 10, x = 5", "x + 3 = 8, x = 5", "3x - 6 = 9, x = 5"]
            }
        }
    }
}

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if username in users_db and users_db[username]['password'] == password:
        session['username'] = username
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'user': {
                'username': username,
                'score': users_db[username]['score'],
                'math_level': users_db[username]['math_level']
            }
        })
    else:
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop('username', None)
    return jsonify({'success': True, 'message': 'Logged out successfully'})

@app.route('/api/user/profile', methods=['GET'])
def get_profile():
    if 'username' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    username = session['username']
    user = users_db[username]
    
    return jsonify({
        'success': True,
        'user': {
            'username': username,
            'score': user['score'],
            'math_level': user['math_level'],
            'completed_lessons': user['completed_lessons'],
            'quiz_scores': user['quiz_scores']
        }
    })

@app.route('/api/subjects', methods=['GET'])
def get_subjects():
    if 'username' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    subjects = [
        {'id': 'math', 'name': 'Mathematics', 'available': True},
        {'id': 'music', 'name': 'Music', 'available': False},
        {'id': 'chess', 'name': 'Chess', 'available': False},
        {'id': 'python', 'name': 'Python Coding', 'available': False},
        {'id': 'java', 'name': 'Java Coding', 'available': False}
    ]
    
    return jsonify({'success': True, 'subjects': subjects})

@app.route('/api/math/assessment', methods=['GET'])
def get_math_assessment():
    if 'username' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    assessment_questions = [
        {
            'id': 1,
            'question': 'What is 5 + 3?',
            'options': ['6', '7', '8', '9'],
            'correct': 2,
            'level': 'beginner'
        },
        {
            'id': 2,
            'question': 'What is 12 ÷ 4?',
            'options': ['2', '3', '4', '5'],
            'correct': 1,
            'level': 'intermediate'
        },
        {
            'id': 3,
            'question': 'Solve for x: 2x + 6 = 14',
            'options': ['2', '3', '4', '5'],
            'correct': 2,
            'level': 'advanced'
        }
    ]
    
    return jsonify({'success': True, 'questions': assessment_questions})

@app.route('/api/math/assessment', methods=['POST'])
def submit_assessment():
    if 'username' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    data = request.get_json()
    answers = data.get('answers', [])
    
    # Simple level determination based on correct answers
    correct_count = 0
    if len(answers) > 0 and answers[0] == 2:  # 5+3=8
        correct_count += 1
    if len(answers) > 1 and answers[1] == 1:  # 12÷4=3
        correct_count += 1
    if len(answers) > 2 and answers[2] == 2:  # 2x+6=14, x=4
        correct_count += 1
    
    if correct_count == 0:
        level = 'beginner'
    elif correct_count <= 1:
        level = 'beginner'
    elif correct_count <= 2:
        level = 'intermediate'
    else:
        level = 'advanced'
    
    username = session['username']
    users_db[username]['math_level'] = level
    users_db[username]['score'] += correct_count * 10
    
    return jsonify({
        'success': True,
        'level': level,
        'score': correct_count,
        'message': f'Assessment complete! Your level is {level}.'
    })

@app.route('/api/math/topics', methods=['GET'])
def get_math_topics():
    if 'username' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    username = session['username']
    user_level = users_db[username]['math_level']
    
    if not user_level:
        return jsonify({'success': False, 'message': 'Please take the assessment first'}), 400
    
    topics = math_content[user_level]['topics']
    return jsonify({'success': True, 'topics': topics, 'level': user_level})

@app.route('/api/math/lesson/<topic>', methods=['GET'])
def get_math_lesson(topic):
    if 'username' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    username = session['username']
    user_level = users_db[username]['math_level']
    
    if not user_level or topic not in math_content[user_level]['lessons']:
        return jsonify({'success': False, 'message': 'Lesson not found'}), 404
    
    lesson = math_content[user_level]['lessons'][topic]
    return jsonify({'success': True, 'lesson': lesson, 'topic': topic})

@app.route('/api/math/quiz/<topic>', methods=['GET'])
def get_math_quiz(topic):
    if 'username' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    # Generate random quiz questions based on topic
    quiz_questions = []
    
    if topic == "Basic Addition":
        for i in range(5):
            a = random.randint(1, 20)
            b = random.randint(1, 20)
            correct = a + b
            options = [correct, correct + 1, correct - 1, correct + 2]
            random.shuffle(options)
            quiz_questions.append({
                'id': i + 1,
                'question': f'What is {a} + {b}?',
                'options': options,
                'correct': options.index(correct)
            })
    
    elif topic == "Basic Subtraction":
        for i in range(5):
            a = random.randint(10, 30)
            b = random.randint(1, a)
            correct = a - b
            options = [correct, correct + 1, correct - 1, correct + 2]
            random.shuffle(options)
            quiz_questions.append({
                'id': i + 1,
                'question': f'What is {a} - {b}?',
                'options': options,
                'correct': options.index(correct)
            })
    
    else:
        # Default questions for other topics
        quiz_questions = [
            {
                'id': 1,
                'question': f'This is a sample question for {topic}',
                'options': ['A', 'B', 'C', 'D'],
                'correct': 0
            }
        ]
    
    return jsonify({'success': True, 'questions': quiz_questions, 'topic': topic})

@app.route('/api/math/quiz/<topic>', methods=['POST'])
def submit_quiz(topic):
    if 'username' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    data = request.get_json()
    answers = data.get('answers', [])
    
    # For demo purposes, we'll assume the quiz was generated correctly
    # In a real app, you'd store the quiz questions and validate against them
    correct_count = sum(1 for i, answer in enumerate(answers) if answer is not None)
    total_questions = len(answers)
    
    score = (correct_count / total_questions) * 100 if total_questions > 0 else 0
    points = correct_count * 5
    
    username = session['username']
    users_db[username]['score'] += points
    users_db[username]['quiz_scores'].append({
        'topic': topic,
        'score': score,
        'date': datetime.now().isoformat()
    })
    
    if topic not in users_db[username]['completed_lessons']:
        users_db[username]['completed_lessons'].append(topic)
    
    return jsonify({
        'success': True,
        'score': score,
        'correct': correct_count,
        'total': total_questions,
        'points_earned': points,
        'message': f'Quiz completed! You scored {score:.1f}%'
    })

if __name__ == '__main__':
    import socket
    
    def get_local_ip():
        try:
            # Connect to a remote server to determine local IP
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except:
            return 'localhost'
    
    local_ip = get_local_ip()
    print('🐍 MindSpark backend server is running!')
    print('=====================================')
    print(f'🌐 Local access:    http://localhost:4092')
    print(f'📡 Network access:  http://{local_ip}:4092')
    print('=====================================')
    print('Backend API is ready for connections!')
    print('')
    
    app.run(debug=True, host='0.0.0.0', port=4092) 