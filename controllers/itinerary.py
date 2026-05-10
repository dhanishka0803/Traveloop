# -*- coding: utf-8 -*-
"""
Itinerary endpoints:
  POST   /api/trips/:id/stops
  PUT    /api/stops/:id
  DELETE /api/stops/:id
  POST   /api/stops/:id/activities
  DELETE /api/trip-activities/:id
"""
import logging
from odoo import http
from odoo.http import request
from .utils import json_response, cors_headers, require_auth, get_body

_logger = logging.getLogger(__name__)


class ItineraryController(http.Controller):

    @http.route(['/api/trips/<int:trip_id>/stops',
                 '/api/stops/<int:stop_id>',
                 '/api/stops/<int:stop_id>/activities',
                 '/api/trip-activities/<int:act_id>'],
                type='http', auth='none', methods=['OPTIONS'], csrf=False)
    def itinerary_options(self, **kw):
        return request.make_response('', headers=cors_headers())

    # ── POST /api/trips/:id/stops ────────────────────────────────────── #
    @http.route('/api/trips/<int:trip_id>/stops', type='http', auth='none',
                methods=['POST'], csrf=False)
    @require_auth
    def add_stop(self, trip_id, **kw):
        try:
            body = get_body()
            uid = request.session.uid
            env = request.env(user=uid)

            trip = env['traveloop.trip'].browse(trip_id)
            if not trip.exists():
                return json_response({'error': 'Trip not found'}, 404)

            city_id = body.get('city_id')
            if not city_id:
                return json_response({'error': 'city_id required'}, 400)

            # Auto-sequence: last + 10
            existing = env['traveloop.stop'].search(
                [('trip_id', '=', trip_id)], order='sequence desc', limit=1
            )
            seq = (existing.sequence + 10) if existing else 10

            stop = env['traveloop.stop'].create({
                'trip_id': trip_id,
                'city_id': int(city_id),
                'start_date': body.get('start_date') or trip.start_date,
                'end_date': body.get('end_date') or trip.end_date,
                'sequence': seq,
            })
            return json_response(stop.to_dict(full=True), 201)
        except Exception as e:
            _logger.exception('Add stop error')
            return json_response({'error': str(e)}, 500)

    # ── PUT /api/stops/:id ───────────────────────────────────────────── #
    @http.route('/api/stops/<int:stop_id>', type='http', auth='none',
                methods=['PUT'], csrf=False)
    @require_auth
    def update_stop(self, stop_id, **kw):
        try:
            body = get_body()
            uid = request.session.uid
            stop = request.env(user=uid)['traveloop.stop'].browse(stop_id)
            if not stop.exists():
                return json_response({'error': 'Stop not found'}, 404)

            vals = {}
            if 'city_id' in body:
                vals['city_id'] = int(body['city_id'])
            if 'start_date' in body:
                vals['start_date'] = body['start_date']
            if 'end_date' in body:
                vals['end_date'] = body['end_date']
            if 'sequence' in body:
                vals['sequence'] = int(body['sequence'])
            if vals:
                stop.write(vals)
            return json_response(stop.to_dict(full=True))
        except Exception as e:
            _logger.exception('Update stop error')
            return json_response({'error': str(e)}, 500)

    # ── DELETE /api/stops/:id ────────────────────────────────────────── #
    @http.route('/api/stops/<int:stop_id>', type='http', auth='none',
                methods=['DELETE'], csrf=False)
    @require_auth
    def delete_stop(self, stop_id, **kw):
        try:
            uid = request.session.uid
            stop = request.env(user=uid)['traveloop.stop'].browse(stop_id)
            if not stop.exists():
                return json_response({'error': 'Stop not found'}, 404)
            stop.unlink()
            return json_response({'success': True})
        except Exception as e:
            _logger.exception('Delete stop error')
            return json_response({'error': str(e)}, 500)

    # ── POST /api/stops/:id/activities ───────────────────────────────── #
    @http.route('/api/stops/<int:stop_id>/activities', type='http',
                auth='none', methods=['POST'], csrf=False)
    @require_auth
    def add_activity(self, stop_id, **kw):
        try:
            body = get_body()
            uid = request.session.uid
            env = request.env(user=uid)

            stop = env['traveloop.stop'].browse(stop_id)
            if not stop.exists():
                return json_response({'error': 'Stop not found'}, 404)

            # Determine name & cost from catalog or custom
            catalog_id = body.get('activity_id')
            if catalog_id:
                catalog = env['traveloop.activity'].sudo().browse(int(catalog_id))
                name = catalog.name
                cost = float(body.get('cost', catalog.cost))
                atype = catalog.activity_type
                duration = int(catalog.duration_hours * 60)
            else:
                name = body.get('name', '')
                if not name:
                    return json_response({'error': 'name required'}, 400)
                cost = float(body.get('cost', 0))
                atype = body.get('type', 'culture')
                duration = int(body.get('duration_minutes', 60))
                catalog_id = None

            act = env['traveloop.trip.activity'].create({
                'stop_id': stop_id,
                'activity_id': int(catalog_id) if catalog_id else False,
                'name': name,
                'activity_type': atype,
                'time_slot': body.get('time_slot', '10:00'),
                'cost_override': cost,
                'duration_minutes': duration,
            })
            return json_response(act.to_dict(), 201)
        except Exception as e:
            _logger.exception('Add activity error')
            return json_response({'error': str(e)}, 500)

    # ── DELETE /api/trip-activities/:id ──────────────────────────────── #
    @http.route('/api/trip-activities/<int:act_id>', type='http',
                auth='none', methods=['DELETE'], csrf=False)
    @require_auth
    def delete_activity(self, act_id, **kw):
        try:
            uid = request.session.uid
            act = request.env(user=uid)['traveloop.trip.activity'].browse(act_id)
            if not act.exists():
                return json_response({'error': 'Activity not found'}, 404)
            act.unlink()
            return json_response({'success': True})
        except Exception as e:
            _logger.exception('Delete activity error')
            return json_response({'error': str(e)}, 500)
