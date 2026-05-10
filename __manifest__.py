# -*- coding: utf-8 -*-
{
    'name': 'Traveloop – Travel Planning API',
    'version': '17.0.1.0.0',
    'category': 'Travel',
    'summary': 'Complete REST API backend replacing Supabase for the Traveloop React app',
    'description': """
        Traveloop Backend API Module
        ============================
        Replaces Supabase entirely. Provides JSON REST endpoints for:
        - Auth  (login, signup, logout, password reset)
        - Cities & Activities catalog with demo data
        - Trips CRUD with full detail
        - Itinerary stops & activities
        - Budget tracker & expenses
        - Smart packing checklist
        - Trip journal / notes
        - Public sharing via signed token
        - Admin analytics dashboard
        - Profile & settings
        CORS enabled for localhost:8080 (React dev server).
    """,
    'author': 'Traveloop',
    'website': 'https://traveloop.app',
    'depends': ['base', 'web', 'mail'],
    'data': [
        'security/ir.model.access.csv',
        'security/record_rules.xml',
        'data/city_data.xml',
        'data/activity_data.xml',
    ],
    'installable': True,
    'application': True,
    'auto_install': False,
    'license': 'LGPL-3',
}
