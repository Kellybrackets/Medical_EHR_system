
-- ========================================
-- CONSULTATION FLOW FUNCTIONS
-- ========================================

-- Drop existing functions first to handle return type changes
DROP FUNCTION IF EXISTS start_consultation(uuid, uuid);
DROP FUNCTION IF EXISTS complete_consultation(uuid, uuid);

-- Function to start a consultation
CREATE OR REPLACE FUNCTION start_consultation(
    p_patient_id UUID,
    p_doctor_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_patient_exists BOOLEAN;
BEGIN
    -- Check if patient exists
    SELECT EXISTS(SELECT 1 FROM patients WHERE id = p_patient_id) INTO v_patient_exists;
    IF NOT v_patient_exists THEN
        RETURN jsonb_build_object('success', false, 'error', 'Patient not found');
    END IF;

    -- Update patient status
    UPDATE patients 
    SET 
        consultation_status = 'in_consultation',
        current_doctor_id = p_doctor_id,
        last_status_change = NOW(),
        updated_at = NOW()
    WHERE id = p_patient_id;

    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete a consultation
CREATE OR REPLACE FUNCTION complete_consultation(
    p_patient_id UUID,
    p_doctor_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_patient_exists BOOLEAN;
BEGIN
    -- Check if patient exists
    SELECT EXISTS(SELECT 1 FROM patients WHERE id = p_patient_id) INTO v_patient_exists;
    IF NOT v_patient_exists THEN
        RETURN jsonb_build_object('success', false, 'error', 'Patient not found');
    END IF;

    -- Update patient status
    UPDATE patients 
    SET 
        consultation_status = 'served',
        -- We keep the doctor ID for record of who served them today, 
        -- or we can clear it. Requirements usually imply keeping track or clearing.
        -- Clearing it for 'current' status usually makes sense, but let's keep it null to indicate 'no active doctor'.
        current_doctor_id = NULL,
        last_status_change = NOW(),
        updated_at = NOW()
    WHERE id = p_patient_id;

    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION start_consultation(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_consultation(UUID, UUID) TO authenticated;
