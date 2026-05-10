# -*- coding: utf-8 -*-
"""
Admin endpoints (system group only):
  GET /api/admin/stats
"""
from odoo import http
from odoo.http import request
from .utils import json_response, cors_headers, require_auth
import logging
_logger = logging.getLogger(__name__)


class AdminController(http.Controller):

    @http.route('/api/admin/stats', type='http', auth='none',
                methods=['OPTIONS'], csrf=False)
    def admin_options(self, **kw):
        return request.make_response('', headers=cors_headers())

    @http.route('/api/admin/stats', type='http', auth='none',
                methods=['GET'], csrf=False)
    @require_auth
    def admin_stats(self, **kw):
        try:
            uid = request.session.uid
            user = request.env['res.users'].sudo().browse(uid)
            if not user.has_group('base.group_system'):
                return json_response({'error': 'Admin access required'}, 403)

            env = request.env(user=uid)
            sudo_env = request.env

            # KPIs
            total_trips = sudo_env['traveloop.trip'].sudo().search_count([])
            total_stops = sudo_env['traveloop.stop'].sudo().search_count([])
            total_cities = sudo_env['traveloop.city'].sudo().search_count([])
            all_trips = sudo_env['traveloop.trip'].sudo().search([])
            avg_budget = (
                sum(all_trips.mapped('budget_estimate')) / len(all_trips)
                if all_trips else 0
            )

            # Most-visited cities (aggregate stops by city)
            stops = sudo_env['traveloop.stop'].sudo().search([('city_id', '!=', False)])
            city_counts = {}
            for stop in stops:
                cid = stop.city_id.id
                cname = stop.city_id.name
                city_counts[cid] = city_counts.get(cid, {'name': cname, 'count': 0})
                city_counts[cid]['count'] += 1

            top_cities = sorted(city_counts.values(), key=lambda x: x['count'], reverse=True)[:8]

            # Predictive insight: co-visit frequency
            # For each pair of cities that appear in the same trip, count co-occurrences
            from collections import defaultdict
            co_visit = defaultdict(int)
            trip_city_map = {}
            for stop in stops:
                tid = stop.trip_id.id
                cname = stop.city_id.name
                trip_city_map.setdefault(tid, set()).add(cname)

            for cities_in_trip in trip_city_map.values():
                city_list = sorted(cities_in_trip)
                for i in range(len(city_list)):
                    for j in range(i + 1, len(city_list)):
                        pair = (city_list[i], city_list[j])
                        co_visit[pair] += 1

            insights = []
            if co_visit:
                top_pair = max(co_visit, key=co_visit.get)
                total_trips_with_first = sum(
                    1 for cities in trip_city_map.values() if top_pair[0] in cities
                )
                pct = round(
                    co_visit[top_pair] / max(total_trips_with_first, 1) * 100
                )
                insights.append({
                    'city_a': top_pair[0],
                    'city_b': top_pair[1],
                    'percentage': pct,
                    'message': (
                        f'Users who planned {top_pair[0]} also added '
                        f'{top_pair[1]} ({pct}%)'
                    ),
                })

            return json_response({
                'kpis': {
                    'total_trips': total_trips,
                    'total_stops': total_stops,
                    'total_cities': total_cities,
                    'avg_budget': round(avg_budget, 2),
                },
                'top_cities': top_cities,
                'predictive_insights': insights,
            })
        except Exception as e:
            _logger.exception('Admin stats error')
            return json_response({'error': str(e)}, 500)
