TRUNCATE TABLE users, users_messier, rooms, transactions, projector_history, room_lock_history CASCADE;

BEGIN;

INSERT INTO users (id, name, flazz, hash_pass, initial) VALUES
('usr-001', 'Rafael_Febrian', 'FLZ88219', crypt('FB25-1FB25-1FB25-1', gen_salt('bf')), 'FB25-1'),
('usr-002', 'Jojokowi', 'FLZ99100', crypt('NG25-1NG25-1NG25-1', gen_salt('bf')), 'NG25-1'),
('usr-003', 'Alin_Lorentz', 'FLZ77210', crypt('OI25-1OI25-1OI25-1', gen_salt('bf')), 'OI25-1'),
('usr-004', 'Yang_Mulia_King_Mosex', 'FLZ11223', crypt('SAYAADALAHKINGMOSEX', gen_salt('bf')), 'ES25-1');

INSERT INTO users_messier (flazz_id, initial, messier_password) VALUES
('1F913EEC', 'OI25-1', 'febritulol'),
('7F5F5EDE', 'ES25-1', 'SAYAADALAHKINGMOSEX'),
('7F4C6BD3', 'FB25-1', 'BFBFBF25-1'),
('FLZ99100', 'NG25-1', 'NG25-1NG25-1NG25-1');


INSERT INTO rooms (id, num, status, projector_status, projector_last_on, projector_last_off) VALUES
('rm-626', 626, 'open', FALSE, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day 22 hours'),
('rm-727', 727, 'open', TRUE, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 day'),
('rm-725', 725, 'closed', FALSE, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day 22 hours'),
('rm-729', 729, 'open', FALSE, NOW() - INTERVAL '5 hours', NOW() - INTERVAL '4 hours');

INSERT INTO transactions (id, user_id, room_id, typed_at) VALUES
('trx-001', 'usr-001', 'rm-727', NOW() - INTERVAL '2 hours 10 minutes'),
('trx-002', 'usr-003', 'rm-725', NOW() - INTERVAL '2 days 2 hours'),
('trx-003', 'usr-002', 'rm-729', NOW() - INTERVAL '5 hours 10 minutes'),
('trx-004', 'usr-001', 'rm-727', NOW() - INTERVAL '10 minutes');


INSERT INTO projector_history (id, room_id, turned_on_at, turned_off_at) VALUES
('ph-001', 'rm-727', NOW() - INTERVAL '2 hours', NULL),
('ph-002', 'rm-727', NOW() - INTERVAL '1 day 4 hours', NOW() - INTERVAL '1 day 1 hour'),
('ph-003', 'rm-725', NOW() - INTERVAL '1 day 5 hours', NOW() - INTERVAL '1 day 2 hours'),
('ph-004', 'rm-725', NOW() - INTERVAL '2 days 2 hours', NOW() - INTERVAL '1 day 22 hours'),
('ph-005', 'rm-729', NOW() - INTERVAL '3 days 6 hours', NOW() - INTERVAL '3 days 2 hours');


INSERT INTO room_lock_history (id, room_id, status, recorded_at) VALUES
('rlh-001', 'rm-727', 'open', NOW() - INTERVAL '8 hours'),
('rlh-002', 'rm-727', 'closed', NOW() - INTERVAL '5 hours'),
('rlh-003', 'rm-727', 'open', NOW() - INTERVAL '2 hours 15 minutes'), 

('rlh-004', 'rm-725', 'open', NOW() - INTERVAL '2 days 3 hours'),
('rlh-005', 'rm-725', 'closed', NOW() - INTERVAL '1 day 21 hours'),

('rlh-006', 'rm-729', 'open', NOW() - INTERVAL '6 hours'),
('rlh-007', 'rm-729', 'closed', NOW() - INTERVAL '4 hours'),
('rlh-008', 'rm-729', 'open', NOW() - INTERVAL '1 hour'); 

COMMIT;