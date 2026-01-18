from jinja2 import Environment, FileSystemLoader, Template
import os
from pathlib import Path

class TemplateService:
    def __init__(self):
        template_dir = Path(__file__).parent.parent / "templates"
        self.env = Environment(loader=FileSystemLoader(str(template_dir)))
    
    def render_template(self, template_name: str, context: dict) -> tuple[str, str]:
        """Render both HTML and text versions of a template"""
        try:
            html_template = self.env.get_template(f"{template_name}.html")
            html_content = html_template.render(**context)
        except Exception:
            html_content = self._render_fallback_html(template_name, context)
        
        try:
            text_template = self.env.get_template(f"{template_name}.txt")
            text_content = text_template.render(**context)
        except Exception:
            text_content = self._render_fallback_text(template_name, context)
        
        return html_content, text_content
    
    def _render_fallback_html(self, template_name: str, context: dict) -> str:
        return f"<html><body><h1>{template_name}</h1><pre>{context}</pre></body></html>"
    
    def _render_fallback_text(self, template_name: str, context: dict) -> str:
        return f"{template_name}\n\n{str(context)}"

template_service = TemplateService()
