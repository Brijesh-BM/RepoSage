import asyncio
import json
from openai import OpenAI
import google.generativeai as genai
from typing import Type, TypeVar, Optional
from pydantic import BaseModel
from config import settings

T = TypeVar("T", bound=BaseModel)

class GeminiClient:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        if self.api_key:
            genai.configure(api_key=self.api_key)

    async def generate_structured(
        self,
        prompt: str,
        schema: Type[T],
        system_instruction: Optional[str] = None
    ) -> T:
        import asyncio
        
        # Try Groq first if key is available
        if settings.GROQ_API_KEY:
            try:
                groq_client = OpenAI(
                    api_key=settings.GROQ_API_KEY,
                    base_url="https://api.groq.com/openai/v1"
                )
                # Truncate prompt to fit Groq TPM limit
                max_prompt_chars = 24000  # ~6000 tokens, leaves room for schema
                if len(prompt) > max_prompt_chars:
                    prompt = prompt[:max_prompt_chars] + "\n\n[TRUNCATED FOR LENGTH]"

                messages = []
                if system_instruction:
                    messages.append({"role": "system", "content": system_instruction})
                messages.append({
                    "role": "user", 
                    "content": prompt + f"\n\nRespond ONLY with a valid JSON object matching this schema: {schema.model_json_schema()}"
                })
                
                loop = asyncio.get_event_loop()
                response = await asyncio.wait_for(
                    loop.run_in_executor(
                        None,
                        lambda: groq_client.chat.completions.create(
                            model=settings.GROQ_MODEL,
                            messages=messages,
                            temperature=0.1,
                            response_format={"type": "json_object"}
                        )
                    ),
                    timeout=120.0
                )
                text_content = response.choices[0].message.content
                if not text_content:
                    raise Exception("Empty response from Groq")
                return schema.model_validate_json(text_content)
            except Exception as e:
                if "429" in str(e) or "413" in str(e) or "quota" in str(e).lower() or "rate_limit" in str(e).lower() or "too large" in str(e).lower() or "token" in str(e).lower():
                    pass  # fall through to Gemini
                else:
                    raise e
        
        # Gemini fallback
        if not self.api_key:
            raise Exception("No API keys available. Set GROQ_API_KEY or GEMINI_API_KEY.")
        
        genai.configure(api_key=self.api_key)
        model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            system_instruction=system_instruction
        )
        config = genai.GenerationConfig(
            response_mime_type="application/json",
            response_schema=schema,
            temperature=0.1
        )
        loop = asyncio.get_event_loop()
        response = await asyncio.wait_for(
            loop.run_in_executor(
                None,
                lambda: model.generate_content(prompt, generation_config=config)
            ),
            timeout=120.0
        )
        text_content = response.text
        if not text_content:
            raise Exception("Empty response from Gemini")
        return schema.model_validate_json(text_content)
