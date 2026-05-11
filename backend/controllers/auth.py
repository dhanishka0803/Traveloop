# -*- coding: utf-8 -*-
"""
Auth endpoints:
  POST /api/auth/login
  POST /api/auth/signup
  POST /api/auth/logout
  POST /api/auth/forgot-password
"""
import json
import logging
from odoo import http, SUPERUSER_ID
from odoo.http import request
from .utils import json_response, cors_headers, require_auth

_logger = logging.getLogger(__name__)


class AuthController(http.Controller):

    # ------------------------------------------------------------------ #
    #  CORS pre-flight                                                     #
    # ------------------------------------------------------------------ #
    @http.route('/api/auth/<path:subpath>', type='http', auth='none',
                methods=['OPTIONS'], csrf=False)
    def auth_options(self, **kw):
        return request.make_response('', headers=cors_headers())

    # ------------------------------------------------------------------ #
    #  POST /api/auth/login                                                #
    # ------------------------------------------------------------------ #
    @http.route('/api/auth/login', type='http', auth='none',
                methods=['POST'], csrf=False)
    def login(self, **kw):
        try:
            body = json.loads(request.httprequest.data or '{}')
            email = body.get('email', '').strip()
            password = body.get('password', '')
            if not email or not password:
                return json_response({'error': 'email and password required'}, 400)

            db = request.db
            uid = request.session.authenticate(db, email, password)
            if not uid:
                return json_response({'error': 'Invalid credentials'}, 401)

            user = request.env['res.users'].sudo().browse(uid)
            return json_response({
                'success': True,
                'user': user.get_profile_data(),
                'session_id': request.session.sid,
            })
        except Exception as e:
            _logger.exception('Login error')
            return json_response({'error': str(e)}, 500)

    # ------------------------------------------------------------------ #
    #  POST /api/auth/signup                                               #
    # ------------------------------------------------------------------ #
    @http.route('/api/auth/signup', type='http', auth='none',
                methods=['POST'], csrf=False)
    def signup(self, **kw):
        try:
            body = json.loads(request.httprequest.data or '{}')
            email = body.get('email', '').strip()
            password = body.get('password', '')
            full_name = body.get('full_name', email.split('@')[0])

            if not email or not password:
                return json_response({'error': 'email and password required'}, 400)

            env = request.env(user=SUPERUSER_ID)
            # Check duplicate
            existing = env['res.users'].search([('login', '=', email)], limit=1)
            if existing:
                return json_response({'error': 'Email already registered'}, 409)

            # Create portal user
            user = env['res.users'].create({
                'name': full_name,
                'login': email,
                'password': password,
                'groups_id': [(6, 0, [env.ref('base.group_portal').id])],
            })
            db = request.db
            uid = request.session.authenticate(db, email, password)
            return json_response({
                'success': True,
                'user': user.get_profile_data(),
                'session_id': request.session.sid,
            }, 201)
        except Exception as e:
            _logger.exception('Signup error')
            return json_response({'error': str(e)}, 500)

    # ------------------------------------------------------------------ #
    #  POST /api/auth/logout                                               #
    # ------------------------------------------------------------------ #
    @http.route('/api/auth/logout', type='http', auth='none',
                methods=['POST'], csrf=False)
    def logout(self, **kw):
        request.session.logout(keep_db=True)
        return json_response({'success': True})

    # ------------------------------------------------------------------ #
    #  POST /api/auth/forgot-password                                      #
    # ------------------------------------------------------------------ #
    @http.route('/api/auth/forgot-password', type='http', auth='none',
                methods=['POST'], csrf=False)
    def forgot_password(self, **kw):
        try:
            body = json.loads(request.httprequest.data or '{}')
            email = body.get('email', '').strip()
            if not email:
                return json_response({'error': 'email required'}, 400)

            env = request.env(user=SUPERUSER_ID)
            user = env['res.users'].search([('login', '=', email)], limit=1)
            if user:
                # Trigger Odoo's built-in reset password email
                user.action_reset_password()
            # Always return success to avoid email enumeration
            return json_response({
                'success': True,
                'message': 'If that email exists, a reset link has been sent.',
            })
        except Exception as e:
            _logger.exception('Forgot password error')
            return json_response({'error': str(e)}, 500)
