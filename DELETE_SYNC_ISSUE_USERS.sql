-- ========================================
-- DELETE SYNC ISSUE USERS - PRODUCTION DATABASE
-- ========================================
-- 
-- This script completely deletes two users and all their related data
-- from the production database. No anonymization - complete deletion.
--
-- Users to delete:
-- 1. user_35zLCF4vxn3QHZPYZ1oJwuoxrTW
-- 2. user_35AzoSyWLvW8FL4LGgKvzfPv8F8
--
-- WARNING: This is a destructive operation. Run in a transaction first
-- to verify, then commit if everything looks correct.
--
-- NOTE: This script is synchronized with schema.sql. When schema.sql is updated,
-- this script should be updated to match the foreign key relationships.
--
-- ========================================
-- BEGIN TRANSACTION (uncomment to use)
-- ========================================
-- BEGIN;

-- ========================================
-- USER 1: user_35zLCF4vxn3QHZPYZ1oJwuoxrTW
-- ========================================

-- Payments (user_id and recorded_by both reference users.id directly)
DELETE FROM payments WHERE user_id = 'user_35zLCF4vxn3QHZPYZ1oJwuoxrTW';
DELETE FROM payments WHERE recorded_by = 'user_35zLCF4vxn3QHZPYZ1oJwuoxrTW';

-- Admin action logs (admin_id references users.id directly)
DELETE FROM admin_action_logs WHERE admin_id = 'user_35zLCF4vxn3QHZPYZ1oJwuoxrTW';

-- SupportMatch - Delete related data first
-- Messages: sender_id references support_match_profiles.user_id (not profile id)
-- Must delete messages BEFORE deleting profiles (foreign key constraint)
DELETE FROM messages WHERE sender_id = 'user_35zLCF4vxn3QHZPYZ1oJwuoxrTW'
OR partnership_id IN (
  SELECT id FROM partnerships WHERE user1_id = 'user_35zLCF4vxn3QHZPYZ1oJwuoxrTW'
  OR user2_id = 'user_35zLCF4vxn3QHZPYZ1oJwuoxrTW'
);
-- Delete partnerships before profiles (partnerships.user1_id and user2_id reference support_match_profiles.user_id)
DELETE FROM partnerships WHERE user1_id = 'user_35zLCF4vxn3QHZPYZ1oJwuoxrTW';
DELETE FROM partnerships WHERE user2_id = 'user_35zLCF4vxn3QHZPYZ1oJwuoxrTW';
-- Delete exclusions before profiles (exclusions reference support_match_profiles.user_id)
DELETE FROM exclusions WHERE user_id = 'user_35zLCF4vxn3QHZPYZ1oJwuoxrTW';
DELETE FROM exclusions WHERE excluded_user_id = 'user_35zLCF4vxn3QHZPYZ1oJwuoxrTW';
-- Delete reports before profiles (reports reference support_match_profiles.user_id)
DELETE FROM reports WHERE reporter_id = 'user_35zLCF4vxn3QHZPYZ1oJwuoxrTW';
DELETE FROM reports WHERE reported_user_id = 'user_35zLCF4vxn3QHZPYZ1oJwuoxrTW';
-- Finally delete the profile
DELETE FROM support_match_profiles WHERE user_id = 'user_35zLCF4vxn3QHZPYZ1oJwuoxrTW';

-- LightHouse - Delete related data first
-- Matches: delete where user is seeker OR where property host is the user
DELETE FROM lighthouse_matches WHERE seeker_id IN (
  SELECT id FROM lighthouse_profiles WHERE user_id = 'user_35zLCF4vxn3QHZPYZ1oJwuoxrTW'
) OR property_id IN (
  SELECT id FROM lighthouse_properties WHERE host_id IN (
    SELECT id FROM lighthouse_profiles WHERE user_id = 'user_35zLCF4vxn3QHZPYZ1oJwuoxrTW'
  )
);
DELETE FROM lighthouse_properties WHERE host_id IN (
  SELECT id FROM lighthouse_profiles WHERE user_id = 'user_35zLCF4vxn3QHZPYZ1oJwuoxrTW'
);
DELETE FROM lighthouse_profiles WHERE user_id = 'user_35zLCF4vxn3QHZPYZ1oJwuoxrTW';

