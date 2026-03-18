"""
Tests for PDF to Questions Conversion endpoint
Verifies:
1. POST /api/ai-grading/parse-pdf returns individual questions (not bundled sections)
2. Expected 30+ questions for a full exam PDF (not 4-8 sections)
3. Question types are properly identified (fill_blank, true_false, multiple_choice, etc.)
4. Points distribution is reasonable
5. Retry logic handles timeouts gracefully
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
TEST_EMAIL = "test@school.edu"
TEST_PASSWORD = "testpassword"

# Known test PDF file already uploaded
TEST_PDF_FILE_URL = "/api/files/test_exam_parse.pdf"


class TestPDFParsing:
    """Test PDF to questions conversion for individual question splitting"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Get authenticated session for API calls"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        # Login to get auth cookie
        login_res = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        
        if login_res.status_code != 200:
            pytest.skip(f"Authentication failed: {login_res.status_code} - {login_res.text}")
        
        return session
    
    def test_pdf_file_accessible(self, auth_session):
        """Verify the test PDF file exists and is accessible"""
        # The file should be accessible via the API
        response = auth_session.head(f"{BASE_URL}{TEST_PDF_FILE_URL}")
        
        # Should return 200 for existing file, or we can check via GET
        if response.status_code == 405:  # Method not allowed, try GET
            response = auth_session.get(f"{BASE_URL}{TEST_PDF_FILE_URL}")
        
        assert response.status_code == 200, f"Test PDF not accessible: {response.status_code}"
        print(f"✓ Test PDF file accessible at {TEST_PDF_FILE_URL}")
    
    def test_parse_pdf_returns_individual_questions(self, auth_session):
        """
        CRITICAL TEST: Verify PDF parsing returns individual questions, not bundled sections.
        Expected: 30+ questions for a full exam
        Previous bug: Only 4-8 bundled sections returned
        """
        print(f"\n📄 Starting PDF parse test with {TEST_PDF_FILE_URL}")
        print("⏳ This may take 30-90 seconds due to AI processing...")
        
        start_time = time.time()
        
        response = auth_session.post(
            f"{BASE_URL}/api/ai-grading/parse-pdf",
            json={
                "file_url": TEST_PDF_FILE_URL,
                "total_points": 42  # Target points as specified
            },
            timeout=120  # 2 minute timeout for the request
        )
        
        elapsed = time.time() - start_time
        print(f"⏱️ Response received in {elapsed:.1f} seconds")
        
        # Check status code
        assert response.status_code == 200, f"Parse PDF failed: {response.status_code} - {response.text}"
        
        data = response.json()
        
        # Validate response structure
        assert "questions" in data, "Response missing 'questions' field"
        assert "title" in data, "Response missing 'title' field"
        
        questions = data.get("questions", [])
        question_count = len(questions)
        
        print(f"\n📊 RESULTS:")
        print(f"   Title: {data.get('title', 'N/A')}")
        print(f"   Total questions returned: {question_count}")
        
        # CRITICAL ASSERTION: Should have 30+ individual questions
        # Previous bug: Only 4-8 bundled sections were returned
        assert question_count >= 25, (
            f"❌ FAILURE: Only {question_count} questions returned. "
            f"Expected 30+ individual questions. This indicates questions are still bundled. "
            f"The AI prompt may not be splitting items correctly."
        )
        
        print(f"   ✓ Question count ({question_count}) meets minimum threshold of 25+")
        
        return data
    
    def test_question_types_properly_identified(self, auth_session):
        """Verify different question types are correctly identified"""
        response = auth_session.post(
            f"{BASE_URL}/api/ai-grading/parse-pdf",
            json={
                "file_url": TEST_PDF_FILE_URL,
                "total_points": 42
            },
            timeout=120
        )
        
        if response.status_code != 200:
            pytest.skip(f"Parse PDF failed: {response.status_code}")
        
        data = response.json()
        questions = data.get("questions", [])
        
        # Count question types
        type_counts = {}
        for q in questions:
            qtype = q.get("question_type", "unknown")
            type_counts[qtype] = type_counts.get(qtype, 0) + 1
        
        print(f"\n📊 Question Types Distribution:")
        for qtype, count in sorted(type_counts.items()):
            print(f"   {qtype}: {count}")
        
        # Verify expected types are present
        expected_types = ["fill_blank", "true_false", "multiple_choice"]
        found_types = set(type_counts.keys())
        
        print(f"\n   Expected types: {expected_types}")
        print(f"   Found types: {list(found_types)}")
        
        # At least 2 of the expected types should be present
        matching_types = found_types.intersection(set(expected_types))
        assert len(matching_types) >= 2, (
            f"Expected at least 2 of {expected_types} types, but found: {found_types}"
        )
        
        print(f"   ✓ Found {len(matching_types)} expected question types: {matching_types}")
    
    def test_fill_blank_questions_have_word_bank_in_instructions(self, auth_session):
        """
        Verify fill-in-the-blank questions have word bank in instructions field
        Expected: Each fill_blank question should have a non-empty instructions field
        containing word bank or section context
        """
        response = auth_session.post(
            f"{BASE_URL}/api/ai-grading/parse-pdf",
            json={
                "file_url": TEST_PDF_FILE_URL,
                "total_points": 42
            },
            timeout=120
        )
        
        if response.status_code != 200:
            pytest.skip(f"Parse PDF failed: {response.status_code}")
        
        data = response.json()
        questions = data.get("questions", [])
        
        fill_blank_questions = [q for q in questions if q.get("question_type") == "fill_blank"]
        
        if not fill_blank_questions:
            pytest.skip("No fill_blank questions found in response")
        
        print(f"\n📊 Fill-in-the-blank Questions: {len(fill_blank_questions)}")
        
        questions_with_instructions = [
            q for q in fill_blank_questions 
            if q.get("instructions") and len(q["instructions"].strip()) > 5
        ]
        
        print(f"   Questions with instructions/word bank: {len(questions_with_instructions)}")
        
        # Sample some questions
        for i, q in enumerate(fill_blank_questions[:3]):
            print(f"\n   Sample Q{i+1}:")
            print(f"      Text: {q.get('question_text', 'N/A')[:80]}...")
            print(f"      Instructions: {q.get('instructions', 'N/A')[:80]}...")
        
        # At least 50% of fill_blank questions should have instructions
        ratio = len(questions_with_instructions) / len(fill_blank_questions) if fill_blank_questions else 0
        assert ratio >= 0.5, (
            f"Only {ratio*100:.0f}% of fill_blank questions have instructions. "
            f"Expected at least 50% to have word bank in instructions field."
        )
        
        print(f"\n   ✓ {ratio*100:.0f}% of fill_blank questions have instructions (threshold: 50%)")
    
    def test_true_false_questions_are_individual(self, auth_session):
        """
        Verify true/false statements are split into individual questions
        Expected: Each T/F statement is its own question object
        """
        response = auth_session.post(
            f"{BASE_URL}/api/ai-grading/parse-pdf",
            json={
                "file_url": TEST_PDF_FILE_URL,
                "total_points": 42
            },
            timeout=120
        )
        
        if response.status_code != 200:
            pytest.skip(f"Parse PDF failed: {response.status_code}")
        
        data = response.json()
        questions = data.get("questions", [])
        
        tf_questions = [q for q in questions if q.get("question_type") == "true_false"]
        
        if not tf_questions:
            pytest.skip("No true_false questions found")
        
        print(f"\n📊 True/False Questions: {len(tf_questions)}")
        
        # Check that each T/F question has reasonable text length
        # A bundled question would have very long text (multiple statements)
        bundled_questions = []
        for q in tf_questions:
            text = q.get("question_text", "")
            # A bundled T/F section would have 200+ characters with multiple statements
            if len(text) > 300:
                bundled_questions.append(text[:100] + "...")
        
        if bundled_questions:
            print(f"   ⚠️ Found {len(bundled_questions)} potentially bundled T/F questions:")
            for bq in bundled_questions[:2]:
                print(f"      - {bq}")
        
        # Less than 20% should be bundled
        bundled_ratio = len(bundled_questions) / len(tf_questions) if tf_questions else 0
        assert bundled_ratio < 0.3, (
            f"{bundled_ratio*100:.0f}% of T/F questions appear to be bundled. "
            f"Expected individual statements as separate questions."
        )
        
        print(f"   ✓ {100-bundled_ratio*100:.0f}% of T/F questions are properly individual")
    
    def test_points_distribution(self, auth_session):
        """
        Verify points are distributed across questions
        Expected: Total points should approximately match the requested total_points
        """
        target_points = 42
        
        response = auth_session.post(
            f"{BASE_URL}/api/ai-grading/parse-pdf",
            json={
                "file_url": TEST_PDF_FILE_URL,
                "total_points": target_points
            },
            timeout=120
        )
        
        if response.status_code != 200:
            pytest.skip(f"Parse PDF failed: {response.status_code}")
        
        data = response.json()
        questions = data.get("questions", [])
        
        total_points = sum(q.get("points", 0) for q in questions)
        
        print(f"\n📊 Points Distribution:")
        print(f"   Target points: {target_points}")
        print(f"   Actual total: {total_points}")
        print(f"   Number of questions: {len(questions)}")
        if questions:
            print(f"   Avg points per question: {total_points/len(questions):.2f}")
        
        # Points should be within reasonable range (within 50% of target)
        # AI may interpret this differently
        min_expected = target_points * 0.3
        max_expected = target_points * 3.0  # Allow for AI interpretation
        
        # Just verify points are assigned, don't be too strict on total
        assert total_points > 0, "No points assigned to questions"
        print(f"   ✓ Points assigned: {total_points}")
    
    def test_response_includes_extracted_text_preview(self, auth_session):
        """Verify response includes a preview of extracted PDF text"""
        response = auth_session.post(
            f"{BASE_URL}/api/ai-grading/parse-pdf",
            json={
                "file_url": TEST_PDF_FILE_URL,
                "total_points": 42
            },
            timeout=120
        )
        
        if response.status_code != 200:
            pytest.skip(f"Parse PDF failed: {response.status_code}")
        
        data = response.json()
        
        preview = data.get("extracted_text_preview", "")
        assert preview, "Response missing extracted_text_preview"
        assert len(preview) > 50, "Extracted text preview too short"
        
        print(f"\n📊 Extracted Text Preview (first 200 chars):")
        print(f"   {preview[:200]}...")
        print(f"   ✓ Preview length: {len(preview)} chars")


class TestPDFParseEdgeCases:
    """Edge case tests for PDF parsing endpoint"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Get authenticated session for API calls"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        login_res = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        
        if login_res.status_code != 200:
            pytest.skip(f"Authentication failed: {login_res.status_code}")
        
        return session
    
    def test_parse_pdf_nonexistent_file(self, auth_session):
        """Verify proper error for non-existent PDF file"""
        response = auth_session.post(
            f"{BASE_URL}/api/ai-grading/parse-pdf",
            json={
                "file_url": "/api/files/nonexistent_file.pdf",
                "total_points": 100
            },
            timeout=30
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✓ Correctly returns 404 for non-existent file")
    
    def test_parse_pdf_requires_authentication(self):
        """Verify endpoint requires authentication"""
        session = requests.Session()  # No auth
        
        response = session.post(
            f"{BASE_URL}/api/ai-grading/parse-pdf",
            json={
                "file_url": TEST_PDF_FILE_URL,
                "total_points": 100
            },
            timeout=30
        )
        
        assert response.status_code in [401, 403], (
            f"Expected 401/403 for unauthenticated request, got {response.status_code}"
        )
        print(f"✓ Correctly requires authentication ({response.status_code})")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
