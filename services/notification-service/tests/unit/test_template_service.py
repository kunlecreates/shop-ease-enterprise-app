"""
Unit tests for TemplateService

Tests Jinja2 template rendering and fallback logic in isolation.
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from pathlib import Path
from app.services.template_service import TemplateService


class TestTemplateServiceRenderTemplate:
    """Test render_template method"""
    
    def test_render_template_success_with_html_and_text(self):
        """Should render both HTML and text templates successfully"""
        # Arrange
        mock_html_template = Mock()
        mock_html_template.render.return_value = "<html><body>Hello John</body></html>"
        
        mock_text_template = Mock()
        mock_text_template.render.return_value = "Hello John"
        
        mock_env = Mock()
        mock_env.get_template.side_effect = lambda name: (
            mock_html_template if name.endswith('.html') else mock_text_template
        )
        
        with patch('app.services.template_service.Environment', return_value=mock_env):
            service = TemplateService()
            
            # Act
            html_body, text_body = service.render_template(
                "welcome",
                {"name": "John"}
            )
            
            # Assert
            assert html_body == "<html><body>Hello John</body></html>"
            assert text_body == "Hello John"
            
            mock_html_template.render.assert_called_once_with(name="John")
            mock_text_template.render.assert_called_once_with(name="John")
    
    def test_render_template_fallback_when_html_template_missing(self):
        """Should use fallback HTML rendering when template not found"""
        # Arrange
        mock_env = Mock()
        mock_env.get_template.side_effect = Exception("Template not found")
        
        with patch('app.services.template_service.Environment', return_value=mock_env):
            service = TemplateService()
            
            # Act
            html_body, text_body = service.render_template(
                "missing_template",
                {"key": "value", "count": 42}
            )
            
            # Assert - should return fallback HTML with context data
            assert "<html>" in html_body
            assert "key" in html_body
            assert "value" in html_body
            assert "count" in html_body
            assert "42" in html_body
            
            # Fallback text should contain context data
            assert "key" in text_body
            assert "value" in text_body
            assert "count" in text_body
    
    def test_render_template_fallback_html_format(self):
        """Should generate properly formatted fallback HTML"""
        # Arrange
        service = TemplateService()
        
        # Act
        html = service._render_fallback_html("test_template", {"name": "Alice", "age": 30})
        
        # Assert
        assert html.startswith("<html>")
        assert "<body>" in html
        assert "test_template" in html
        assert "name" in html or "Alice" in html
        assert "age" in html or "30" in html
    
    def test_render_template_fallback_text_format(self):
        """Should generate properly formatted fallback text"""
        # Arrange
        service = TemplateService()
        
        # Act
        text = service._render_fallback_text("test_template", {"status": "active", "id": 123})
        
        # Assert
        assert "test_template" in text
        assert "status" in text or "active" in text
        assert "id" in text or "123" in text
    
    def test_render_template_with_empty_context(self):
        """Should handle empty context dictionary"""
        # Arrange
        mock_html_template = Mock()
        mock_html_template.render.return_value = "<html>Empty</html>"
        
        mock_text_template = Mock()
        mock_text_template.render.return_value = "Empty"
        
        mock_env = Mock()
        mock_env.get_template.side_effect = lambda name: (
            mock_html_template if name.endswith('.html') else mock_text_template
        )
        
        with patch('app.services.template_service.Environment', return_value=mock_env):
            service = TemplateService()
            
            # Act
            html_body, text_body = service.render_template("simple", {})
            
            # Assert
            assert html_body == "<html>Empty</html>"
            assert text_body == "Empty"
            
            mock_html_template.render.assert_called_once_with()
            mock_text_template.render.assert_called_once_with()
    
    def test_render_template_with_complex_context(self):
        """Should pass complex context objects to template"""
        # Arrange
        mock_html_template = Mock()
        mock_html_template.render.return_value = "<html>Complex</html>"
        
        mock_text_template = Mock()
        mock_text_template.render.return_value = "Complex"
        
        mock_env = Mock()
        mock_env.get_template.side_effect = lambda name: (
            mock_html_template if name.endswith('.html') else mock_text_template
        )
        
        complex_context = {
            "user": {"name": "Bob", "email": "bob@example.com"},
            "items": [{"id": 1, "name": "Item A"}, {"id": 2, "name": "Item B"}],
            "total": 99.99
        }
        
        with patch('app.services.template_service.Environment', return_value=mock_env):
            service = TemplateService()
            
            # Act
            html_body, text_body = service.render_template("order", complex_context)
            
            # Assert
            assert html_body == "<html>Complex</html>"
            assert text_body == "Complex"
            
            mock_html_template.render.assert_called_once_with(**complex_context)
            mock_text_template.render.assert_called_once_with(**complex_context)


class TestTemplateServiceTemplateDirectory:
    """Test template directory configuration"""
    
    def test_template_directory_points_to_app_templates(self):
        """Should configure Jinja2 to load templates from app/templates/"""
        # Arrange
        with patch('app.services.template_service.Environment') as MockEnv, \
             patch('app.services.template_service.FileSystemLoader') as MockLoader:
            
            # Act
            service = TemplateService()
            
            # Assert - FileSystemLoader should be called with templates directory
            MockLoader.assert_called_once()
            call_args = MockLoader.call_args[0][0]
            
            assert str(call_args).endswith("templates")
            assert "app" in str(call_args)
