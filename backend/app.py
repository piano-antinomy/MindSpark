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

# Import the new math module
from math_content.content import math_content
from math_content.quiz_generator import QuizGenerator

# Initialize quiz generator
quiz_generator = QuizGenerator()

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
    
    username = session['username']
    user_level = users_db[username]['math_level'] or 'beginner'
    
    # Generate fun themed quiz using the new quiz generator
    quiz_data = quiz_generator.generate_quiz(topic, difficulty=user_level, num_questions=5)
    
    return jsonify({
        'success': True, 
        'questions': quiz_data['questions'], 
        'topic': topic,
        'theme': quiz_data['theme'],
        'intro': quiz_data['intro']
    })

@app.route('/api/math/quiz/<topic>', methods=['POST'])
def submit_quiz(topic):
    if 'username' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    from math_content.content import get_score_message
    
    data = request.get_json()
    answers = data.get('answers', [])
    correct_answers = data.get('correct_answers', [])
    
    # Calculate score properly
    correct_count = 0
    for i, answer in enumerate(answers):
        if answer is not None and i < len(correct_answers):
            if answer == correct_answers[i]:
                correct_count += 1
    
    total_questions = len(answers)
    score = (correct_count / total_questions) * 100 if total_questions > 0 else 0
    points = correct_count * 5
    
    # Get motivational message based on score
    motivational_message = get_score_message(score)
    
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
        'message': motivational_message,
        'detailed_message': f'You got {correct_count} out of {total_questions} questions correct!'
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