-- SocketRelay - All reference users.id directly (not through profiles)
-- Delete messages: where user is sender OR where message is in any fulfillment related to user
DELETE FROM socketrelay_messages WHERE sender_id = 'user_35zLCF4vxn3QHZPYZ1oJwuoxrTW'
OR fulfillment_id IN (
  SELECT id FROM socketrelay_fulfillments WHERE fulfiller_user_id = 'user_35zLCF4vxn3QHZPYZ1oJwuoxrTW'
  OR closed_by = 'user_35zLCF4vxn3QHZPYZ1oJwuoxrTW'
  OR request_id IN (
    SELECT id FROM socketrelay_requests WHERE user_id = 'user_35zLCF4vxn3QHZPYZ1oJwuoxrTW'
  )
);
-- Delete fulfillments: where user is fulfiller, where user closed it, OR where fulfillment is for user's requests
DELETE FROM socketrelay_fulfillments WHERE fulfiller_user_id = 'user_35zLCF4vxn3QHZPYZ1oJwuoxrTW'
OR closed_by = 'user_35zLCF4vxn3QHZPYZ1oJwuoxrTW'
OR request_id IN (
  SELECT id FROM socketrelay_requests WHERE user_id = 'user_35zLCF4vxn3QHZPYZ1oJwuoxrTW'
);
-- Delete requests (references users.id directly)
DELETE FROM socketrelay_requests WHERE user_id = 'user_35zLCF4vxn3QHZPYZ1oJwuoxrTW';
-- Finally delete the profile
DELETE FROM socketrelay_profiles WHERE user_id = 'user_35zLCF4vxn3QHZPYZ1oJwuoxrTW';

-- Directory
DELETE FROM directory_profiles WHERE user_id = 'user_35zLCF4vxn3QHZPYZ1oJwuoxrTW';

-- TrustTransport - rider_id references users.id directly (not through profiles)
DELETE FROM trusttransport_ride_requests WHERE rider_id = 'user_35zLCF4vxn3QHZPYZ1oJwuoxrTW';
DELETE FROM trusttransport_profiles WHERE user_id = 'user_35zLCF4vxn3QHZPYZ1oJwuoxrTW';

-- MechanicMatch - All owner_id, reviewer_id, sender_id, recipient_id reference users.id directly
-- Delete messages first
DELETE FROM mechanicmatch_messages WHERE sender_id = 'user_35zLCF4vxn3QHZPYZ1oJwuoxrTW';
DELETE FROM mechanicmatch_messages WHERE recipient_id = 'user_35zLCF4vxn3QHZPYZ1oJwuoxrTW';
-- Delete reviews (reviewer_id references users.id directly)
DELETE FROM mechanicmatch_reviews WHERE reviewer_id = 'user_35zLCF4vxn3QHZPYZ1oJwuoxrTW';
-- Delete jobs (owner_id references users.id directly)
DELETE FROM mechanicmatch_jobs WHERE owner_id = 'user_35zLCF4vxn3QHZPYZ1oJwuoxrTW';
-- Delete service requests (owner_id references users.id directly)
DELETE FROM mechanicmatch_service_requests WHERE owner_id = 'user_35zLCF4vxn3QHZPYZ1oJwuoxrTW';
-- Delete vehicles (owner_id references users.id directly)
DELETE FROM mechanicmatch_vehicles WHERE owner_id = 'user_35zLCF4vxn3QHZPYZ1oJwuoxrTW';
-- Finally delete the profile
DELETE FROM mechanicmatch_profiles WHERE user_id = 'user_35zLCF4vxn3QHZPYZ1oJwuoxrTW';

-- NPS Responses (user_id references users.id directly)
DELETE FROM nps_responses WHERE user_id = 'user_35zLCF4vxn3QHZPYZ1oJwuoxrTW';

