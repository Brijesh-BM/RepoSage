import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load env file
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))
api_key = os.environ.get("GEMINI_API_KEY")
print(f"API Key starting with: {api_key[:8] if api_key else 'None'}")

if api_key:
    genai.configure(api_key=api_key)
    
    models_to_test = [
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-2.0-flash",
        "gemini-2.5-flash"
    ]
    
    for model_name in models_to_test:
        print(f"\nTesting model: {model_name}")
        try:
            model = genai.GenerativeModel(model_name=model_name)
            response = model.generate_content("Say hello")
            print(f"Success! Response: {response.text}")
        except Exception as e:
            print(f"Failed: {e}")
else:
    print("No GEMINI_API_KEY found in env")
