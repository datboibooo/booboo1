-- LeadDrip Database Schema
-- Initial migration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Configurations (versioned JSON)
CREATE TABLE user_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    version INTEGER NOT NULL DEFAULT 1,
    config JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, version)
);

-- Create index for fast user config lookup
CREATE INDEX idx_user_configs_user_id ON user_configs(user_id);
CREATE INDEX idx_user_configs_user_version ON user_configs(user_id, version DESC);

-- Lists (hunt segments or watch lists)
CREATE TABLE lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('hunt', 'watch')),
    description TEXT,
    archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lists_user_id ON lists(user_id);
CREATE INDEX idx_lists_type ON lists(user_id, type);

-- List Accounts (domains in watch lists)
CREATE TABLE list_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    domain VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
    current_score INTEGER,
    last_scored_at TIMESTAMPTZ,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(list_id, domain)
);

CREATE INDEX idx_list_accounts_list_id ON list_accounts(list_id);
CREATE INDEX idx_list_accounts_domain ON list_accounts(domain);

-- Leads (generated results from hunt mode)
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    run_id UUID,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    domain VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    industry VARCHAR(255),
    geo VARCHAR(255),
    score INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
    why_now TEXT NOT NULL,
    triggered_signals JSONB NOT NULL DEFAULT '[]',
    evidence_urls TEXT[] NOT NULL DEFAULT '{}',
    evidence_snippets TEXT[] NOT NULL DEFAULT '{}',
    linkedin_search_url TEXT NOT NULL,
    linkedin_search_query TEXT NOT NULL,
    target_titles TEXT[] NOT NULL DEFAULT '{}',
    opener_short TEXT NOT NULL,
    opener_medium TEXT NOT NULL,
    person_name VARCHAR(255),
    angles JSONB NOT NULL DEFAULT '[]',
    narrative JSONB NOT NULL DEFAULT '[]',
    status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'saved', 'contacted', 'skip')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leads_user_id ON leads(user_id);
CREATE INDEX idx_leads_date ON leads(user_id, date DESC);
CREATE INDEX idx_leads_domain ON leads(domain);
CREATE INDEX idx_leads_status ON leads(user_id, status);
CREATE INDEX idx_leads_score ON leads(user_id, score DESC);

-- Signal Runs (pipeline execution tracking)
CREATE TABLE signal_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mode VARCHAR(20) NOT NULL CHECK (mode IN ('hunt', 'watch')),
    list_id UUID REFERENCES lists(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
    stats JSONB,
    error TEXT
);

CREATE INDEX idx_signal_runs_user_id ON signal_runs(user_id);
CREATE INDEX idx_signal_runs_status ON signal_runs(status);

-- Do Not Contact List
CREATE TABLE do_not_contact (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('company', 'domain', 'person')),
    value VARCHAR(255) NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, type, value)
);

CREATE INDEX idx_dnc_user_id ON do_not_contact(user_id);
CREATE INDEX idx_dnc_value ON do_not_contact(user_id, type, value);

-- Evidence Store (cached evidence for dedup and reference)
CREATE TABLE evidence_store (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id UUID REFERENCES signal_runs(id) ON DELETE CASCADE,
    domain VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    title TEXT,
    snippet TEXT,
    source_type VARCHAR(50) NOT NULL,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    hash VARCHAR(64) NOT NULL,
    UNIQUE(run_id, hash)
);

CREATE INDEX idx_evidence_store_run_id ON evidence_store(run_id);
CREATE INDEX idx_evidence_store_domain ON evidence_store(domain);
CREATE INDEX idx_evidence_store_hash ON evidence_store(hash);

-- Domain History (for dedup within 30 days)
CREATE TABLE domain_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    domain VARCHAR(255) NOT NULL,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    times_seen INTEGER NOT NULL DEFAULT 1,
    UNIQUE(user_id, domain)
);

CREATE INDEX idx_domain_history_user ON domain_history(user_id, domain);
CREATE INDEX idx_domain_history_seen ON domain_history(user_id, last_seen_at);

