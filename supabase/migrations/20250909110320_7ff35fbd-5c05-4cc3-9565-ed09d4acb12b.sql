-- Populate payment_methods table with proper enum values and flags
INSERT INTO payment_methods (nome, tipo, exige_bandeira, permite_parcelas) VALUES
('Dinheiro', 'DINHEIRO', false, false),
('PIX', 'PIX', false, false),
('Cartão de Débito', 'DEBITO', true, false),
('Cartão de Crédito', 'CREDITO', true, true)
ON CONFLICT (nome) DO NOTHING;

-- Update acquirer_fees to use proper bandeira values that match payment_type enum
UPDATE acquirer_fees SET bandeira = 'DINHEIRO' WHERE bandeira = 'dinheiro' OR bandeira = 'Dinheiro';
UPDATE acquirer_fees SET bandeira = 'PIX' WHERE bandeira = 'pix' OR bandeira = 'Pix';
UPDATE acquirer_fees SET bandeira = 'DEBITO' WHERE bandeira = 'débito' OR bandeira = 'Débito' OR bandeira = 'debito';
UPDATE acquirer_fees SET bandeira = 'CREDITO' WHERE bandeira = 'crédito' OR bandeira = 'Crédito' OR bandeira = 'credito';