-- Research - Delete related data first
-- Reports: user_id references users.id directly, reviewed_by references users.id directly
DELETE FROM research_reports WHERE user_id = 'user_35zLCF4vxn3QHZPYZ1oJwuoxrTW';
DELETE FROM research_reports WHERE reviewed_by = 'user_35zLCF4vxn3QHZPYZ1oJwuoxrTW';
-- Cards are linked through columns -> boards, so delete cards from columns in user's boards
DELETE FROM research_cards WHERE column_id IN (
  SELECT id FROM research_columns WHERE board_id IN (
    SELECT id FROM research_boards WHERE user_id = 'user_35zLCF4vxn3QHZPYZ1oJwuoxrTW'
  )
);
DELETE FROM research_columns WHERE board_id IN (
  SELECT id FROM research_boards WHERE user_id = 'user_35zLCF4vxn3QHZPYZ1oJwuoxrTW'
);
DELETE FROM research_boards WHERE user_id = 'user_35zLCF4vxn3QHZPYZ1oJwuoxrTW';
-- Follows: user_id and followed_user_id both reference users.id directly
DELETE FROM research_follows WHERE user_id = 'user_35zLCF4vxn3QHZPYZ1oJwuoxrTW';
DELETE FROM research_follows WHERE followed_user_id = 'user_35zLCF4vxn3QHZPYZ1oJwuoxrTW';
-- Bookmarks, votes, comments, answers, items: all user_id reference users.id directly
DELETE FROM research_bookmarks WHERE user_id = 'user_35zLCF4vxn3QHZPYZ1oJwuoxrTW';
DELETE FROM research_votes WHERE user_id = 'user_35zLCF4vxn3QHZPYZ1oJwuoxrTW';
DELETE FROM research_comments WHERE user_id = 'user_35zLCF4vxn3QHZPYZ1oJwuoxrTW';
-- Link provenances are linked through answers, so delete provenances from answers created by user OR answers on user's items
DELETE FROM research_link_provenances WHERE answer_id IN (
  SELECT id FROM research_answers WHERE user_id = 'user_35zLCF4vxn3QHZPYZ1oJwuoxrTW'
  OR research_item_id IN (
    SELECT id FROM research_items WHERE user_id = 'user_35zLCF4vxn3QHZPYZ1oJwuoxrTW'
  )
);
DELETE FROM research_answers WHERE user_id = 'user_35zLCF4vxn3QHZPYZ1oJwuoxrTW';
DELETE FROM research_items WHERE user_id = 'user_35zLCF4vxn3QHZPYZ1oJwuoxrTW';

-- GentlePulse
-- Note: GentlePulse tables use client_id (anonymous), not user_id, so no user-specific data to delete

-- Profile deletion logs (user_id references users.id directly)
DELETE FROM profile_deletion_logs WHERE user_id = 'user_35zLCF4vxn3QHZPYZ1oJwuoxrTW';

-- Finally, delete the user
DELETE FROM users WHERE id = 'user_35zLCF4vxn3QHZPYZ1oJwuoxrTW';

-- ========================================
-- USER 2: user_35AzoSyWLvW8FL4LGgKvzfPv8F8
-- ========================================

-- Payments (user_id and recorded_by both reference users.id directly)
DELETE FROM payments WHERE user_id = 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8';
DELETE FROM payments WHERE recorded_by = 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8';

-- Admin action logs (admin_id references users.id directly)
DELETE FROM admin_action_logs WHERE admin_id = 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8';

