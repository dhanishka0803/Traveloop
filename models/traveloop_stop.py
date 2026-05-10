# -*- coding: utf-8 -*-
from odoo import models, fields, api


class TraveloopStop(models.Model):
    _name = 'traveloop.stop'
    _description = 'Trip Stop'
    _order = 'sequence, start_date'

    trip_id = fields.Many2one(
        'traveloop.trip', string='Trip', required=True,
        ondelete='cascade', index=True
    )
    city_id = fields.Many2one(
        'traveloop.city', string='City', ondelete='restrict'
    )
    city_name = fields.Char(
        string='City Name', compute='_compute_city_info', store=True
    )
    country = fields.Char(
        string='Country', compute='_compute_city_info', store=True
    )
    start_date = fields.Date(string='Arrival Date')
    end_date = fields.Date(string='Departure Date')
    sequence = fields.Integer(string='Order', default=10)
    trip_activity_ids = fields.One2many(
        'traveloop.trip.activity', 'stop_id', string='Activities'
    )

    @api.depends('city_id', 'city_id.name', 'city_id.country')
    def _compute_city_info(self):
        for stop in self:
            stop.city_name = stop.city_id.name if stop.city_id else ''
            stop.country = stop.city_id.country if stop.city_id else ''

    def to_dict(self, full=False):
        self.ensure_one()
        data = {
            'id': self.id,
            'trip_id': self.trip_id.id,
            'city_id': self.city_id.id if self.city_id else None,
            'city_name': self.city_name or '',
            'country': self.country or '',
            'start_date': str(self.start_date) if self.start_date else '',
            'end_date': str(self.end_date) if self.end_date else '',
            'sequence': self.sequence,
        }
        if full:
            data['trip_activities'] = [
                a.to_dict() for a in self.trip_activity_ids
            ]
            if self.city_id:
                catalog = self.env['traveloop.activity'].search(
                    [('city_id', '=', self.city_id.id)]
                )
                data['catalog_activities'] = [a.to_dict() for a in catalog]
            else:
                data['catalog_activities'] = []
        return data
