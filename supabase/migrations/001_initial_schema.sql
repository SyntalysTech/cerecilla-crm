-- CerecillaCRM Database Schema
-- Migration: 001_initial_schema
-- Description: Initial database schema with email_templates and emails tables
-- Date: 2025-01-XX

-- ============================================
-- TABLE: email_templates
-- ============================================
-- Stores email templates that can be used to send emails

CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    subject TEXT NOT NULL,
    html TEXT NOT NULL,
    text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Index for faster lookups by creator
CREATE INDEX IF NOT EXISTS idx_email_templates_created_by ON public.email_templates(created_by);

-- Index for faster lookups by name
CREATE INDEX IF NOT EXISTS idx_email_templates_name ON public.email_templates(name);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only manage their own templates
CREATE POLICY "Users can view own templates"
    ON public.email_templates
    FOR SELECT
    USING (auth.uid() = created_by);

CREATE POLICY "Users can insert own templates"
    ON public.email_templates
    FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own templates"
    ON public.email_templates
    FOR UPDATE
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete own templates"
    ON public.email_templates
    FOR DELETE
    USING (auth.uid() = created_by);

-- ============================================
-- TABLE: emails
-- ============================================
-- Stores sent email records

CREATE TYPE public.email_status AS ENUM ('queued', 'sent', 'failed');

CREATE TABLE IF NOT EXISTS public.emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    to_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
    status public.email_status NOT NULL DEFAULT 'queued',
    provider TEXT NOT NULL DEFAULT 'ses',
    provider_message_id TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Index for faster lookups by creator
CREATE INDEX IF NOT EXISTS idx_emails_created_by ON public.emails(created_by);

-- Index for faster lookups by status
CREATE INDEX IF NOT EXISTS idx_emails_status ON public.emails(status);

-- Index for faster lookups by template
CREATE INDEX IF NOT EXISTS idx_emails_template_id ON public.emails(template_id);

-- Index for faster lookups by date
CREATE INDEX IF NOT EXISTS idx_emails_created_at ON public.emails(created_at DESC);

-- Enable RLS
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only manage their own emails
CREATE POLICY "Users can view own emails"
    ON public.emails
    FOR SELECT
    USING (auth.uid() = created_by);

CREATE POLICY "Users can insert own emails"
    ON public.emails
    FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own emails"
    ON public.emails
    FOR UPDATE
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

-- Note: Generally, emails should not be deleted, but adding policy for completeness
CREATE POLICY "Users can delete own emails"
    ON public.emails
    FOR DELETE
    USING (auth.uid() = created_by);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on email_templates
CREATE TRIGGER set_email_templates_updated_at
    BEFORE UPDATE ON public.email_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- GRANTS
-- ============================================

-- Grant access to authenticated users
GRANT ALL ON public.email_templates TO authenticated;
GRANT ALL ON public.emails TO authenticated;
