-- Add new value OUTRO to payment_type enum to support custom methods
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'payment_type' AND e.enumlabel = 'OUTRO'
  ) THEN
    ALTER TYPE payment_type ADD VALUE 'OUTRO';
  END IF;
END $$;