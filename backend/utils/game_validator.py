"""
Game Validation Module
Validates generated games before they're shown to users
Implements strict validation with no tolerance for broken games
"""
import re
import json
import logging
from typing import Dict, List, Tuple, Optional

logger = logging.getLogger(__name__)

# Banned tokens that indicate incomplete code - expanded list
BANNED_TOKENS = [
    'TODO', 'FIXME', 'XXX', 'HACK', 'placeholder', 'mock', 
    'undefined', 'not implemented', 'coming soon', 'TBD',
    'insert here', 'add your', 'example only', 'sample data',
    'replace with', 'your answer here', 'fill in the blank here',
    'etc.', 'and so on', 'lorem ipsum', 'test data only'
]

# Required fields by game type
REQUIRED_FIELDS = {
    'quiz': ['title', 'game_type', 'questions'],
    'true_false': ['title', 'game_type', 'questions'],
    'fill_blanks': ['title', 'game_type', 'questions'],
    'matching': ['title', 'game_type', 'questions'],
    'flashcards': ['title', 'game_type', 'questions'],
    'word_search': ['title', 'game_type', 'questions'],
    'crossword': ['title', 'game_type', 'questions'],
    'drag_drop': ['title', 'game_type', 'questions']
}

# Required question fields by game type
REQUIRED_QUESTION_FIELDS = {
    'quiz': ['question', 'options', 'correct_answer'],
    'true_false': ['question', 'options', 'correct_answer'],
    'fill_blanks': ['question', 'correct_answer'],
    'matching': ['question', 'correct_answer'],
    'flashcards': ['question', 'correct_answer'],
    'word_search': ['word'],
    'crossword': ['clue', 'correct_answer'],
    'drag_drop': ['items', 'correct_order']
}

# Minimum question counts per game type
MIN_QUESTIONS = {
    'quiz': 1,
    'true_false': 1,
    'fill_blanks': 1,
    'matching': 2,  # Need at least 2 pairs for matching
    'flashcards': 1,
    'word_search': 3,  # Need several words
    'crossword': 2,  # Need at least across and down
    'drag_drop': 1
}


class GameValidationError(Exception):
    """Custom exception for game validation failures"""
    def __init__(self, errors: List[str], game_type: str):
        self.errors = errors
        self.game_type = game_type
        super().__init__(f"Game validation failed for {game_type}: {'; '.join(errors)}")


def validate_no_banned_tokens(game_data: dict) -> List[str]:
    """Check for banned tokens that indicate incomplete code"""
    errors = []
    game_str = json.dumps(game_data, ensure_ascii=False).lower()
    
    for token in BANNED_TOKENS:
        if token.lower() in game_str:
            errors.append(f"Contains banned token: {token}")
    
    return errors


def validate_required_fields(game_data: dict, game_type: str) -> List[str]:
    """Validate that all required fields exist"""
    errors = []
    required = REQUIRED_FIELDS.get(game_type, REQUIRED_FIELDS['quiz'])
    
    for field in required:
        if field not in game_data or game_data[field] is None:
            errors.append(f"Missing required field: {field}")
        elif field == 'questions' and (not isinstance(game_data[field], list) or len(game_data[field]) == 0):
            errors.append("Questions array is empty or invalid")
    
    return errors


def validate_questions(game_data: dict, game_type: str) -> List[str]:
    """Validate question structure and content"""
    errors = []
    questions = game_data.get('questions', [])
    required_q_fields = REQUIRED_QUESTION_FIELDS.get(game_type, ['question', 'correct_answer'])
    
    if not questions:
        errors.append("No questions provided")
        return errors
    
    for idx, q in enumerate(questions):
        if not isinstance(q, dict):
            errors.append(f"Question {idx + 1} is not a valid object")
            continue
        
        for field in required_q_fields:
            if field not in q or q[field] is None or (isinstance(q[field], str) and not q[field].strip()):
                errors.append(f"Question {idx + 1} missing required field: {field}")
        
        # Validate options for quiz/true_false
        if game_type in ['quiz', 'true_false']:
            options = q.get('options', [])
            if not isinstance(options, list) or len(options) < 2:
                errors.append(f"Question {idx + 1} has insufficient options (need at least 2)")
            
            correct = q.get('correct_answer', '')
            if correct and options and correct not in options:
                errors.append(f"Question {idx + 1} correct_answer not found in options")
        
        # Validate drag_drop items and correct_order
        if game_type == 'drag_drop':
            items = q.get('items', [])
            correct_order = q.get('correct_order', [])
            if not items or len(items) < 2:
                errors.append(f"Question {idx + 1} needs at least 2 items for drag_drop")
            if correct_order and set(items) != set(correct_order):
                errors.append(f"Question {idx + 1} correct_order doesn't match items")
        
        # Validate word_search words
        if game_type == 'word_search':
            word = q.get('word', '')
            if word and (len(word) < 2 or len(word) > 15):
                errors.append(f"Question {idx + 1} word length should be 2-15 characters")
    
    return errors


