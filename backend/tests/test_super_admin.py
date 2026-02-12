"""
Super Admin Panel API Tests
Tests for Schools and Users CRUD operations via Super Admin endpoints
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://teacherdash-2.preview.emergentagent.com').rstrip('/')

# Test credentials for super_admin user
TEST_EMAIL = "test@school.edu"
TEST_PASSWORD = "testpassword"


class TestSuperAdminAuth:
    """Test authentication for Super Admin"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token for super_admin user"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        # Extract token from cookies
        token = response.cookies.get('session_token')
        if not token:
            # Try to get from response headers
            for cookie in response.headers.get('set-cookie', '').split(';'):
                if 'session_token=' in cookie:
                    token = cookie.split('session_token=')[1].split(';')[0]
                    break
        
        # If still no token, the response might contain it
        if not token:
            # Use JWT from the login response
            import jwt
            data = response.json()
            # Generate a new token for testing
            response2 = requests.post(
                f"{BASE_URL}/api/auth/login",
                json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
            )
            # Get from set-cookie header
            set_cookie = response2.headers.get('set-cookie', '')
            if 'session_token=' in set_cookie:
                token = set_cookie.split('session_token=')[1].split(';')[0]
        
        assert token, "Failed to get auth token"
        return token
    
    def test_login_super_admin(self):
        """Test super_admin login"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        assert data['role'] == 'super_admin'
        assert data['email'] == TEST_EMAIL


class TestSuperAdminOverview:
    """Test Super Admin Overview endpoint"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        set_cookie = response.headers.get('set-cookie', '')
        if 'session_token=' in set_cookie:
            return set_cookie.split('session_token=')[1].split(';')[0]
        return None
    
    def test_get_overview(self, auth_token):
        """Test getting platform overview"""
        response = requests.get(
            f"{BASE_URL}/api/super-admin/overview",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify stats structure
        assert 'stats' in data
        assert 'total_schools' in data['stats']
        assert 'total_users' in data['stats']
        assert 'total_classes' in data['stats']
        assert 'total_students' in data['stats']
        
        # Verify schools list
        assert 'schools' in data
        assert isinstance(data['schools'], list)


class TestSuperAdminSchools:
    """Test Super Admin Schools CRUD operations"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        set_cookie = response.headers.get('set-cookie', '')
        if 'session_token=' in set_cookie:
            return set_cookie.split('session_token=')[1].split(';')[0]
        return None
    
    @pytest.fixture(scope="class")
    def test_school_id(self, auth_token):
        """Create a test school and return its ID"""
        unique_id = uuid.uuid4().hex[:8]
        school_data = {
            "name": f"TEST_School_{unique_id}",
            "address": "123 Test Street",
            "phone": "555-1234",
            "email": f"test_{unique_id}@school.edu",
            "logo_url": "",
            "primary_color": "#FF5733",
            "secondary_color": "#334155",
            "accent_color": "#F59E0B",
            "font_family": "Inter"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/super-admin/schools",
            json=school_data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        if response.status_code == 200:
            data = response.json()
            return data['school']['school_id']
        return None
    
    def test_get_all_schools(self, auth_token):
        """Test getting all schools"""
        response = requests.get(
            f"{BASE_URL}/api/super-admin/schools",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert 'schools' in data
        assert isinstance(data['schools'], list)
        
        # Verify school structure
        if len(data['schools']) > 0:
            school = data['schools'][0]
            assert 'school_id' in school
            assert 'name' in school
            assert 'user_count' in school
            assert 'class_count' in school
    
    def test_create_school(self, auth_token):
        """Test creating a new school"""
        unique_id = uuid.uuid4().hex[:8]
        school_data = {
            "name": f"TEST_New_School_{unique_id}",
            "address": "456 New Street",
            "phone": "555-5678",
            "email": f"new_{unique_id}@school.edu",
            "logo_url": "",
            "primary_color": "#65A30D",
            "secondary_color": "#334155",
            "accent_color": "#F59E0B",
            "font_family": "Manrope"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/super-admin/schools",
            json=school_data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert 'school' in data
        assert data['school']['name'] == school_data['name']
        assert 'school_id' in data['school']
        assert data['school']['branding']['primary_color'] == school_data['primary_color']
        
        # Cleanup - delete the test school
        school_id = data['school']['school_id']
        requests.delete(
            f"{BASE_URL}/api/super-admin/schools/{school_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
    
    def test_update_school(self, auth_token, test_school_id):
        """Test updating a school"""
        if not test_school_id:
            pytest.skip("No test school created")
        
        update_data = {
            "name": "TEST_Updated_School_Name",
            "address": "789 Updated Street",
            "primary_color": "#0000FF"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/super-admin/schools/{test_school_id}",
            json=update_data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data['school']['name'] == update_data['name']
        assert data['school']['address'] == update_data['address']
    
    def test_delete_school(self, auth_token, test_school_id):
        """Test deleting a school"""
        if not test_school_id:
            pytest.skip("No test school created")
        
        response = requests.delete(
            f"{BASE_URL}/api/super-admin/schools/{test_school_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        
        # Verify school is deleted
        response = requests.get(
            f"{BASE_URL}/api/super-admin/schools",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        data = response.json()
        school_ids = [s['school_id'] for s in data['schools']]
        assert test_school_id not in school_ids


class TestSuperAdminUsers:
    """Test Super Admin Users CRUD operations"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        set_cookie = response.headers.get('set-cookie', '')
        if 'session_token=' in set_cookie:
            return set_cookie.split('session_token=')[1].split(';')[0]
        return None
    
    @pytest.fixture(scope="class")
    def existing_school_id(self, auth_token):
        """Get an existing school ID for user creation"""
        response = requests.get(
            f"{BASE_URL}/api/super-admin/schools",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        if response.status_code == 200:
            data = response.json()
            if data['schools']:
                return data['schools'][0]['school_id']
        return "school_default"
    
    @pytest.fixture(scope="class")
    def test_user_id(self, auth_token, existing_school_id):
        """Create a test user and return its ID"""
        unique_id = uuid.uuid4().hex[:8]
        user_data = {
            "email": f"test_user_{unique_id}@test.edu",
            "name": f"TEST_User_{unique_id}",
            "password": "TestPassword123!",
            "school_id": existing_school_id,
            "role": "teacher"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/super-admin/users",
            json=user_data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        if response.status_code == 200:
            data = response.json()
            return data['user']['user_id']
        return None
    
    def test_get_all_users(self, auth_token):
        """Test getting all users"""
        response = requests.get(
            f"{BASE_URL}/api/super-admin/users",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert 'users' in data
        assert isinstance(data['users'], list)
        
        # Verify user structure
        if len(data['users']) > 0:
            user = data['users'][0]
            assert 'user_id' in user
            assert 'email' in user
            assert 'name' in user
            assert 'role' in user
            assert 'school_name' in user
    
    def test_create_user(self, auth_token, existing_school_id):
        """Test creating a new user"""
        unique_id = uuid.uuid4().hex[:8]
        user_data = {
            "email": f"new_user_{unique_id}@test.edu",
            "name": f"TEST_New_User_{unique_id}",
            "password": "NewPassword123!",
            "school_id": existing_school_id,
            "role": "teacher"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/super-admin/users",
            json=user_data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert 'user' in data
        assert data['user']['email'] == user_data['email']
        assert data['user']['name'] == user_data['name']
        assert data['user']['role'] == user_data['role']
        
        # Cleanup - delete the test user
        user_id = data['user']['user_id']
        requests.delete(
            f"{BASE_URL}/api/super-admin/users/{user_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
    
    def test_update_user(self, auth_token, test_user_id):
        """Test updating a user"""
        if not test_user_id:
            pytest.skip("No test user created")
        
        update_data = {
            "name": "TEST_Updated_User_Name"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/super-admin/users/{test_user_id}",
            json=update_data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data['user']['name'] == update_data['name']
    
    def test_reset_password(self, auth_token, test_user_id):
        """Test resetting a user's password"""
        if not test_user_id:
            pytest.skip("No test user created")
        
        response = requests.post(
            f"{BASE_URL}/api/super-admin/users/{test_user_id}/reset-password",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert 'temporary_password' in data
        assert len(data['temporary_password']) > 0
    
    def test_delete_user(self, auth_token, test_user_id):
        """Test deleting a user"""
        if not test_user_id:
            pytest.skip("No test user created")
        
        response = requests.delete(
            f"{BASE_URL}/api/super-admin/users/{test_user_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        
        # Verify user is deleted
        response = requests.get(
            f"{BASE_URL}/api/super-admin/users",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        data = response.json()
        user_ids = [u['user_id'] for u in data['users']]
        assert test_user_id not in user_ids
    
    def test_cannot_delete_super_admin_self(self, auth_token):
        """Test that super_admin cannot delete themselves"""
        # Get current user ID
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        current_user_id = response.json()['user_id']
        
        # Try to delete self
        response = requests.delete(
            f"{BASE_URL}/api/super-admin/users/{current_user_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 400
        assert "Cannot delete yourself" in response.json().get('detail', '')


class TestSuperAdminAccessControl:
    """Test access control for Super Admin endpoints"""
    
    def test_unauthorized_access_overview(self):
        """Test that unauthenticated users cannot access overview"""
        response = requests.get(f"{BASE_URL}/api/super-admin/overview")
        assert response.status_code == 401
    
    def test_unauthorized_access_schools(self):
        """Test that unauthenticated users cannot access schools"""
        response = requests.get(f"{BASE_URL}/api/super-admin/schools")
        assert response.status_code == 401
    
    def test_unauthorized_access_users(self):
        """Test that unauthenticated users cannot access users"""
        response = requests.get(f"{BASE_URL}/api/super-admin/users")
        assert response.status_code == 401


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
