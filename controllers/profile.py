# -*- coding: utf-8 -*-
"""
Profile endpoints:
  GET    /api/profile
  PUT    /api/profile
  DELETE /api/profile
"""
import logging
from odoo import http
from odoo.http import request
from .utils import json_response, cors_headers, require_auth, get_body

_logger = logging.getLogger(__name__)


class ProfileController(http.Controller):

    @http.route('/api/profile', type='http', auth='none',
                methods=['OPTIONS'], csrf=False)
    def profile_options(self, **kw):
        return request.make_response('', headers=cors_headers())

    @http.route('/api/profile', type='http', auth='none',
                methods=['GET'], csrf=False)
    @require_auth
    def get_profile(self, **kw):
        try:
            user = request.env['res.users'].sudo().browse(request.session.uid)
            return json_response(user.get_profile_data())
        except Exception as e:
            _logger.exception('Get profile error')
            return json_response({'error': str(e)}, 500)

    @http.route('/api/profile', type='http', auth='none',
                methods=['PUT'], csrf=False)
    @require_auth
    def update_profile(self, **kw):
        try:
            body = get_body()
            user = request.env['res.users'].sudo().browse(request.session.uid)
            vals = {}
            if 'full_name' in body:
                vals['name'] = body['full_name']
            if 'avatar_url' in body:
                vals['avatar_url'] = body['avatar_url']
            if 'language' in body:
                vals['language_pref'] = body['language']
            if vals:
                user.write(vals)
            return json_response(user.get_profile_data())
        except Exception as e:
            _logger.exception('Update profile error')
            return json_response({'error': str(e)}, 500)

    @http.route('/api/profile', type='http', auth='none',
                methods=['DELETE'], csrf=False)
    @require_auth
    def delete_profile(self, **kw):
        try:
            uid = request.session.uid
            env = request.env(user=uid)
            # Cascade: delete all trips (stops, activities, expenses, etc. cascade)
            env['traveloop.trip'].search([('user_id', '=', uid)]).unlink()
            # Archive the user
            user = env['res.users'].sudo().browse(uid)
            user.write({'active': False})
            request.session.logout(keep_db=True)
            return json_response({'success': True, 'message': 'Account deleted'})
        except Exception as e:
            _logger.exception('Delete profile error')
            return json_response({'error': str(e)}, 500)