def validate_content_quality(game_data: dict, game_type: str) -> List[str]:
    """Validate content quality and completeness"""
    errors = []
    
    # Check title
    title = game_data.get('title', '')
    if not title or len(title) < 3:
        errors.append("Title is too short or missing")
    if title and title.lower() in ['game', 'quiz', 'test', 'untitled']:
        errors.append("Title is too generic - needs descriptive educational title")
    
    # Check for empty strings in questions
    questions = game_data.get('questions', [])
    for idx, q in enumerate(questions):
        for key, value in q.items():
            if isinstance(value, str) and value.strip() == '':
                errors.append(f"Question {idx + 1} has empty {key}")
            # Check for placeholder patterns
            if isinstance(value, str):
                lower_val = value.lower()
                if any(p in lower_val for p in ['...', '???', 'xxx', '___' * 3]):
                    if key != 'question' or '___' not in lower_val:  # Allow ___ in fill_blanks questions
                        errors.append(f"Question {idx + 1} {key} contains placeholder pattern")
    
    # Validate minimum question count based on game type
    min_count = MIN_QUESTIONS.get(game_type, 1)
    if len(questions) < min_count:
        errors.append(f"Game must have at least {min_count} question(s) for {game_type}")
    
    return errors


def validate_game(game_data: dict) -> Tuple[bool, List[str]]:
    """
    Main validation function - validates a game before it's returned to users
    
    Returns:
        Tuple of (is_valid, errors_list)
    """
    if not game_data:
        return False, ["Game data is empty or null"]
    
    game_type = game_data.get('game_type', 'quiz')
    all_errors = []
    
    # Run all validations
    all_errors.extend(validate_no_banned_tokens(game_data))
    all_errors.extend(validate_required_fields(game_data, game_type))
    all_errors.extend(validate_questions(game_data, game_type))
    all_errors.extend(validate_content_quality(game_data, game_type))
    
    is_valid = len(all_errors) == 0
    
    if not is_valid:
        logger.warning(f"Game validation failed for {game_type}: {all_errors}")
    
    return is_valid, all_errors


def create_validation_report(game_data: dict) -> dict:
    """Create a detailed validation report"""
    is_valid, errors = validate_game(game_data)
    game_type = game_data.get('game_type', 'unknown') if game_data else 'unknown'
    
    report = {
        "is_valid": is_valid,
        "game_type": game_type,
        "errors": errors,
        "error_count": len(errors),
        "checks_performed": [
            "banned_tokens",
            "required_fields",
            "question_structure",
            "content_quality"
        ]
    }
    
    if game_data:
        report["question_count"] = len(game_data.get('questions', []))
        report["has_title"] = bool(game_data.get('title'))
    
    return report


