import requests
import os

class DeepSeekSimple:
    def __init__(self, api_key=None):
        
        os.environ['DEEPSEEK_API_KEY'] = "sk-a73bca1883d247e3b11821f1bf5d4f50"
        self.api_key = api_key or os.getenv('DEEPSEEK_API_KEY')
        if not self.api_key:
            print("Error: No API key found!")
            print("Set DEEPSEEK_API_KEY environment variable or pass api_key parameter")
            print("Get free API key from: https://platform.deepseek.com/")
            return None
        
        self.conversation_history = []
        self.url = "https://api.deepseek.com/v1/chat/completions"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    def chat(self, message, remember_history=True):
        """
        Chat with DeepSeek with optional conversation history
        
        Args:
            message: Your message
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
            "model": "deepseek-chat",
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

# Example usage
if __name__ == "__main__":
    # Test with history
    print("=== Testing with conversation history ===")
    client = DeepSeekSimple()
    
    if client.api_key:
        # First message
        response1 = client.chat("What is the capital of France?")
        print(f"Response 1: {response1}")
        
        
        # Clear history
        client.clear_history()
        
        # Test without history
        print("\n=== Testing without history ===")
        response4 = client.chat("What is the capital of Spain?", remember_history=False)
        print(f"Response 4: {response4}")
    else:
        print("No API key available for testing") 