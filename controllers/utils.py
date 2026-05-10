# -*- coding: utf-8 -*-
"""Shared helpers for all Traveloop controllers."""
import json
import functools
from odoo.http import request, Response


def cors_headers():
    """Return CORS headers allowing the React dev server."""
    return {
        'Access-Control-Allow-Origin': 'http://localhost:8080',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Content-Type': 'application/json',
    }


def json_response(data, status=200):
    """Return a JSON HTTP response with CORS headers."""
    body = json.dumps(data, default=str)
    return Response(body, status=status, headers=cors_headers())


def require_auth(fn):
    """Decorator: return 401 if no active session."""
    @functools.wraps(fn)
    def wrapper(*args, **kwargs):
        if not request.session.uid:
            return json_response({'error': 'Authentication required'}, 401)
        return fn(*args, **kwargs)
    return wrapper


def get_body():
    """Parse JSON body from current request."""
    try:
        return json.loads(request.httprequest.data or '{}')
    except Exception:
        return {}
