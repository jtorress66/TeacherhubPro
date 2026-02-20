"""
Routes Package
All API route modules for TeacherHubPro
"""
from .auth import router as auth_router
from .ai import router as ai_router
from .games import router as games_router, init_games_routes
from .adaptive_learning import router as adaptive_learning_router, init_adaptive_learning_routes
from .portal import router as portal_router, init_portal_routes

__all__ = [
    'auth_router',
    'ai_router', 
    'games_router',
    'init_games_routes',
    'adaptive_learning_router',
    'init_adaptive_learning_routes',
    'portal_router',
    'init_portal_routes'
]
