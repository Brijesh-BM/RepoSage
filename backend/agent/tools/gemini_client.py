import asyncio
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
        if not self.api_key:
            # Recheck in case it was set dynamically
            self.api_key = settings.GEMINI_API_KEY
            if not self.api_key:
                raise Exception("GEMINI_API_KEY is not set. Please configure it in your .env file.")
            genai.configure(api_key=self.api_key)

        # Using gemini-2.5-flash which is the state-of-the-art model for tasks requiring high performance and speed
        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
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
                lambda: model.generate_content(
                    prompt,
                    generation_config=config
                )
            ),
            timeout=90.0
        )
        
        text_content = response.text
        if not text_content:
            raise Exception("Received empty response from Gemini API")
            
        return schema.model_validate_json(text_content)
