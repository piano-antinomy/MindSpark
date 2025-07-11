import requests
import os

class OpenRouterSimple:
    def __init__(self, api_key=None, app_name="AMC Labeling Tool"):
        self.api_key = api_key or os.getenv('OPENROUTER_API_KEY')
        if not self.api_key:
            print("Error: No API key found!")
            print("Set OPENROUTER_API_KEY environment variable or pass api_key parameter")
            print("Get free API key from: https://openrouter.ai/")
            return None
        
        self.conversation_history = []
        self.url = "https://openrouter.ai/api/v1/chat/completions"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/your-repo",  # Required by OpenRouter
            "X-Title": app_name  # Optional but recommended
        }
    
    def chat(self, message, model="deepseek/deepseek-chat", remember_history=True):
        """
        Chat with any model via OpenRouter
        
        Args:
            message: Your message
            model: Model to use (default: deepseek/deepseek-chat)
            remember_history: Whether to include previous conversation
        """
        
        if remember_history:
            # Add user message to history
            self.conversation_history.append({"role": "user", "content": message})
            messages = self.conversation_history
        else:
            # Send only current message
            messages = [{"role": "user", "content": message}]
        
        data = {
            "model": model,
            "messages": messages,
            "max_tokens": 1000,
            "temperature": 0.7
        }
        
        try:
            response = requests.post(self.url, headers=self.headers, json=data)
            response.raise_for_status()
            
            result = response.json()
            assistant_message = result['choices'][0]['message']['content']
            
            if remember_history:
                # Add assistant response to history
                self.conversation_history.append({"role": "assistant", "content": assistant_message})
            
            return assistant_message
            
        except requests.exceptions.RequestException as e:
            print(f"Request error: {e}")
            return None
        except Exception as e:
            print(f"Error: {e}")
            return None
    
    def clear_history(self):
        """Clear conversation history"""
        self.conversation_history = []
        print("Conversation history cleared!")
    
    def get_history(self):
        """Get current conversation history"""
        return self.conversation_history
    
    def list_models(self):
        """List available models (you can add this if needed)"""
        print("Popular OpenRouter Models:")
        print("- deepseek/deepseek-chat (DeepSeek)")
        print("- openai/gpt-4 (GPT-4)")
        print("- openai/gpt-3.5-turbo (GPT-3.5)")
        print("- anthropic/claude-3-sonnet (Claude)")
        print("- google/gemini-pro (Gemini)")
        print("- meta-llama/llama-2-70b-chat (Llama)")
        print("- mistralai/mistral-7b-instruct (Mistral)")

def chat_with_openrouter(message, model="deepseek/deepseek-chat", api_key=None):
    """
    Simple function to chat with OpenRouter (no history)
    
    Args:
        message: Your message
        model: Model to use
        api_key: Your API key (or set OPENROUTER_API_KEY environment variable)
    """
    
    # Get API key
    api_key = api_key or os.getenv('OPENROUTER_API_KEY')
    if not api_key:
        print("Error: No API key found!")
        print("Set OPENROUTER_API_KEY environment variable or pass api_key parameter")
        print("Get free API key from: https://openrouter.ai/")
        return None
    
    # API endpoint
    url = "https://openrouter.ai/api/v1/chat/completions"
    
    # Headers
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/your-repo",
        "X-Title": "AMC Labeling Tool"
    }
    
    # Request data
    data = {
        "model": model,
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
    # Test with different models
    print("=== Testing OpenRouter with different models ===")
    client = OpenRouterSimple()
    
    if client.api_key:
        # Test with DeepSeek
        print("\n--- Testing DeepSeek ---")
        response1 = client.chat("What is the capital of France?", model="deepseek/deepseek-chat")
        print(f"DeepSeek Response: {response1}")
        
        # Test with GPT-3.5
        print("\n--- Testing GPT-3.5 ---")
        response2 = client.chat("What is the capital of Germany?", model="openai/gpt-3.5-turbo")
        print(f"GPT-3.5 Response: {response2}")
        
        # Test with Claude
        print("\n--- Testing Claude ---")
        response3 = client.chat("What is the capital of Italy?", model="anthropic/claude-3-sonnet")
        print(f"Claude Response: {response3}")
        
        # Test conversation history
        print("\n--- Testing Conversation History ---")
        client.clear_history()
        response4 = client.chat("My name is Alice.")
        print(f"Response 4: {response4}")
        
        response5 = client.chat("What's my name?")
        print(f"Response 5: {response5}")
        
        print(f"\nHistory length: {len(client.get_history())}")
        
        # List available models
        print("\n--- Available Models ---")
        client.list_models()
        
    else:
        print("No API key available for testing")
        print("Get free API key from: https://openrouter.ai/") 