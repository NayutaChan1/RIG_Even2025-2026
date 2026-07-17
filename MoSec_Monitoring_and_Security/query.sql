-- =========================
-- USERS
-- =========================
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    flazz CHAR(8),
    hash_pass VARCHAR(255) NOT NULL,
    initial TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- USERS_MESSIER (Flazz card -> Messier credentials)
-- =========================
CREATE TABLE users_messier (
    flazz_id CHAR(8) PRIMARY KEY,
    initial TEXT NOT NULL,
    messier_password VARCHAR(255) NOT NULL
);

-- =========================
-- ROOMS
-- =========================
CREATE TABLE rooms (
    id TEXT PRIMARY KEY,
    num INTEGER NOT NULL,
    status TEXT CHECK (status IN ('open', 'closed')) NOT NULL,

    -- PROJECTOR CURRENT STATE
    projector_status BOOLEAN DEFAULT FALSE,
    projector_last_on TIMESTAMP,
    projector_last_off TIMESTAMP
);

-- =========================
-- TRANSACTIONS
-- =========================
CREATE TABLE transactions (
    id TEXT PRIMARY KEY,
    typed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id TEXT NOT NULL,
    room_id TEXT NOT NULL,

    CONSTRAINT fk_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_room
        FOREIGN KEY (room_id)
        REFERENCES rooms(id)
        ON DELETE CASCADE
);

-- =========================
-- PROJECTOR HISTORY
-- =========================
CREATE TABLE projector_history (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL,
    turned_on_at TIMESTAMP,
    turned_off_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_room_history
        FOREIGN KEY (room_id)
        REFERENCES rooms(id)
        ON DELETE CASCADE
);

CREATE TABLE room_lock_history (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL,
    status TEXT CHECK (status IN ('open', 'closed')) NOT NULL,
    
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_room_lock_history
        FOREIGN KEY (room_id)
        REFERENCES rooms(id)
        ON DELETE CASCADE
);