-- SupportMatch - Delete related data first
-- Messages: sender_id references support_match_profiles.user_id (not profile id)
-- Must delete messages BEFORE deleting profiles (foreign key constraint)
DELETE FROM messages WHERE sender_id = 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8'
OR partnership_id IN (
  SELECT id FROM partnerships WHERE user1_id = 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8'
  OR user2_id = 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8'
);
-- Delete partnerships before profiles (partnerships.user1_id and user2_id reference support_match_profiles.user_id)
DELETE FROM partnerships WHERE user1_id = 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8';
DELETE FROM partnerships WHERE user2_id = 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8';
-- Delete exclusions before profiles (exclusions reference support_match_profiles.user_id)
DELETE FROM exclusions WHERE user_id = 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8';
DELETE FROM exclusions WHERE excluded_user_id = 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8';
-- Delete reports before profiles (reports reference support_match_profiles.user_id)
DELETE FROM reports WHERE reporter_id = 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8';
DELETE FROM reports WHERE reported_user_id = 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8';
-- Finally delete the profile
DELETE FROM support_match_profiles WHERE user_id = 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8';

-- LightHouse - Delete related data first
-- Matches: delete where user is seeker OR where property host is the user
DELETE FROM lighthouse_matches WHERE seeker_id IN (
  SELECT id FROM lighthouse_profiles WHERE user_id = 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8'
) OR property_id IN (
  SELECT id FROM lighthouse_properties WHERE host_id IN (
    SELECT id FROM lighthouse_profiles WHERE user_id = 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8'
  )
);
DELETE FROM lighthouse_properties WHERE host_id IN (
  SELECT id FROM lighthouse_profiles WHERE user_id = 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8'
);
DELETE FROM lighthouse_profiles WHERE user_id = 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8';

-- SocketRelay - All reference users.id directly (not through profiles)
-- Delete messages: where user is sender OR where message is in any fulfillment related to user
DELETE FROM socketrelay_messages WHERE sender_id = 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8'
OR fulfillment_id IN (
  SELECT id FROM socketrelay_fulfillments WHERE fulfiller_user_id = 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8'
  OR closed_by = 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8'
  OR request_id IN (
    SELECT id FROM socketrelay_requests WHERE user_id = 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8'
  )
);
-- Delete fulfillments: where user is fulfiller, where user closed it, OR where fulfillment is for user's requests
DELETE FROM socketrelay_fulfillments WHERE fulfiller_user_id = 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8'
OR closed_by = 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8'
OR request_id IN (
  SELECT id FROM socketrelay_requests WHERE user_id = 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8'
);
-- Delete requests (references users.id directly)
DELETE FROM socketrelay_requests WHERE user_id = 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8';
-- Finally delete the profile
DELETE FROM socketrelay_profiles WHERE user_id = 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8';

-- Directory
DELETE FROM directory_profiles WHERE user_id = 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8';

-- TrustTransport - rider_id references users.id directly (not through profiles)
DELETE FROM trusttransport_ride_requests WHERE rider_id = 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8';
DELETE FROM trusttransport_profiles WHERE user_id = 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8';

-- MechanicMatch - All owner_id, reviewer_id, sender_id, recipient_id reference users.id directly
-- Delete messages first
DELETE FROM mechanicmatch_messages WHERE sender_id = 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8';
DELETE FROM mechanicmatch_messages WHERE recipient_id = 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8';
-- Delete reviews (reviewer_id references users.id directly)
DELETE FROM mechanicmatch_reviews WHERE reviewer_id = 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8';
-- Delete jobs (owner_id references users.id directly)
DELETE FROM mechanicmatch_jobs WHERE owner_id = 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8';
-- Delete service requests (owner_id references users.id directly)
DELETE FROM mechanicmatch_service_requests WHERE owner_id = 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8';
-- Delete vehicles (owner_id references users.id directly)
DELETE FROM mechanicmatch_vehicles WHERE owner_id = 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8';
-- Finally delete the profile
DELETE FROM mechanicmatch_profiles WHERE user_id = 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8';

-- NPS Responses (user_id references users.id directly)
DELETE FROM nps_responses WHERE user_id = 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8';

