# -*- coding: utf-8 -*-
from odoo import models, fields


class TraveloopNote(models.Model):
    _name = 'traveloop.note'
    _description = 'Trip Journal Note'
    _order = 'create_date desc'

    trip_id = fields.Many2one(
        'traveloop.trip', string='Trip', required=True,
        ondelete='cascade', index=True
    )
    stop_id = fields.Many2one(
        'traveloop.stop', string='Linked Stop', ondelete='set null'
    )
    content = fields.Text(string='Content', required=True)

    def to_dict(self):
        return {
            'id': self.id,
            'trip_id': self.trip_id.id,
            'stop_id': self.stop_id.id if self.stop_id else None,
            'stop_name': self.stop_id.city_name if self.stop_id else '',
            'content': self.content or '',
            'created_at': str(self.create_date) if self.create_date else '',
        }
