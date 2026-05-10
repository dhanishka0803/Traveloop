# -*- coding: utf-8 -*-
"""
Public (no-auth) endpoint:
  GET /api/public/trip/:token
"""
from odoo import http
from odoo.http import request
from .utils import json_response, cors_headers
import logging
_logger = logging.getLogger(__name__)


class PublicController(http.Controller):

    @http.route('/api/public/trip/<string:token>', type='http',
                auth='none', methods=['OPTIONS'], csrf=False)
    def public_options(self, token, **kw):
        return request.make_response('', headers=cors_headers())

    @http.route('/api/public/trip/<string:token>', type='http',
                auth='none', methods=['GET'], csrf=False)
    def public_trip(self, token, **kw):
        try:
            trip = request.env['traveloop.trip'].sudo().search(
                [('public_token', '=', token), ('is_public', '=', True)], limit=1
            )
            if not trip:
                return json_response({'error': 'Trip not found or not public'}, 404)

            data = trip.to_dict(full=True)
            # Remove private fields
            data.pop('user_id', None)
            return json_response(data)
        except Exception as e:
            _logger.exception('Public trip error')
            return json_response({'error': str(e)}, 500)
