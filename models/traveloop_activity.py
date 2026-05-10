# -*- coding: utf-8 -*-
from odoo import models, fields


class TraveloopActivity(models.Model):
    _name = 'traveloop.activity'
    _description = 'Activity Catalog'
    _order = 'name'

    name = fields.Char(string='Activity Name', required=True)
    activity_type = fields.Selection([
        ('culture', 'Culture'),
        ('food', 'Food'),
        ('nature', 'Nature'),
        ('adventure', 'Adventure'),
        ('nightlife', 'Nightlife'),
        ('leisure', 'Leisure'),
    ], string='Type', required=True, default='culture')
    cost = fields.Float(string='Average Cost (USD)', default=0.0)
    duration_hours = fields.Float(string='Duration (hours)', default=2.0)
    description = fields.Text(string='Description')
    image_url = fields.Char(string='Image URL')
    city_id = fields.Many2one('traveloop.city', string='City',
                               ondelete='cascade', index=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'activity_type': self.activity_type,
            'cost': self.cost,
            'duration_hours': self.duration_hours,
            'description': self.description or '',
            'image_url': self.image_url or '',
            'city_id': self.city_id.id if self.city_id else None,
            'city_name': self.city_id.name if self.city_id else '',
        }
