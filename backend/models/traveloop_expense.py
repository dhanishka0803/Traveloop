# -*- coding: utf-8 -*-
from odoo import models, fields


class TraveloopExpense(models.Model):
    _name = 'traveloop.expense'
    _description = 'Trip Expense'
    _order = 'create_date desc'

    trip_id = fields.Many2one(
        'traveloop.trip', string='Trip', required=True,
        ondelete='cascade', index=True
    )
    amount = fields.Float(string='Amount (USD)', required=True, default=0.0)
    category = fields.Selection([
        ('transport', 'Transport'),
        ('stay', 'Stay'),
        ('activities', 'Activities'),
        ('meals', 'Meals'),
        ('other', 'Other'),
    ], string='Category', required=True, default='other')
    description = fields.Char(string='Note')
    paid_by_user_id = fields.Many2one(
        'res.users', string='Paid By',
        default=lambda self: self.env.user
    )
    split_user_ids = fields.Many2many(
        'res.users', 'traveloop_expense_split_rel',
        'expense_id', 'user_id', string='Split With'
    )

    def to_dict(self):
        return {
            'id': self.id,
            'trip_id': self.trip_id.id,
            'amount': self.amount,
            'category': self.category,
            'note': self.description or '',
            'created_at': str(self.create_date) if self.create_date else '',
        }
