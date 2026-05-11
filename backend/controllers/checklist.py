# -*- coding: utf-8 -*-
from odoo import http
from odoo.http import request
from .utils import json_response, cors_headers, require_auth, get_body
import logging
_logger = logging.getLogger(__name__)

SMART_PACKING_BASE = [
    ('Passport', 'documents'),
    ('Phone charger', 'electronics'),
    ('Toothbrush', 'toiletries'),
    ('Toothpaste', 'toiletries'),
    ('T-shirts (5)', 'clothing'),
    ('Socks & underwear', 'clothing'),
    ('Sunscreen', 'toiletries'),
    ('Headphones', 'electronics'),
    ('Travel adapter', 'electronics'),
    ('Wallet', 'documents'),
]

ACTIVITY_PACKING = {
    'adventure': [('Hiking boots', 'clothing'), ('Backpack', 'clothing'), ('Water bottle', 'other')],
    'nature':    [('Insect repellent', 'toiletries'), ('Rain jacket', 'clothing')],
    'nightlife': [('Going-out outfit', 'clothing'), ('Dress shoes', 'clothing')],
    'food':      [('Antacids', 'toiletries'),],
    'culture':   [('Comfortable walking shoes', 'clothing'), ('Camera', 'electronics')],
    'leisure':   [('Swimsuit', 'clothing'), ('Flip flops', 'clothing')],
}


class ChecklistController(http.Controller):

    @http.route(['/api/trips/<int:trip_id>/checklist',
                 '/api/checklist-items', '/api/checklist-items/<int:item_id>',
                 '/api/trips/<int:trip_id>/smart-packing'],
                type='http', auth='none', methods=['OPTIONS'], csrf=False)
    def checklist_options(self, **kw):
        return request.make_response('', headers=cors_headers())

    @http.route('/api/trips/<int:trip_id>/checklist', type='http', auth='none', methods=['GET'], csrf=False)
    @require_auth
    def list_checklist(self, trip_id, **kw):
        try:
            uid = request.session.uid
            trip = request.env(user=uid)['traveloop.trip'].browse(trip_id)
            if not trip.exists():
                return json_response({'error': 'Trip not found'}, 404)
            items = trip.checklist_ids
            packed = sum(1 for i in items if i.is_packed)
            grouped = {}
            for item in items:
                grouped.setdefault(item.category, []).append(item.to_dict())
            return json_response({'items': [i.to_dict() for i in items],
                                  'grouped': grouped,
                                  'packed': packed,
                                  'total': len(items)})
        except Exception as e:
            return json_response({'error': str(e)}, 500)

    @http.route('/api/checklist-items', type='http', auth='none', methods=['POST'], csrf=False)
    @require_auth
    def create_item(self, **kw):
        try:
            body = get_body()
            uid = request.session.uid
            if not body.get('trip_id') or not body.get('name'):
                return json_response({'error': 'trip_id and name required'}, 400)
            item = request.env(user=uid)['traveloop.checklist.item'].create({
                'trip_id': int(body['trip_id']),
                'name': body['name'],
                'category': body.get('category', 'other'),
            })
            return json_response(item.to_dict(), 201)
        except Exception as e:
            return json_response({'error': str(e)}, 500)

    @http.route('/api/checklist-items/<int:item_id>', type='http', auth='none', methods=['PUT'], csrf=False)
    @require_auth
    def update_item(self, item_id, **kw):
        try:
            body = get_body()
            uid = request.session.uid
            item = request.env(user=uid)['traveloop.checklist.item'].browse(item_id)
            if not item.exists():
                return json_response({'error': 'Item not found'}, 404)
            vals = {}
            if 'is_packed' in body:
                vals['is_packed'] = bool(body['is_packed'])
            if 'name' in body:
                vals['name'] = body['name']
            if 'category' in body:
                vals['category'] = body['category']
            if vals:
                item.write(vals)
            return json_response(item.to_dict())
        except Exception as e:
            return json_response({'error': str(e)}, 500)

    @http.route('/api/checklist-items/<int:item_id>', type='http', auth='none', methods=['DELETE'], csrf=False)
    @require_auth
    def delete_item(self, item_id, **kw):
        try:
            uid = request.session.uid
            item = request.env(user=uid)['traveloop.checklist.item'].browse(item_id)
            if not item.exists():
                return json_response({'error': 'Item not found'}, 404)
            item.unlink()
            return json_response({'success': True})
        except Exception as e:
            return json_response({'error': str(e)}, 500)

    @http.route('/api/trips/<int:trip_id>/smart-packing', type='http', auth='none', methods=['POST'], csrf=False)
    @require_auth
    def smart_packing(self, trip_id, **kw):
        try:
            uid = request.session.uid
            env = request.env(user=uid)
            trip = env['traveloop.trip'].browse(trip_id)
            if not trip.exists():
                return json_response({'error': 'Trip not found'}, 404)

            # Collect activity types in this trip
            activity_types = set()
            for stop in trip.stop_ids:
                for act in stop.trip_activity_ids:
                    if act.activity_type:
                        activity_types.add(act.activity_type)

            # Build suggestion list
            suggestions = list(SMART_PACKING_BASE)
            for atype in activity_types:
                suggestions.extend(ACTIVITY_PACKING.get(atype, []))

            # Deduplicate by name
            existing_names = {i.name.lower() for i in trip.checklist_ids}
            created = []
            for name, category in suggestions:
                if name.lower() not in existing_names:
                    item = env['traveloop.checklist.item'].create({
                        'trip_id': trip_id,
                        'name': name,
                        'category': category,
                    })
                    created.append(item.to_dict())
                    existing_names.add(name.lower())

            return json_response({'created': created, 'count': len(created)})
        except Exception as e:
            return json_response({'error': str(e)}, 500)
