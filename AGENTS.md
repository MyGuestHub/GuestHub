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
- Room-specific QR code access: auto-identifies guest and reservation.
- Dynamic service menu: shows only relevant services based on guest type or hotel policy.
- Categorised service menu (e.g. Food, Facilities, Housekeeping).
- Multi-language support (UI, messages, and chatbot respond in guest's preferred language).
- Accessible design (large buttons, clear icons).
- Real-time confirmation messages after requests.
- In-app notifications: real-time request status updates (Pending → In Progress → Completed).
- Customisable dashboards: show recent requests, offers, loyalty points.

## 3. Core Service Categories

### 3.1 Food & Beverage
- Breakfast, lunch, dinner ordering (set menus and custom options).
- Drinks (hot, cold, alcoholic where applicable).
- Minibar management.
- Special dietary requests (halal, vegetarian, allergies).
- Scheduled delivery time selection.
- Add notes for kitchen (e.g. "no salt", "extra spicy").
- Special occasion packages (birthday/anniversary).

### 3.2 Housekeeping & Room Comfort
- Request room cleaning.
- Request fresh towels/linen.
- Toiletries replenishment (soap, shampoo, tissues, etc.).
- Turn-down service request.
- Extra items (pillows, blankets).
- Room adjustments (lighting, temperature, furniture).
- Urgent cleaning request (high priority).
- IoT integration for smart room controls.

### 3.3 Laundry & Personal Care
- Laundry pickup request.
- Dry cleaning request.
- Ironing service request.
- Express vs standard service selection.
- Item count submission.
- Preferred pickup and return times.
- Personal grooming items (shaving kit, toiletries).
- Shoe cleaning / shoeshine.
- Hairdryer request.

### 3.4 Facilities & Recreation
- Swimming pool booking (time slots).
- Gym access booking.
- Spa and wellness appointments.
- Sauna/steam room booking.
- Tennis, squash, golf tee time booking.
- Kids' club / babysitting requests.
- Outdoor activities (biking, kayaking, guided tours).
- Restaurant table reservation.
- Real-time availability display for pools, gym, courts, spa.
- Slot selection via calendar: pick specific times visually.
- Queue / waitlist management: guest notified when slot becomes available.
- Group booking & collaboration: coordinate multiple rooms or guests.

### 3.5 Travel & Transport Assistance
- Taxi / ride-hailing request (Uber, Careem, etc.).
- Airport transfer booking (scheduled time).
- Private chauffeur booking.
- Local guided tours and excursions.
- Car rental requests.

### 3.6 Wellness & Personal Services
- Spa, massage, fitness trainer appointments.
- In-room yoga or meditation sessions.
- Beauty services (manicure, pedicure, hairdresser).

### 3.7 Reservation & Stay Management
- Request to extend reservation (date/time selection).
- Early check-in request.
- Late check-out request.
- Request check-out / end stay.
- View current booking details.
- Request billing statement / invoice.

### 3.8 Maintenance & Support
- Air conditioning issue reporting.
- Electrical issue (lighting, switches).
- Plumbing issue (water, bathroom, sink).
- Internet / Wi-Fi issue reporting.
- Emergency assistance request (panic button).
- Concierge services (e.g. taxi booking, local recommendations).

### 3.9 Business & Work Related
- Meeting room bookings.
- Printing, photocopying, fax services.
- High-speed internet or Wi-Fi extension.
- Laptop / projector rental.

### 3.10 Entertainment & Digital
- In-room streaming controls (Netflix, Disney+, Spotify).
- Gaming console or VR headset requests.
- Newspapers, magazines, or digital concierge Q&A.
- AR/VR previews: see dishes, spa treatments, or activity spaces.

### 3.11 Communication
- In-app chat with reception / concierge (instant messaging).
- AI chatbot for FAQs (24/7 automated support).
- Submit a complaint or feedback.

### 3.12 Room Settings
- Do Not Disturb mode.
- Wake-up call request (set time).
- Smart room integration: adjust AC, lighting, curtains from the app.
- Automatic service triggers: room detects check-in → app recommends housekeeping, minibar refill.

### 3.13 Safety & Emergency
- Panic button / emergency call: instant notification to hotel security.
- Maintenance reporting: attach photo/video of issue.
- Room access alerts: notify guest if door unlocked or service in progress.
- Security requests / escort services.
- Lost & found service.

### 3.14 Convenience & Miscellaneous
- Luggage storage and delivery.
- Flower or gift delivery.
- Currency exchange / banking assistance.
- Early baggage pickup for departure.
- House pet services.

### 3.15 Feedback & Personalisation
- Rate staff and service (⭐ rating after each request).
- Request personalised room setups.
- Post-stay review submission.
- Loyalty programme points tracking and redemption.

## 4. Features

### 4.1 Ordering & Scheduling
- Scheduled delivery for food/services: guest selects exact delivery time.
- Repeat or favourite orders: one-tap re-order of meals, amenities, or services.
- Multi-service batching: order multiple services at once (laundry + breakfast + spa).
- Service notes / preferences: extra spicy, vegan, hypoallergenic, etc.
- Estimated wait time: dynamically calculated based on staff load.

### 4.2 Basket / Cart System
- Add multiple services (food, spa, laundry, etc.) before confirming.
- Save for Later: temporarily hold items in basket for later ordering.
- Group Basket Sharing: multiple guests in the same room can add items to a shared basket.
- Auto-suggest Missing Items: suggest complementary items based on basket contents.
- Inventory Check: alert if item is unavailable before checkout.
- Quick Reorder: add previous basket items with one tap.
- Pre-order / Scheduled Order: submit basket for a future time (e.g., breakfast at 8 am).
- Edit / Remove Items easily before submission.
- Quantity Selector: adjust number of items or services.
- Cost Preview / Total: dynamic update of charges while adding/removing items.
- Apply Promo Codes or Discounts: for loyalty rewards or seasonal offers.
- Confirm / Modify Delivery Location: choose room, poolside, or other location.
- Track Basket Status: Payment Pending → Confirmed → On the way.
- One-click Checkout: seamless payment and confirmation.
- Receipt & History Link: view basket history and invoices in-app.

### 4.3 Personalisation & AI
- Guest profile recognition: auto-fill dietary restrictions, preferred pillow type, room lighting.
- AI-based recommendations: suggest food, wellness, or activities based on history.
- Mood-based customisation: suggest playlists, lighting, or room ambience based on chosen "mood".
- Predictive service reminders: prompt guest before usual meal or spa time.

### 4.4 Real-Time Communication
- In-app chat with reception / concierge: instant messaging.
- Push notifications for staff updates: guest notified when service is en-route.
- AI chatbot for FAQs: 24/7 automated support.
- Multi-language support: UI, messages, and chatbot respond in guest's preferred language.

### 4.5 Automation & IoT
- Smart room integration: adjust AC, lighting, curtains from the app.
- Automatic service triggers: room detects check-in → app recommends housekeeping, minibar refill.
- IoT sensors for energy efficiency: lights/AC auto-off when room empty.

### 4.6 Gamification & Engagement
- Achievements / badges: for using hotel services or eco-friendly options.
- Leaderboards or points for social sharing: engage guests with rewards.
- Mini-game challenges: for loyalty perks.

### 4.7 Analytics & Tracking
- Request history log: guest can see all previous orders/requests.
- Service ratings & feedback: guest can rate staff or services immediately.
- Predictive usage analytics: staff can forecast demand for meals or spa slots.
- Eco-tracking dashboard: track personal energy or waste reduction.

## 5. Request Processing & Notifications
- Each request tagged with:
  - Room number
  - Guest name
  - Timestamp
  - Service type
  - Request status (New → In Progress → Completed)
- Automatic notification sent to:
  - Reception dashboard
  - Relevant department (kitchen, housekeeping, maintenance)
- Real-time updates to staff dashboards.
- Push notifications or alerts for urgent requests.
- Escalation alerts for delayed requests.

## 6. Backend System Integration
- Integration with hotel backend system.
- Link requests to:
  - Guest reservation
  - Billing account (for chargeable services)
- Automatic logging of all requests under guest profile.
- Status tracking and audit logs.
- Ability to update request status (New → In Progress → Completed).

## 7. Staff Dashboard (Admin Panel)
- Centralised dashboard for all incoming requests.
- Filter by:
  - Room number
  - Service type
  - Status
- Assign tasks to staff members.
- Update request progress.
- Internal notes for staff communication.
- Performance tracking (response time, completion time).

## 8. Notifications & Communication
- Guest receives confirmation after submitting request.
- Optional notifications:
  - Request accepted
  - Service on the way
  - Completed
- Internal staff (reception) notifications for new requests.
- Escalation alerts for delayed requests.

## 9. Billing & Payments
- Automatic charge posting to room account.
- Display estimated costs before confirmation.
- Split payment: divide charges between room account, card, or loyalty points.
- In-app payment integration.
- Digital receipt generation (download, email, or print).
- Loyalty points redemption: use points for services instantly.

## 10. Reference Examples
- Hilton Honors App – mobile hotel app with mobile chat and service requests.
- Marriott Bonvoy App – order food & drinks ahead of time via mobile.
- Four Seasons Mobile App – personalise your stay with dining & experiences.
- citizenM Hotels – tech-forward hotel brand with smart room controls.
