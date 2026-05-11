# -*- coding: utf-8 -*-
from odoo import http
from odoo.http import request
from .utils import json_response, cors_headers, require_auth, get_body
import logging
_logger = logging.getLogger(__name__)


class NotesController(http.Controller):

    @http.route(['/api/trips/<int:trip_id>/notes',
                 '/api/notes', '/api/notes/<int:note_id>'],
                type='http', auth='none', methods=['OPTIONS'], csrf=False)
    def notes_options(self, **kw):
        return request.make_response('', headers=cors_headers())

    # ── PUT /api/notes/:id ───────────────────────────────────────────── #
    @http.route('/api/notes/<int:note_id>', type='http', auth='none', methods=['PUT'], csrf=False)
    @require_auth
    def update_note(self, note_id, **kw):
        try:
            body = get_body()
            uid = request.session.uid
            note = request.env(user=uid)['traveloop.note'].browse(note_id)
            if not note.exists():
                return json_response({'error': 'Note not found'}, 404)
            vals = {}
            if 'content' in body:
                vals['content'] = body['content']
            if 'stop_id' in body:
                vals['stop_id'] = int(body['stop_id']) if body['stop_id'] else False
            if vals:
                note.write(vals)
            return json_response(note.to_dict())
        except Exception as e:
            return json_response({'error': str(e)}, 500)

    @http.route('/api/trips/<int:trip_id>/notes', type='http', auth='none', methods=['GET'], csrf=False)
    @require_auth
    def list_notes(self, trip_id, **kw):
        try:
            uid = request.session.uid
            trip = request.env(user=uid)['traveloop.trip'].browse(trip_id)
            if not trip.exists():
                return json_response({'error': 'Trip not found'}, 404)
            notes = trip.note_ids.sorted('create_date', reverse=True)
            return json_response([n.to_dict() for n in notes])
        except Exception as e:
            return json_response({'error': str(e)}, 500)

    @http.route('/api/notes', type='http', auth='none', methods=['POST'], csrf=False)
    @require_auth
    def create_note(self, **kw):
        try:
            body = get_body()
            uid = request.session.uid
            if not body.get('trip_id') or not body.get('content'):
                return json_response({'error': 'trip_id and content required'}, 400)
            note = request.env(user=uid)['traveloop.note'].create({
                'trip_id': int(body['trip_id']),
                'stop_id': int(body['stop_id']) if body.get('stop_id') else False,
                'content': body['content'],
            })
            return json_response(note.to_dict(), 201)
        except Exception as e:
            return json_response({'error': str(e)}, 500)

    @http.route('/api/notes/<int:note_id>', type='http', auth='none', methods=['DELETE'], csrf=False)
    @require_auth
    def delete_note(self, note_id, **kw):
        try:
            uid = request.session.uid
            note = request.env(user=uid)['traveloop.note'].browse(note_id)
            if not note.exists():
                return json_response({'error': 'Note not found'}, 404)
            note.unlink()
            return json_response({'success': True})
        except Exception as e:
            return json_response({'error': str(e)}, 500)
