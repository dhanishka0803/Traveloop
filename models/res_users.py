# -*- coding: utf-8 -*-
from odoo import models, fields, api


class ResUsers(models.Model):
    _inherit = 'res.users'

    avatar_url = fields.Char(string='Avatar URL')
    language_pref = fields.Selection([
        ('en', 'English'),
        ('es', 'Spanish'),
        ('fr', 'French'),
        ('de', 'German'),
        ('ja', 'Japanese'),
    ], string='Language Preference', default='en')

    def get_profile_data(self):
        self.ensure_one()
        return {
            'id': self.id,
            'email': self.login,
            'full_name': self.name or '',
            'avatar_url': self.avatar_url or '',
            'language': self.language_pref or 'en',
        }