-- Research - Delete related data first
-- Reports: user_id references users.id directly, reviewed_by references users.id directly
DELETE FROM research_reports WHERE user_id = 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8';
DELETE FROM research_reports WHERE reviewed_by = 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8';
-- Cards are linked through columns -> boards, so delete cards from columns in user's boards
DELETE FROM research_cards WHERE column_id IN (
  SELECT id FROM research_columns WHERE board_id IN (
    SELECT id FROM research_boards WHERE user_id = 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8'
  )
);
DELETE FROM research_columns WHERE board_id IN (
  SELECT id FROM research_boards WHERE user_id = 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8'
);
DELETE FROM research_boards WHERE user_id = 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8';
-- Follows: user_id and followed_user_id both reference users.id directly
DELETE FROM research_follows WHERE user_id = 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8';
DELETE FROM research_follows WHERE followed_user_id = 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8';
-- Bookmarks, votes, comments, answers, items: all user_id reference users.id directly
DELETE FROM research_bookmarks WHERE user_id = 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8';
DELETE FROM research_votes WHERE user_id = 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8';
DELETE FROM research_comments WHERE user_id = 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8';
-- Link provenances are linked through answers, so delete provenances from answers created by user OR answers on user's items
DELETE FROM research_link_provenances WHERE answer_id IN (
  SELECT id FROM research_answers WHERE user_id = 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8'
  OR research_item_id IN (
    SELECT id FROM research_items WHERE user_id = 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8'
  )
);
DELETE FROM research_answers WHERE user_id = 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8';
DELETE FROM research_items WHERE user_id = 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8';

-- GentlePulse
-- Note: GentlePulse tables use client_id (anonymous), not user_id, so no user-specific data to delete

-- Profile deletion logs (user_id references users.id directly)
DELETE FROM profile_deletion_logs WHERE user_id = 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8';

-- Finally, delete the user
DELETE FROM users WHERE id = 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8';

-- ========================================
-- COMMIT TRANSACTION (uncomment to commit)
-- ========================================
-- COMMIT;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================
-- Run these after deletion to verify:

-- Check if users are deleted
-- SELECT id, email FROM users WHERE id IN ('user_35zLCF4vxn3QHZPYZ1oJwuoxrTW', 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8');

-- Check for any remaining references (should return 0 rows)
-- SELECT 'payments' as table_name, COUNT(*) as count FROM payments WHERE user_id IN ('user_35zLCF4vxn3QHZPYZ1oJwuoxrTW', 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8')
-- UNION ALL
-- SELECT 'admin_action_logs', COUNT(*) FROM admin_action_logs WHERE admin_id IN ('user_35zLCF4vxn3QHZPYZ1oJwuoxrTW', 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8')
-- UNION ALL
-- SELECT 'support_match_profiles', COUNT(*) FROM support_match_profiles WHERE user_id IN ('user_35zLCF4vxn3QHZPYZ1oJwuoxrTW', 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8')
-- UNION ALL
-- SELECT 'lighthouse_profiles', COUNT(*) FROM lighthouse_profiles WHERE user_id IN ('user_35zLCF4vxn3QHZPYZ1oJwuoxrTW', 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8')
-- UNION ALL
-- SELECT 'socketrelay_profiles', COUNT(*) FROM socketrelay_profiles WHERE user_id IN ('user_35zLCF4vxn3QHZPYZ1oJwuoxrTW', 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8')
-- UNION ALL
-- SELECT 'directory_profiles', COUNT(*) FROM directory_profiles WHERE user_id IN ('user_35zLCF4vxn3QHZPYZ1oJwuoxrTW', 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8')
-- UNION ALL
-- SELECT 'trusttransport_profiles', COUNT(*) FROM trusttransport_profiles WHERE user_id IN ('user_35zLCF4vxn3QHZPYZ1oJwuoxrTW', 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8')
-- UNION ALL
-- SELECT 'mechanicmatch_profiles', COUNT(*) FROM mechanicmatch_profiles WHERE user_id IN ('user_35zLCF4vxn3QHZPYZ1oJwuoxrTW', 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8')
-- UNION ALL
-- SELECT 'nps_responses', COUNT(*) FROM nps_responses WHERE user_id IN ('user_35zLCF4vxn3QHZPYZ1oJwuoxrTW', 'user_35AzoSyWLvW8FL4LGgKvzfPv8F8');

