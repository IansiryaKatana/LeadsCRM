-- Migration: Style email templates to be more beautiful and colorful
-- Purpose: Enhance the UI/UX of emails sent to leads

UPDATE public.email_templates
SET subject = CASE
  WHEN category = 'welcome' THEN 'Welcome to Urban Hub Students Accommodations - {{lead_name}}'
  WHEN category = 'followup_1' THEN 'Following up on your accommodation inquiry - {{lead_name}}'
  WHEN category = 'followup_2' THEN 'Still interested in Urban Hub accommodation? - {{lead_name}}'
  WHEN category = 'followup_3' THEN 'Last chance - Urban Hub Accommodation availability - {{lead_name}}'
  WHEN category = 'conversion' THEN 'Congratulations! Your booking is confirmed - {{lead_name}}'
  ELSE subject
END,
body_html = CASE 
  WHEN category = 'welcome' THEN 
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        .email-container { font-family: ''Inter Tight'', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #51A6FF 0%, #3b82f6 100%); padding: 50px 20px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-family: ''Big Shoulders Display'', sans-serif; font-size: 32px; font-weight: 900; letter-spacing: 0.05em; text-transform: uppercase; }
        .accent-bar { height: 8px; background: #FFD700; }
        .content { padding: 45px 35px; line-height: 1.7; color: #374151; }
        .content h2 { color: #111827; font-size: 28px; margin-top: 0; font-family: ''Big Shoulders Display'', sans-serif; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #eff6ff; padding-bottom: 10px; margin-bottom: 25px; }
        .room-badge { display: inline-block; background: #eff6ff; color: #3b82f6; padding: 6px 16px; border-radius: 9999px; font-weight: 700; font-size: 15px; margin: 10px 0; border: 1px solid #dbeafe; }
        .footer { background: #f9fafb; padding: 35px; text-align: center; border-top: 1px solid #f3f4f6; color: #6b7280; font-size: 14px; }
        .footer-logo { font-family: ''Big Shoulders Display'', sans-serif; font-weight: 800; font-size: 20px; color: #d1d5db; margin-bottom: 15px; }
        .highlight { color: #3b82f6; font-weight: 700; }
    </style>
</head>
<body style="background-color: #f3f4f6; padding: 40px 20px;">
    <!-- Intellectual Property of Ian Katana -->
    <div class="email-container">
        <div class="header">
            <h1>URBAN HUB</h1>
        </div>
        <div class="accent-bar"></div>
        <div class="content">
            <h2>Hello {{lead_name}},</h2>
            <p>Thank you for your interest in <span class="highlight">Urban Hub Students Accommodations</span>!</p>
            <p>We received your inquiry about our <span class="room-badge">{{room_choice}}</span> room option and we''re excited to help you find the perfect accommodation for your studies.</p>
            <p>Our dedicated team is already reviewing your details and will be in touch with you shortly to discuss your requirements and answer any questions you may have.</p>
            <p>In the meantime, feel free to check out our latest student life updates on our website.</p>
            <p style="margin-top: 30px;">Best regards,<br><strong style="color: #3b82f6;">Urban Hub Team</strong></p>
        </div>
        <div class="footer">
            <div class="footer-logo">URBAN HUB</div>
            <p>&copy; 2026 Urban Hub Students Accommodations. All rights reserved.</p>
            <p>Premium Student Living | Quality & Comfort</p>
        </div>
    </div>
</body>
</html>'
  WHEN category = 'followup_1' THEN
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        .email-container { font-family: ''Inter Tight'', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #51A6FF 0%, #3b82f6 100%); padding: 50px 20px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-family: ''Big Shoulders Display'', sans-serif; font-size: 32px; font-weight: 900; letter-spacing: 0.05em; text-transform: uppercase; }
        .accent-bar { height: 8px; background: #FFD700; }
        .content { padding: 45px 35px; line-height: 1.7; color: #374151; }
        .content h2 { color: #111827; font-size: 28px; margin-top: 0; font-family: ''Big Shoulders Display'', sans-serif; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #eff6ff; padding-bottom: 10px; margin-bottom: 25px; }
        .room-badge { display: inline-block; background: #eff6ff; color: #3b82f6; padding: 6px 16px; border-radius: 9999px; font-weight: 700; font-size: 15px; margin: 10px 0; border: 1px solid #dbeafe; }
        .footer { background: #f9fafb; padding: 35px; text-align: center; border-top: 1px solid #f3f4f6; color: #6b7280; font-size: 14px; }
        .footer-logo { font-family: ''Big Shoulders Display'', sans-serif; font-weight: 800; font-size: 20px; color: #d1d5db; margin-bottom: 15px; }
        .highlight { color: #3b82f6; font-weight: 700; }
    </style>
</head>
<body style="background-color: #f3f4f6; padding: 40px 20px;">
    <!-- Intellectual Property of Ian Katana -->
    <div class="email-container">
        <div class="header">
            <h1>URBAN HUB</h1>
        </div>
        <div class="accent-bar"></div>
        <div class="content">
            <h2>Hi {{lead_name}},</h2>
            <p>We wanted to quickly follow up on your recent inquiry about our <span class="room-badge">{{room_choice}}</span> accommodation.</p>
            <p>Have you had a chance to review our options? We''d love to answer any questions you might have and help you find the perfect room for your needs.</p>
            <p>We are seeing <span class="highlight">high demand</span> for our rooms this season, so we want to make sure you don''t miss out!</p>
            <p>Please feel free to reply to this email or give us a call at your convenience.</p>
            <p style="margin-top: 30px;">Best regards,<br><strong style="color: #3b82f6;">Urban Hub Team</strong></p>
        </div>
        <div class="footer">
            <div class="footer-logo">URBAN HUB</div>
            <p>&copy; 2026 Urban Hub Students Accommodations. All rights reserved.</p>
            <p>Premium Student Living | Quality & Comfort</p>
        </div>
    </div>
</body>
</html>'
  WHEN category = 'followup_2' THEN
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        .email-container { font-family: ''Inter Tight'', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #FFD700 0%, #facc15 100%); padding: 50px 20px; text-align: center; color: #000000; }
        .header h1 { margin: 0; font-family: ''Big Shoulders Display'', sans-serif; font-size: 32px; font-weight: 900; letter-spacing: 0.05em; text-transform: uppercase; }
        .accent-bar { height: 8px; background: #51A6FF; }
        .content { padding: 45px 35px; line-height: 1.7; color: #374151; }
        .content h2 { color: #111827; font-size: 28px; margin-top: 0; font-family: ''Big Shoulders Display'', sans-serif; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #fef3c7; padding-bottom: 10px; margin-bottom: 25px; }
        .highlight { color: #3b82f6; font-weight: 800; }
        .footer { background: #f9fafb; padding: 35px; text-align: center; border-top: 1px solid #f3f4f6; color: #6b7280; font-size: 14px; }
        .footer-logo { font-family: ''Big Shoulders Display'', sans-serif; font-weight: 800; font-size: 20px; color: #d1d5db; margin-bottom: 15px; }
    </style>
</head>
<body style="background-color: #f3f4f6; padding: 40px 20px;">
    <!-- Intellectual Property of Ian Katana -->
    <div class="email-container">
        <div class="header">
            <h1>URBAN HUB</h1>
        </div>
        <div class="accent-bar"></div>
        <div class="content">
            <h2>Still interested, {{lead_name}}?</h2>
            <p>We haven''t heard from you in a while and wanted to check if you''re still interested in our {{room_choice}} accommodation.</p>
            <p>We have <span class="highlight">limited availability</span> remaining, and rooms are being booked quickly. We''d love to help you secure your preferred room before it''s gone!</p>
            <p>If you have any questions or concerns, please don''t hesitate to reach out. We''re here to help!</p>
            <p style="margin-top: 30px;">Best regards,<br><strong style="color: #3b82f6;">Urban Hub Team</strong></p>
        </div>
        <div class="footer">
            <div class="footer-logo">URBAN HUB</div>
            <p>&copy; 2026 Urban Hub Students Accommodations. All rights reserved.</p>
            <p>Premium Student Living | Quality & Comfort</p>
        </div>
    </div>
</body>
</html>'
  WHEN category = 'followup_3' THEN
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        .email-container { font-family: ''Inter Tight'', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); padding: 50px 20px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-family: ''Big Shoulders Display'', sans-serif; font-size: 32px; font-weight: 900; letter-spacing: 0.05em; text-transform: uppercase; }
        .accent-bar { height: 8px; background: #FFD700; }
        .content { padding: 45px 35px; line-height: 1.7; color: #374151; }
        .content h2 { color: #111827; font-size: 28px; margin-top: 0; font-family: ''Big Shoulders Display'', sans-serif; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #fee2e2; padding-bottom: 10px; margin-bottom: 25px; }
        .footer { background: #f9fafb; padding: 35px; text-align: center; border-top: 1px solid #f3f4f6; color: #6b7280; font-size: 14px; }
        .footer-logo { font-family: ''Big Shoulders Display'', sans-serif; font-weight: 800; font-size: 20px; color: #d1d5db; margin-bottom: 15px; }
    </style>
</head>
<body style="background-color: #f3f4f6; padding: 40px 20px;">
    <!-- Intellectual Property of Ian Katana -->
    <div class="email-container">
        <div class="header">
            <h1>URBAN HUB</h1>
        </div>
        <div class="accent-bar"></div>
        <div class="content">
            <h2>Last chance, {{lead_name}}!</h2>
            <p>This is our final follow-up regarding your interest in our {{room_choice}} accommodation.</p>
            <p>We understand you may still be considering your options, and we''re here to help make your decision easier. If you''d like to discuss your requirements or schedule a viewing, please let us know today.</p>
            <p>If we don''t hear from you, we''ll assume you''ve found alternative accommodation and will update our records accordingly.</p>
            <p style="margin-top: 30px;">Best regards,<br><strong style="color: #3b82f6;">Urban Hub Team</strong></p>
        </div>
        <div class="footer">
            <div class="footer-logo">URBAN HUB</div>
            <p>&copy; 2026 Urban Hub Students Accommodations. All rights reserved.</p>
            <p>Premium Student Living | Quality & Comfort</p>
        </div>
    </div>
</body>
</html>'
  WHEN category = 'conversion' THEN
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        .email-container { font-family: ''Inter Tight'', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 50px 20px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-family: ''Big Shoulders Display'', sans-serif; font-size: 32px; font-weight: 900; letter-spacing: 0.05em; text-transform: uppercase; }
        .accent-bar { height: 8px; background: #FFD700; }
        .content { padding: 45px 35px; line-height: 1.7; color: #374151; }
        .content h2 { color: #111827; font-size: 28px; margin-top: 0; font-family: ''Big Shoulders Display'', sans-serif; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #ecfdf5; padding-bottom: 10px; margin-bottom: 25px; }
        .details-card { background: #f0fdf4; border: 2px dashed #10b981; border-radius: 16px; padding: 25px; margin: 30px 0; }
        .details-card h3 { margin-top: 0; color: #065f46; font-size: 20px; font-family: ''Big Shoulders Display'', sans-serif; font-weight: 800; text-transform: uppercase; }
        .details-list { list-style: none; padding: 0; margin: 0; }
        .details-list li { margin-bottom: 12px; color: #065f46; font-size: 16px; display: flex; align-items: center; }
        .details-list li strong { min-width: 120px; display: inline-block; }
        .footer { background: #f9fafb; padding: 35px; text-align: center; border-top: 1px solid #f3f4f6; color: #6b7280; font-size: 14px; }
        .footer-logo { font-family: ''Big Shoulders Display'', sans-serif; font-weight: 800; font-size: 20px; color: #d1d5db; margin-bottom: 15px; }
    </style>
</head>
<body style="background-color: #f3f4f6; padding: 40px 20px;">
    <!-- Intellectual Property of Ian Katana -->
    <div class="email-container">
        <div class="header">
            <h1>URBAN HUB</h1>
        </div>
        <div class="accent-bar"></div>
        <div class="content">
            <h2>Congratulations, {{lead_name}}!</h2>
            <p>We''re thrilled to confirm your booking for our <strong style="color: #10b981;">{{room_choice}}</strong> accommodation. You''ve made an excellent choice for your future!</p>
            
            <div class="details-card">
                <h3>Your Booking Confirmation</h3>
                <ul class="details-list">
                    <li><strong>Room Type:</strong> {{room_choice}}</li>
                    <li><strong>Stay Duration:</strong> {{stay_duration}}</li>
                    <li><strong>Total Value:</strong> {{revenue}}</li>
                </ul>
            </div>

            <p>Our team is currently preparing everything for your arrival. We will be in touch shortly with the next steps and additional information regarding your move-in.</p>
            <p>Welcome to the <strong style="color: #10b981;">Urban Hub community</strong>! We can''t wait to have you.</p>
            <p style="margin-top: 30px;">Best regards,<br><strong style="color: #10b981;">Urban Hub Team</strong></p>
        </div>
        <div class="footer">
            <div class="footer-logo">URBAN HUB</div>
            <p>&copy; 2026 Urban Hub Students Accommodations. All rights reserved.</p>
            <p>Premium Student Living | Quality & Comfort</p>
        </div>
    </div>
</body>
</html>'
  ELSE body_html
END;

