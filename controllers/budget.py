# -*- coding: utf-8 -*-
from odoo import http
from odoo.http import request
from .utils import json_response, cors_headers, require_auth, get_body
import logging
_logger = logging.getLogger(__name__)

class BudgetController(http.Controller):

    @http.route(['/api/trips/<int:trip_id>/expenses',
                 '/api/expenses', '/api/expenses/<int:exp_id>'],
                type='http', auth='none', methods=['OPTIONS'], csrf=False)
    def budget_options(self, **kw):
        return request.make_response('', headers=cors_headers())

    @http.route('/api/trips/<int:trip_id>/expenses', type='http', auth='none', methods=['GET'], csrf=False)
    @require_auth
    def list_expenses(self, trip_id, **kw):
        try:
            uid = request.session.uid
            trip = request.env(user=uid)['traveloop.trip'].browse(trip_id)
            if not trip.exists():
                return json_response({'error': 'Trip not found'}, 404)
            return json_response({
                'expenses': [e.to_dict() for e in trip.expense_ids],
                'total_spending': trip._get_total_spending(),
                'spending_by_category': trip._get_spending_by_category(),
                'budget': trip.budget_estimate,
                'over_budget': trip._get_total_spending() > trip.budget_estimate and trip.budget_estimate > 0,
                'avg_per_day': round(trip._get_total_spending() / max(trip.duration_days, 1), 2),
            })
        except Exception as e:
            return json_response({'error': str(e)}, 500)

    @http.route('/api/expenses', type='http', auth='none', methods=['POST'], csrf=False)
    @require_auth
    def create_expense(self, **kw):
        try:
            body = get_body()
            uid = request.session.uid
            if not body.get('trip_id') or not body.get('amount'):
                return json_response({'error': 'trip_id and amount required'}, 400)
            exp = request.env(user=uid)['traveloop.expense'].create({
                'trip_id': int(body['trip_id']),
                'amount': float(body['amount']),
                'category': body.get('category', 'other'),
                'description': body.get('note', ''),
            })
            return json_response(exp.to_dict(), 201)
        except Exception as e:
            return json_response({'error': str(e)}, 500)

    @http.route('/api/expenses/<int:exp_id>', type='http', auth='none', methods=['DELETE'], csrf=False)
    @require_auth
    def delete_expense(self, exp_id, **kw):
        try:
            uid = request.session.uid
            exp = request.env(user=uid)['traveloop.expense'].browse(exp_id)
            if not exp.exists():
                return json_response({'error': 'Expense not found'}, 404)
            exp.unlink()
            return json_response({'success': True})
        except Exception as e:
            return json_response({'error': str(e)}, 500)
