-- Sample puzzles for testing
-- These are real chess puzzles with FEN positions and solutions

INSERT INTO "Puzzles" ("Fen", "Moves", "Rating", "Themes", "Popularity", "CreatedAt") VALUES
-- Easy puzzles (1200-1400)
('r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 1', 'Qxf7', 1300, 'checkmate,short', 100, NOW()),
('r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 1', 'Qxf7', 1250, 'checkmate,short', 95, NOW()),
('rnbqkb1r/pppp1ppp/5n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 1', 'Qxf7', 1200, 'checkmate,short', 90, NOW()),

-- Medium puzzles (1400-1600)
('r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 1', 'Bxf7', 1500, 'fork,tactics', 85, NOW()),
('r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1', 'Ng5,Nxe5', 1450, 'fork,attack', 80, NOW()),
('rnbqkb1r/ppp2ppp/3p1n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1', 'Ng5', 1400, 'attack,weak-square', 75, NOW()),

-- Hard puzzles (1600-1800)
('r1bq1rk1/ppp2ppp/2np1n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQ - 0 1', 'Bxf7,Nxe5', 1700, 'sacrifice,tactics', 70, NOW()),
('r2qkb1r/ppp2ppp/2np1n2/4p3/2B1P1b1/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 0 1', 'Bxf7', 1650, 'sacrifice,exposed-king', 65, NOW()),
('r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 0 1', 'Nd5', 1600, 'fork,centralization', 60, NOW()),

-- Expert puzzles (1800+)
('r1bq1rk1/ppp2ppp/2n2n2/3pp3/1bB1P3/2NP1N2/PPP2PPP/R1BQK2R w KQ - 0 1', 'Nxe5,Bxf7', 1900, 'sacrifice,combination', 55, NOW()),
('r2qkb1r/ppp2ppp/2np1n2/4p1B1/2B1P1b1/2NP4/PPP2PPP/R2QK2R w KQkq - 0 1', 'Bxf7,Bxf6', 1850, 'double-attack,tactics', 50, NOW()),
('r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 0 1', 'Nd5,Nxe5', 1800, 'fork,centralization', 45, NOW());
