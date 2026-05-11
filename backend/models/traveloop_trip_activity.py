# -*- coding: utf-8 -*-
from odoo import models, fields


class TraveloopTripActivity(models.Model):
    _name = 'traveloop.trip.activity'
    _description = 'Trip Activity Instance'
    _order = 'time_slot, id'

    stop_id = fields.Many2one(
        'traveloop.stop', string='Stop', required=True,
        ondelete='cascade', index=True
    )
    activity_id = fields.Many2one(
        'traveloop.activity', string='Catalog Activity', ondelete='set null'
    )
    name = fields.Char(string='Activity Name', required=True)
    activity_type = fields.Selection([
        ('culture', 'Culture'),
        ('food', 'Food'),
        ('nature', 'Nature'),
        ('adventure', 'Adventure'),
        ('nightlife', 'Nightlife'),
        ('leisure', 'Leisure'),
    ], string='Type', default='culture')
    time_slot = fields.Char(string='Time Slot', default='10:00')
    cost_override = fields.Float(string='Cost (USD)', default=0.0)
    duration_minutes = fields.Integer(string='Duration (min)', default=60)
    votes = fields.Integer(string='Votes', default=0)
    sequence = fields.Integer(string='Sequence', default=10)

    def to_dict(self):
        return {
            'id': self.id,
            'stop_id': self.stop_id.id,
            'activity_id': self.activity_id.id if self.activity_id else None,
            'name': self.name,
            'type': self.activity_type,
            'time_slot': self.time_slot or '10:00',
            'cost': self.cost_override,
            'duration_minutes': self.duration_minutes,
            'votes': self.votes,
        }
