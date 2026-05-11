# -*- coding: utf-8 -*-
import secrets
from odoo import models, fields, api


class TraveloopTrip(models.Model):
    _name = 'traveloop.trip'
    _description = 'Travel Trip'
    _order = 'start_date desc'

    name = fields.Char(string='Trip Name', required=True)
    start_date = fields.Date(string='Start Date', required=True)
    end_date = fields.Date(string='End Date', required=True)
    budget_estimate = fields.Float(string='Budget Estimate (USD)', default=0.0)
    cover_image_url = fields.Char(string='Cover Image URL')
    description = fields.Text(string='Description')
    is_public = fields.Boolean(string='Public', default=False)
    public_token = fields.Char(string='Public Token', index=True, copy=False)
    green_score = fields.Integer(string='Green Score', default=70)
    user_id = fields.Many2one(
        'res.users', string='Owner', required=True,
        default=lambda self: self.env.user,
        ondelete='cascade', index=True
    )

    stop_ids = fields.One2many('traveloop.stop', 'trip_id', string='Stops')
    expense_ids = fields.One2many('traveloop.expense', 'trip_id', string='Expenses')
    checklist_ids = fields.One2many('traveloop.checklist.item', 'trip_id', string='Checklist')
    note_ids = fields.One2many('traveloop.note', 'trip_id', string='Notes')

    stop_count = fields.Integer(compute='_compute_stop_count', store=True)
    duration_days = fields.Integer(compute='_compute_duration', store=True)

    @api.depends('stop_ids')
    def _compute_stop_count(self):
        for trip in self:
            trip.stop_count = len(trip.stop_ids)

    @api.depends('start_date', 'end_date')
    def _compute_duration(self):
        for trip in self:
            if trip.start_date and trip.end_date:
                trip.duration_days = max((trip.end_date - trip.start_date).days + 1, 1)
            else:
                trip.duration_days = 0

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if not vals.get('public_token'):
                vals['public_token'] = secrets.token_hex(16)
        return super().create(vals_list)

    def _get_total_spending(self):
        """Compute total spending: activity costs + manual expenses."""
        self.ensure_one()
        act_total = sum(
            (a.cost_override if a.cost_override else
             (a.activity_id.cost if a.activity_id else 0.0))
            for stop in self.stop_ids
            for a in stop.trip_activity_ids
        )
        exp_total = sum(e.amount for e in self.expense_ids)
        return act_total + exp_total

    def _get_spending_by_category(self):
        """Return dict of spending per expense category."""
        self.ensure_one()
        breakdown = {}
        # Activity costs go into 'activities'
        act_total = sum(
            (a.cost_override if a.cost_override else
             (a.activity_id.cost if a.activity_id else 0.0))
            for stop in self.stop_ids
            for a in stop.trip_activity_ids
        )
        if act_total:
            breakdown['activities'] = act_total
        for exp in self.expense_ids:
            breakdown[exp.category] = breakdown.get(exp.category, 0.0) + exp.amount
        return breakdown

    def to_dict(self, full=False):
        self.ensure_one()
        total_spending = self._get_total_spending()
        data = {
            'id': self.id,
            'name': self.name,
            'start_date': str(self.start_date) if self.start_date else '',
            'end_date': str(self.end_date) if self.end_date else '',
            'budget': self.budget_estimate,
            'cover_url': self.cover_image_url or '',
            'description': self.description or '',
            'is_public': self.is_public,
            'public_token': self.public_token or '',
            'green_score': self.green_score,
            'stop_count': self.stop_count,
            'duration_days': self.duration_days,
            'user_id': self.user_id.id,
            'total_spending': total_spending,
            'over_budget': (self.budget_estimate > 0 and
                            total_spending > self.budget_estimate),
        }
        if full:
            data['stops'] = [
                s.to_dict(full=True)
                for s in self.stop_ids.sorted('sequence')
            ]
            data['expenses'] = [e.to_dict() for e in self.expense_ids]
            data['checklist'] = [c.to_dict() for c in self.checklist_ids]
            data['notes'] = [
                n.to_dict()
                for n in self.note_ids.sorted('create_date', reverse=True)
            ]
            data['spending_by_category'] = self._get_spending_by_category()
            days = max(self.duration_days, 1)
            data['avg_per_day'] = round(total_spending / days, 2)
        return data
