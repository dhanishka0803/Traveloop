# -*- coding: utf-8 -*-
from odoo import models, fields


class TraveloopChecklistItem(models.Model):
    _name = 'traveloop.checklist.item'
    _description = 'Packing Checklist Item'
    _order = 'category, name'

    trip_id = fields.Many2one(
        'traveloop.trip', string='Trip', required=True,
        ondelete='cascade', index=True
    )
    name = fields.Char(string='Item Name', required=True)
    category = fields.Selection([
        ('clothing', 'Clothing'),
        ('toiletries', 'Toiletries'),
        ('electronics', 'Electronics'),
        ('documents', 'Documents'),
        ('other', 'Other'),
    ], string='Category', required=True, default='other')
    is_packed = fields.Boolean(string='Packed', default=False)

    def to_dict(self):
        return {
            'id': self.id,
            'trip_id': self.trip_id.id,
            'name': self.name,
            'category': self.category,
            'is_packed': self.is_packed,
            'created_at': str(self.create_date) if self.create_date else '',
        }
