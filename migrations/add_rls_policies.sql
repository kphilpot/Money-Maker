-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users table policies
-- Users can only read their own record
CREATE POLICY "users_can_read_own_data"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Service role can update users (for admin/webhooks)
CREATE POLICY "service_role_can_update_users"
  ON users
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Daily usage policies
-- Users can only read their own usage data
CREATE POLICY "users_can_read_own_usage"
  ON daily_usage
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own usage records
CREATE POLICY "users_can_insert_own_usage"
  ON daily_usage
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own usage records
CREATE POLICY "users_can_update_own_usage"
  ON daily_usage
  FOR UPDATE
  USING (user_id = auth.uid());

-- Audit trail policies
-- Users can only read their own audit trail
CREATE POLICY "users_can_read_own_audit_trail"
  ON audit_trail
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own audit entries
CREATE POLICY "users_can_insert_own_audit"
  ON audit_trail
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Service role can read all audit entries (for admin)
CREATE POLICY "service_role_can_read_all_audit"
  ON audit_trail
  FOR SELECT
  USING (auth.role() = 'service_role');

-- Subscriptions policies
-- Users can only read their own subscription
CREATE POLICY "users_can_read_own_subscription"
  ON subscriptions
  FOR SELECT
  USING (user_id = auth.uid());

-- Service role can manage subscriptions (for webhooks)
CREATE POLICY "service_role_can_manage_subscriptions"
  ON subscriptions
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
