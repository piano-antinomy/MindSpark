import requests
import os

def chat_with_deepseek(message, api_key=None):
    """
    Simple function to chat with DeepSeek
    
    Args:
        message: Your message
        api_key: Your API key (or set DEEPSEEK_API_KEY environment variable)
    """
    
    # Get API key
    api_key = api_key or os.getenv('DEEPSEEK_API_KEY')
    if not api_key:
        print("Error: No API key found!")
        print("Set DEEPSEEK_API_KEY environment variable or pass api_key parameter")
        print("Get free API key from: https://platform.deepseek.com/")
        return None
    
    # API endpoint
    url = "https://api.deepseek.com/v1/chat/completions"
    
    # Headers
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    # Request data
    data = {
        "model": "deepseek-chat",
        "messages": [{"role": "user", "content": message}],
        "max_tokens": 1000,
        "temperature": 0.7
    }
    
    try:
        # Make request
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        
        # Parse response
        result = response.json()
        return result['choices'][0]['message']['content']
        
    except requests.exceptions.RequestException as e:
        print(f"Request error: {e}")
        return None
    except Exception as e:
        print(f"Error: {e}")
        return None

# Example usage
if __name__ == "__main__":
    # Test message
    test_message = "What is the capital of France?"
    
    print("Sending message to DeepSeek...")
    print(f"Message: {test_message}")
    print("-" * 50)
    
    response = chat_with_deepseek(test_message)
    
    if response:
        print("Response:")
        print(response)
    else:
        print("Failed to get response") 