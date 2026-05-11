# -*- coding: utf-8 -*-
from odoo import models, fields, api


class TraveloopCity(models.Model):
    _name = 'traveloop.city'
    _description = 'Travel City'
    _order = 'popularity desc, name'

    name = fields.Char(string='City Name', required=True, index=True)
    country = fields.Char(string='Country', required=True)
    cost_index = fields.Integer(string='Cost Index (0-100)', default=50)
    popularity = fields.Integer(string='Popularity (0-100)', default=50)
    image_url = fields.Char(string='Image URL')
    description = fields.Text(string='Description')
    activity_ids = fields.One2many('traveloop.activity', 'city_id', string='Activities')
    activity_count = fields.Integer(compute='_compute_activity_count', store=True)

    @api.depends('activity_ids')
    def _compute_activity_count(self):
        for city in self:
            city.activity_count = len(city.activity_ids)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'country': self.country,
            'cost_index': self.cost_index,
            'popularity': self.popularity,
            'image_url': self.image_url or '',
            'description': self.description or '',
            'activity_count': self.activity_count,
        }