-- ===========================================
-- Row Level Security Policies
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE user_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE do_not_contact ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_store ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_history ENABLE ROW LEVEL SECURITY;

-- User Configs: Users can only access their own configs
CREATE POLICY "Users can view own configs" ON user_configs
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own configs" ON user_configs
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own configs" ON user_configs
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own configs" ON user_configs
    FOR DELETE USING (auth.uid() = user_id);

-- Lists: Users can only access their own lists
CREATE POLICY "Users can view own lists" ON lists
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own lists" ON lists
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own lists" ON lists
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own lists" ON lists
    FOR DELETE USING (auth.uid() = user_id);

-- List Accounts: Users can access accounts in their own lists
CREATE POLICY "Users can view accounts in own lists" ON list_accounts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lists WHERE lists.id = list_accounts.list_id AND lists.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can insert accounts in own lists" ON list_accounts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM lists WHERE lists.id = list_accounts.list_id AND lists.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can update accounts in own lists" ON list_accounts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM lists WHERE lists.id = list_accounts.list_id AND lists.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can delete accounts in own lists" ON list_accounts
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM lists WHERE lists.id = list_accounts.list_id AND lists.user_id = auth.uid()
        )
    );

-- Leads: Users can only access their own leads
CREATE POLICY "Users can view own leads" ON leads
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own leads" ON leads
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own leads" ON leads
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own leads" ON leads
    FOR DELETE USING (auth.uid() = user_id);

-- Signal Runs: Users can only access their own runs
CREATE POLICY "Users can view own signal runs" ON signal_runs
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own signal runs" ON signal_runs
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own signal runs" ON signal_runs
    FOR UPDATE USING (auth.uid() = user_id);

-- Do Not Contact: Users can only access their own DNC list
CREATE POLICY "Users can view own DNC" ON do_not_contact
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own DNC" ON do_not_contact
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own DNC" ON do_not_contact
    FOR DELETE USING (auth.uid() = user_id);

-- Evidence Store: Users can access evidence from their own runs
CREATE POLICY "Users can view evidence from own runs" ON evidence_store
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM signal_runs WHERE signal_runs.id = evidence_store.run_id AND signal_runs.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can insert evidence for own runs" ON evidence_store
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM signal_runs WHERE signal_runs.id = evidence_store.run_id AND signal_runs.user_id = auth.uid()
        )
    );

-- Domain History: Users can only access their own history
CREATE POLICY "Users can view own domain history" ON domain_history
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own domain history" ON domain_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own domain history" ON domain_history
    FOR UPDATE USING (auth.uid() = user_id);

-- ===========================================
-- Functions
-- ===========================================

-- Function to get latest user config
CREATE OR REPLACE FUNCTION get_latest_user_config(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (
        SELECT config
        FROM user_configs
        WHERE user_id = p_user_id
        ORDER BY version DESC
        LIMIT 1
    );
END;
$$;

-- Function to check if domain was seen recently
CREATE OR REPLACE FUNCTION was_domain_seen_recently(p_user_id UUID, p_domain VARCHAR, p_days INTEGER DEFAULT 30)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM domain_history
        WHERE user_id = p_user_id
          AND domain = p_domain
          AND last_seen_at > NOW() - (p_days || ' days')::INTERVAL
    );
END;
$$;

-- Function to upsert domain history
CREATE OR REPLACE FUNCTION upsert_domain_history(p_user_id UUID, p_domain VARCHAR)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO domain_history (user_id, domain, last_seen_at, times_seen)
    VALUES (p_user_id, p_domain, NOW(), 1)
    ON CONFLICT (user_id, domain)
    DO UPDATE SET
        last_seen_at = NOW(),
        times_seen = domain_history.times_seen + 1;
END;
$$;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_user_configs_updated_at
    BEFORE UPDATE ON user_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lists_updated_at
    BEFORE UPDATE ON lists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
