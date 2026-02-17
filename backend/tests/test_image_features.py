"""
Test Image Features for Presentation Creator
Tests the image search API endpoint and related functionality
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test session token - created in MongoDB
TEST_SESSION_TOKEN = "test_session_1771365916309"


class TestImageSearchAPI:
    """Test the image search API endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.cookies.set('session_token', TEST_SESSION_TOKEN)
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_image_search_returns_images(self):
        """Test that image search returns 12 images by default"""
        response = self.session.get(f"{BASE_URL}/api/ai/images/search", params={"query": "ocean"})
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "images" in data, "Response should contain 'images' key"
        assert "query" in data, "Response should contain 'query' key"
        assert data["query"] == "ocean", "Query should match input"
        assert len(data["images"]) == 12, f"Expected 12 images, got {len(data['images'])}"
    
    def test_image_search_custom_count(self):
        """Test that image search respects count parameter"""
        response = self.session.get(f"{BASE_URL}/api/ai/images/search", params={"query": "nature", "count": 6})
        
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["images"]) == 6, f"Expected 6 images, got {len(data['images'])}"
    
    def test_image_search_returns_valid_urls(self):
        """Test that returned images have valid picsum.photos URLs"""
        response = self.session.get(f"{BASE_URL}/api/ai/images/search", params={"query": "science"})
        
        assert response.status_code == 200
        
        data = response.json()
        for img in data["images"]:
            assert "id" in img, "Image should have 'id' field"
            assert "url" in img, "Image should have 'url' field"
            assert "thumb" in img, "Image should have 'thumb' field"
            assert "alt" in img, "Image should have 'alt' field"
            
            # Verify URL format
            assert img["url"].startswith("https://picsum.photos/seed/"), f"Invalid URL format: {img['url']}"
            assert "/800/600" in img["url"], "URL should have 800x600 dimensions"
            assert img["thumb"].startswith("https://picsum.photos/seed/"), f"Invalid thumb URL format: {img['thumb']}"
            assert "/300/200" in img["thumb"], "Thumb URL should have 300x200 dimensions"
    
    def test_image_search_deterministic_results(self):
        """Test that same query returns same images (deterministic)"""
        response1 = self.session.get(f"{BASE_URL}/api/ai/images/search", params={"query": "math"})
        response2 = self.session.get(f"{BASE_URL}/api/ai/images/search", params={"query": "math"})
        
        assert response1.status_code == 200
        assert response2.status_code == 200
        
        data1 = response1.json()
        data2 = response2.json()
        
        # Same query should return same images
        assert data1["images"][0]["id"] == data2["images"][0]["id"], "Same query should return same images"
    
    def test_image_search_different_queries_different_results(self):
        """Test that different queries return different images"""
        response1 = self.session.get(f"{BASE_URL}/api/ai/images/search", params={"query": "cats"})
        response2 = self.session.get(f"{BASE_URL}/api/ai/images/search", params={"query": "dogs"})
        
        assert response1.status_code == 200
        assert response2.status_code == 200
        
        data1 = response1.json()
        data2 = response2.json()
        
        # Different queries should return different images
        assert data1["images"][0]["id"] != data2["images"][0]["id"], "Different queries should return different images"
    
    def test_image_search_requires_auth(self):
        """Test that image search requires authentication"""
        # Create a new session without auth
        no_auth_session = requests.Session()
        response = no_auth_session.get(f"{BASE_URL}/api/ai/images/search", params={"query": "test"})
        
        assert response.status_code == 401, f"Expected 401 for unauthenticated request, got {response.status_code}"
    
    def test_image_upload_endpoint_exists(self):
        """Test that image upload endpoint exists and returns info"""
        response = self.session.post(f"{BASE_URL}/api/ai/images/upload")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "message" in data, "Response should contain message"
        assert "base64" in data["message"].lower(), "Message should mention base64"


class TestImageURLValidation:
    """Test image URL validation scenarios"""
    
    def test_picsum_url_accessible(self):
        """Test that picsum.photos URLs are accessible"""
        # Test a sample picsum URL
        response = requests.get("https://picsum.photos/seed/test123/800/600", allow_redirects=True, timeout=10)
        
        # Picsum returns 302 redirect to actual image
        assert response.status_code == 200, f"Picsum URL should be accessible, got {response.status_code}"
        assert "image" in response.headers.get("content-type", ""), "Response should be an image"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
