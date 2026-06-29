import asyncio
import json
import logging
import time
from openai import OpenAI
import google.generativeai as genai

logger = logging.getLogger(__name__)
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
        prompt_chars = len(prompt) + (len(system_instruction) if system_instruction else 0)
        estimated_tokens = prompt_chars // 4
        
        logger.debug(f"GROQ_API_KEY set = {bool(settings.GROQ_API_KEY)}")
        
        # Try Groq first if key is available
        if settings.GROQ_API_KEY:
            logger.info(f"[LLM START] Provider: Groq, Model: {settings.GROQ_MODEL}, Prompt Size: {prompt_chars} chars (~{estimated_tokens} tokens)")
            start_time = time.time()
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
                
                duration = time.time() - start_time
                response_size = len(text_content)
                logger.info(f"[LLM END] Provider: Groq, Model: {settings.GROQ_MODEL}, Response Size: {response_size} chars, Duration: {duration:.2f}s")
                return schema.model_validate_json(text_content)
            except Exception as e:
                duration = time.time() - start_time
                logger.warning(f"[LLM ERROR] Provider: Groq, Model: {settings.GROQ_MODEL}, Duration: {duration:.2f}s, Error: {str(e)[:200]}")
                logger.warning("Groq API error (falling back to Gemini)")
                # Fall through to Gemini for ANY Groq error
                pass
        
        # Gemini fallback
        if not self.api_key:
            raise Exception("No API keys available.")
        
        logger.info(f"[LLM START] Provider: Gemini, Model: {settings.GEMINI_MODEL}, Prompt Size: {prompt_chars} chars (~{estimated_tokens} tokens)")
        start_time = time.time()
        
        genai.configure(api_key=self.api_key)
        model = genai.GenerativeModel(
            model_name=settings.GEMINI_MODEL,
            system_instruction=system_instruction
        )
        config = genai.GenerationConfig(
            response_mime_type="application/json",
            temperature=0.1
        )
        
        full_prompt = prompt + f"\n\nRespond ONLY with a valid JSON object matching this schema: {schema.model_json_schema()}"
        
        loop = asyncio.get_event_loop()
        response = await asyncio.wait_for(
            loop.run_in_executor(
                None,
                lambda: model.generate_content(full_prompt, generation_config=config)
            ),
            timeout=120.0
        )
        text_content = response.text
        if not text_content:
            raise Exception("Empty response from Gemini")
            
        duration = time.time() - start_time
        response_size = len(text_content)
        logger.info(f"[LLM END] Provider: Gemini, Model: {settings.GEMINI_MODEL}, Response Size: {response_size} chars, Duration: {duration:.2f}s")
        return schema.model_validate_json(text_content)
