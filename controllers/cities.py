# -*- coding: utf-8 -*-
"""
City & Activity endpoints:
  GET /api/cities          ?q=&limit=
  GET /api/cities/:id
  GET /api/activities      ?city_id=
"""
import logging
from odoo import http
from odoo.http import request
from .utils import json_response, cors_headers, require_auth

_logger = logging.getLogger(__name__)


class CitiesController(http.Controller):

    @http.route(['/api/cities', '/api/cities/<int:city_id>',
                 '/api/activities'],
                type='http', auth='none', methods=['OPTIONS'], csrf=False)
    def cities_options(self, **kw):
        return request.make_response('', headers=cors_headers())

    # ── GET /api/cities ──────────────────────────────────────────────── #
    @http.route('/api/cities', type='http', auth='none',
                methods=['GET'], csrf=False)
    def list_cities(self, **kw):
        try:
            q = request.params.get('q', '').strip()
            limit = int(request.params.get('limit', 50))
            domain = []
            if q:
                domain = ['|',
                          ('name', 'ilike', q),
                          ('country', 'ilike', q)]
            cities = request.env['traveloop.city'].sudo().search(
                domain, limit=limit, order='popularity desc'
            )
            return json_response([c.to_dict() for c in cities])
        except Exception as e:
            _logger.exception('List cities error')
            return json_response({'error': str(e)}, 500)

    # ── GET /api/cities/:id ──────────────────────────────────────────── #
    @http.route('/api/cities/<int:city_id>', type='http', auth='none',
                methods=['GET'], csrf=False)
    def get_city(self, city_id, **kw):
        try:
            city = request.env['traveloop.city'].sudo().browse(city_id)
            if not city.exists():
                return json_response({'error': 'City not found'}, 404)
            data = city.to_dict()
            data['activities'] = [a.to_dict() for a in city.activity_ids]
            return json_response(data)
        except Exception as e:
            _logger.exception('Get city error')
            return json_response({'error': str(e)}, 500)

    # ── GET /api/activities?city_id= ─────────────────────────────────── #
    @http.route('/api/activities', type='http', auth='none',
                methods=['GET'], csrf=False)
    def list_activities(self, **kw):
        try:
            city_id = request.params.get('city_id')
            domain = []
            if city_id:
                domain = [('city_id', '=', int(city_id))]
            activities = request.env['traveloop.activity'].sudo().search(domain)
            return json_response([a.to_dict() for a in activities])
        except Exception as e:
            _logger.exception('List activities error')
            return json_response({'error': str(e)}, 500)
