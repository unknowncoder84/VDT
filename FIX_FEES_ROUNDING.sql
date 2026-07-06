-- Fix all existing fees_quoted values
-- that have floating point errors
UPDATE public.cases
SET fees_quoted = ROUND(fees_quoted::numeric, 2)
WHERE fees_quoted IS NOT NULL;

-- Fix all existing transaction amounts
UPDATE public.transactions
SET amount = ROUND(amount::numeric, 2)
WHERE amount IS NOT NULL;

-- Fix all existing payment amounts
UPDATE public.case_payments
SET amount = ROUND(amount::numeric, 2),
    tds = ROUND(COALESCE(tds, 0)::numeric, 2)
WHERE amount IS NOT NULL;

-- Fix all existing expenses
UPDATE public.expenses
SET amount = ROUND(amount::numeric, 2)
WHERE amount IS NOT NULL;
