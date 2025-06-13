DO $$
BEGIN
    -- Check if column passengerName exists and is NOT NULL
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'Reservation'
        AND column_name = 'passengerName'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE "Reservation" ALTER COLUMN "passengerName" DROP NOT NULL;
    END IF;

    -- Check if column passengerPhone exists and is NOT NULL
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'Reservation'
        AND column_name = 'passengerPhone'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE "Reservation" ALTER COLUMN "passengerPhone" DROP NOT NULL;
    END IF;
END $$;
