# -*- coding: utf-8 -*-
"""
Trip CRUD + dashboard endpoints:
  GET    /api/dashboard
  GET    /api/trips
  POST   /api/trips
  GET    /api/trips/:id
  PUT    /api/trips/:id
  DELETE /api/trips/:id
  POST   /api/trips/:id/clone
  PUT    /api/trips/:id/share
"""
import logging
import secrets
from datetime import date
from odoo import http
from odoo.http import request
from .utils import json_response, cors_headers, require_auth, get_body

_logger = logging.getLogger(__name__)


class TripsController(http.Controller):

    @http.route(['/api/dashboard', '/api/trips',
                 '/api/trips/<int:trip_id>',
                 '/api/trips/<int:trip_id>/clone',
                 '/api/trips/<int:trip_id>/share'],
                type='http', auth='none', methods=['OPTIONS'], csrf=False)
    def trips_options(self, **kw):
        return request.make_response('', headers=cors_headers())

    # ── GET /api/dashboard ───────────────────────────────────────────── #
    @http.route('/api/dashboard', type='http', auth='none',
                methods=['GET'], csrf=False)
    @require_auth
    def dashboard(self, **kw):
        try:
            uid = request.session.uid
            env = request.env(user=uid)
            today = date.today()

            all_trips = env['traveloop.trip'].search([])
            upcoming = all_trips.filtered(
                lambda t: t.end_date and t.end_date >= today
            )
            total_budget = sum(all_trips.mapped('budget_estimate'))

            # Distinct cities from stops
            stop_city_ids = set()
            for trip in all_trips:
                for stop in trip.stop_ids:
                    if stop.city_id:
                        stop_city_ids.add(stop.city_id.id)

            # Popular destinations
            popular = request.env['traveloop.city'].sudo().search(
                [], limit=6, order='popularity desc'
            )

            user = env['res.users'].browse(uid)

            return json_response({
                'user_name': user.name,
                'total_trips': len(all_trips),
                'upcoming_count': len(upcoming),
                'total_budget': total_budget,
                'cities_saved': len(stop_city_ids),
                'upcoming_trips': [t.to_dict() for t in upcoming.sorted('start_date')[:6]],
                'popular_destinations': [c.to_dict() for c in popular],
            })
        except Exception as e:
            _logger.exception('Dashboard error')
            return json_response({'error': str(e)}, 500)

    # ── GET /api/trips ───────────────────────────────────────────────── #
    @http.route('/api/trips', type='http', auth='none',
                methods=['GET'], csrf=False)
    @require_auth
    def list_trips(self, **kw):
        try:
            uid = request.session.uid
            trips = request.env(user=uid)['traveloop.trip'].search([])
            return json_response([t.to_dict() for t in trips])
        except Exception as e:
            _logger.exception('List trips error')
            return json_response({'error': str(e)}, 500)

    # ── POST /api/trips ──────────────────────────────────────────────── #
    @http.route('/api/trips', type='http', auth='none',
                methods=['POST'], csrf=False)
    @require_auth
    def create_trip(self, **kw):
        try:
            body = get_body()
            uid = request.session.uid
            env = request.env(user=uid)

            required = ['name', 'start_date', 'end_date']
            for f in required:
                if not body.get(f):
                    return json_response({'error': f'{f} is required'}, 400)

            trip = env['traveloop.trip'].create({
                'name': body['name'],
                'start_date': body['start_date'],
                'end_date': body['end_date'],
                'budget_estimate': float(body.get('budget', 0)),
                'cover_image_url': body.get('cover_url', ''),
                'description': body.get('description', ''),
                'user_id': uid,
            })
            return json_response(trip.to_dict(), 201)
        except Exception as e:
            _logger.exception('Create trip error')
            return json_response({'error': str(e)}, 500)

    # ── GET /api/trips/:id ───────────────────────────────────────────── #
    @http.route('/api/trips/<int:trip_id>', type='http', auth='none',
                methods=['GET'], csrf=False)
    @require_auth
    def get_trip(self, trip_id, **kw):
        try:
            uid = request.session.uid
            trip = request.env(user=uid)['traveloop.trip'].browse(trip_id)
            if not trip.exists():
                return json_response({'error': 'Trip not found'}, 404)
            return json_response(trip.to_dict(full=True))
        except Exception as e:
            _logger.exception('Get trip error')
            return json_response({'error': str(e)}, 500)

    # ── PUT /api/trips/:id ───────────────────────────────────────────── #
    @http.route('/api/trips/<int:trip_id>', type='http', auth='none',
                methods=['PUT'], csrf=False)
    @require_auth
    def update_trip(self, trip_id, **kw):
        try:
            body = get_body()
            uid = request.session.uid
            trip = request.env(user=uid)['traveloop.trip'].browse(trip_id)
            if not trip.exists():
                return json_response({'error': 'Trip not found'}, 404)

            vals = {}
            field_map = {
                'name': 'name',
                'start_date': 'start_date',
                'end_date': 'end_date',
                'budget': 'budget_estimate',
                'cover_url': 'cover_image_url',
                'description': 'description',
            }
            for key, field in field_map.items():
                if key in body:
                    vals[field] = body[key]
            if vals:
                trip.write(vals)
            return json_response(trip.to_dict())
        except Exception as e:
            _logger.exception('Update trip error')
            return json_response({'error': str(e)}, 500)

    # ── DELETE /api/trips/:id ────────────────────────────────────────── #
    @http.route('/api/trips/<int:trip_id>', type='http', auth='none',
                methods=['DELETE'], csrf=False)
    @require_auth
    def delete_trip(self, trip_id, **kw):
        try:
            uid = request.session.uid
            trip = request.env(user=uid)['traveloop.trip'].browse(trip_id)
            if not trip.exists():
                return json_response({'error': 'Trip not found'}, 404)
            trip.unlink()
            return json_response({'success': True})
        except Exception as e:
            _logger.exception('Delete trip error')
            return json_response({'error': str(e)}, 500)

    # ── POST /api/trips/:id/clone ────────────────────────────────────── #
    @http.route('/api/trips/<int:trip_id>/clone', type='http', auth='none',
                methods=['POST'], csrf=False)
    @require_auth
    def clone_trip(self, trip_id, **kw):
        try:
            uid = request.session.uid
            env = request.env(user=uid)
            src = env['traveloop.trip'].browse(trip_id)
            if not src.exists():
                return json_response({'error': 'Trip not found'}, 404)

            new_trip = src.copy({
                'name': f'Copy of {src.name}',
                'user_id': uid,
                'public_token': secrets.token_hex(16),
                'is_public': False,
            })
            return json_response(new_trip.to_dict(), 201)
        except Exception as e:
            _logger.exception('Clone trip error')
            return json_response({'error': str(e)}, 500)

    # ── PUT /api/trips/:id/share ─────────────────────────────────────── #
    @http.route('/api/trips/<int:trip_id>/share', type='http', auth='none',
                methods=['PUT'], csrf=False)
    @require_auth
    def toggle_share(self, trip_id, **kw):
        try:
            body = get_body()
            uid = request.session.uid
            trip = request.env(user=uid)['traveloop.trip'].browse(trip_id)
            if not trip.exists():
                return json_response({'error': 'Trip not found'}, 404)
            trip.write({'is_public': bool(body.get('is_public', False))})
            return json_response({
                'is_public': trip.is_public,
                'public_token': trip.public_token,
                'public_url': f'/api/public/trip/{trip.public_token}',
            })
        except Exception as e:
            _logger.exception('Toggle share error')
            return json_response({'error': str(e)}, 500)
