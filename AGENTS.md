<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Hotel Room Service Request App Requirements

## 1. Access & Identification
- Unique QR code assigned to each hotel room.
- QR code redirects guest to the app.
- Automatic identification of:
  - Room number
  - Guest reservation details (name, stay duration)
- No login required for guests (frictionless access).
- Secure session handling to prevent cross-room misuse.

## 2. User Interface (Guest Side)
- Clean, mobile-friendly interface.
- Categorised service menu (e.g. Food, Facilities, Housekeeping).
- Multi-language support.
- Accessible design (large buttons, clear icons).
- Real-time confirmation messages after requests.
- Option to track request status (Pending, In Progress, Completed).

## 3. Core Service Categories & Features

### Food & Beverage
- Breakfast ordering (set menus and custom options).
- Lunch and dinner menu ordering.
- Drinks (hot, cold, alcoholic where applicable).
- Special dietary requests (e.g. vegetarian, halal, allergies).
- Scheduled delivery time selection.
- Add notes for kitchen (e.g. "no salt", "extra spicy").

### Room Service & Housekeeping
- Request room cleaning.
- Request fresh towels/linen.
- Toiletries replenishment (soap, shampoo, etc.).
- Extra items (pillows, blankets, iron, hairdryer).
- Turn-down service request.

### Laundry Service
- Laundry pickup request.
- Dry cleaning request.
- Express vs standard service selection.
- Item count submission.
- Preferred pickup and return times.

### Facilities Booking
- Swimming pool booking (time slots).
- Gym access booking.
- Spa and wellness appointments.
- Sauna/steam room booking.
- Restaurant table reservation (if applicable).

### Reservation & Stay Management
- Request to extend reservation (date/time selection).
- Early check-in request.
- Late check-out request.
- View current booking details.
- Request billing statement / invoice.

### Maintenance & Support
- Report room issues (e.g. AC not working, lights faulty).
- Emergency assistance request.
- Concierge services (e.g. taxi booking, local recommendations).
- Chat or call reception option.

## 4. Request Processing & Notifications
- Each request tagged with:
  - Room number
  - Guest name
  - Timestamp
  - Request type
- Automatic notification sent to:
  - Reception dashboard
  - Relevant department (kitchen, housekeeping, maintenance)
- Real-time updates to staff dashboards.
- Push notifications or alerts for urgent requests.

## 5. Backend System Integration
- Integration with hotel backend system.
- Link requests to:
  - Guest reservation
  - Billing account (for chargeable services)
- Automatic logging of all requests under guest profile.
- Status tracking and audit logs.
- Ability to update request status (Pending -> Completed).

## 6. Staff Dashboard (Admin Panel)
- Centralised dashboard for all incoming requests.
- Filter by:
  - Room number
  - Service type
  - Status
- Assign tasks to staff members.
- Update request progress.
- Internal notes for staff communication.
- Performance tracking (response time, completion time).

## 7. Notifications & Communication
- Guest receives confirmation after submitting request.
- Optional notifications:
  - Request accepted
  - Service on the way
  - Completed
- Internal staff (reception) notifications for new requests.
- Escalation alerts for delayed requests.

## 8. Billing & Payments
- Automatic charge posting to room account.
- Display estimated costs before confirmation.
- Optional in-app payment integration.
- Digital receipt generation.