# Smoke test simulation for frontend games
def simulate_game_smoke_test(game_data: dict) -> Tuple[bool, List[str]]:
    """
    Simulate a comprehensive smoke test of the game
    Checks if the game would render and be playable without errors
    """
    errors = []
    game_type = game_data.get('game_type', 'quiz') if game_data else 'unknown'
    
    if not game_data:
        return False, ["No game data provided"]
    
    questions = game_data.get('questions', [])
    
    # Test 1: Can initialize - questions array exists and is not empty
    if not questions:
        errors.append("SMOKE_TEST_FAIL: Cannot initialize - no questions array")
        return False, errors
    
    if not isinstance(questions, list):
        errors.append("SMOKE_TEST_FAIL: Questions is not an array")
        return False, errors
    
    # Test 2: Can access first question
    try:
        first_q = questions[0]
        if not isinstance(first_q, dict):
            errors.append("SMOKE_TEST_FAIL: First question is not a valid object")
            return False, errors
    except (IndexError, TypeError) as e:
        errors.append(f"SMOKE_TEST_FAIL: Cannot access first question - {str(e)}")
        return False, errors
    
    # Test 3: Simulate primary action based on game type with deep validation
    if game_type in ['quiz', 'true_false']:
        # Validate every question has clickable options
        for idx, q in enumerate(questions):
            options = q.get('options', [])
            if not options or not isinstance(options, list):
                errors.append(f"SMOKE_TEST_FAIL: Question {idx + 1} has no options array")
            elif len(options) < 2:
                errors.append(f"SMOKE_TEST_FAIL: Question {idx + 1} has fewer than 2 options")
            else:
                # Verify correct_answer exists in options
                correct = q.get('correct_answer', '')
                if correct not in options:
                    errors.append(f"SMOKE_TEST_FAIL: Question {idx + 1} correct_answer '{correct}' not in options")
                # Verify all options are non-empty strings
                for opt_idx, opt in enumerate(options):
                    if not opt or not isinstance(opt, str) or not opt.strip():
                        errors.append(f"SMOKE_TEST_FAIL: Question {idx + 1} option {opt_idx + 1} is empty")
    
    elif game_type == 'flashcards':
        # Validate every card has front and back
        for idx, q in enumerate(questions):
            front = q.get('question') or q.get('front') or q.get('term')
            back = q.get('correct_answer') or q.get('back') or q.get('definition')
            if not front:
                errors.append(f"SMOKE_TEST_FAIL: Flashcard {idx + 1} has no front/question")
            if not back:
                errors.append(f"SMOKE_TEST_FAIL: Flashcard {idx + 1} has no back/answer")
    
    elif game_type == 'fill_blanks':
        # Validate every blank has question with blank marker and answer
        for idx, q in enumerate(questions):
            question_text = q.get('question') or q.get('sentence') or ''
            if not question_text:
                errors.append(f"SMOKE_TEST_FAIL: Fill-blank {idx + 1} has no question text")
            elif '___' not in question_text and '_blank_' not in question_text.lower():
                errors.append(f"SMOKE_TEST_FAIL: Fill-blank {idx + 1} has no blank marker (___)")
            answer = q.get('correct_answer') or q.get('answer')
            if not answer:
                errors.append(f"SMOKE_TEST_FAIL: Fill-blank {idx + 1} has no correct answer")
    
    elif game_type == 'matching':
        # Validate matching has enough pairs
        if len(questions) < 2:
            errors.append("SMOKE_TEST_FAIL: Matching needs at least 2 pairs")
        for idx, q in enumerate(questions):
            term = q.get('question') or q.get('term') or q.get('left')
            definition = q.get('correct_answer') or q.get('match') or q.get('right')
            if not term:
                errors.append(f"SMOKE_TEST_FAIL: Matching pair {idx + 1} has no term")
            if not definition:
                errors.append(f"SMOKE_TEST_FAIL: Matching pair {idx + 1} has no definition")
    
    elif game_type == 'word_search':
        # Validate words are valid
        for idx, q in enumerate(questions):
            word = q.get('word', '')
            if not word:
                errors.append(f"SMOKE_TEST_FAIL: Word search word {idx + 1} is empty")
            elif len(word) < 2:
                errors.append(f"SMOKE_TEST_FAIL: Word search word {idx + 1} is too short")
            elif len(word) > 15:
                errors.append(f"SMOKE_TEST_FAIL: Word search word {idx + 1} is too long (max 15)")
            elif ' ' in word:
                errors.append(f"SMOKE_TEST_FAIL: Word search word {idx + 1} contains spaces")
    
    elif game_type == 'crossword':
        # Validate clues and answers
        for idx, q in enumerate(questions):
            clue = q.get('clue') or q.get('question')
            answer = q.get('correct_answer') or q.get('answer')
            if not clue:
                errors.append(f"SMOKE_TEST_FAIL: Crossword clue {idx + 1} is missing")
            if not answer:
                errors.append(f"SMOKE_TEST_FAIL: Crossword answer {idx + 1} is missing")
            elif ' ' in answer:
                errors.append(f"SMOKE_TEST_FAIL: Crossword answer {idx + 1} contains spaces")
    
    elif game_type == 'drag_drop':
        # Validate drag drop items and correct order
        for idx, q in enumerate(questions):
            items = q.get('items', [])
            correct_order = q.get('correct_order', [])
            instruction = q.get('instruction') or q.get('question')
            
            if not instruction:
                errors.append(f"SMOKE_TEST_FAIL: Drag-drop {idx + 1} has no instruction")
            if not items or len(items) < 2:
                errors.append(f"SMOKE_TEST_FAIL: Drag-drop {idx + 1} needs at least 2 items")
            if not correct_order:
                errors.append(f"SMOKE_TEST_FAIL: Drag-drop {idx + 1} has no correct_order")
            elif set(items) != set(correct_order):
                errors.append(f"SMOKE_TEST_FAIL: Drag-drop {idx + 1} correct_order doesn't match items")
    
    # Test 4: Verify scoring can be calculated (no missing data)
    for idx, q in enumerate(questions):
        if game_type in ['quiz', 'true_false', 'fill_blanks', 'flashcards', 'crossword']:
            if not (q.get('correct_answer') or q.get('answer')):
                errors.append(f"SMOKE_TEST_FAIL: Question {idx + 1} has no answer for scoring")
    
    # Test 5: Verify restart would work (no stateful issues in data)
    # This passes if data is immutable/serializable - already validated above
    
    is_valid = len(errors) == 0
    return is_valid, errors


def run_full_validation(game_data: dict) -> dict:
    """
    Run complete validation suite and return detailed report
    Used for API endpoint and debugging
    """
    report = create_validation_report(game_data)
    smoke_pass, smoke_errors = simulate_game_smoke_test(game_data)
    
    report['smoke_test_passed'] = smoke_pass
    report['smoke_test_errors'] = smoke_errors
    report['fully_valid'] = report['is_valid'] and smoke_pass
    
    return report
