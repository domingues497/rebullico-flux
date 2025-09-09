-- Populate payment_methods table with proper enum values and flags
INSERT INTO payment_methods (nome, tipo, exige_bandeira, permite_parcelas) 
SELECT 'Dinheiro', 'DINHEIRO', false, false
WHERE NOT EXISTS (SELECT 1 FROM payment_methods WHERE nome = 'Dinheiro');

INSERT INTO payment_methods (nome, tipo, exige_bandeira, permite_parcelas) 
SELECT 'PIX', 'PIX', false, false
WHERE NOT EXISTS (SELECT 1 FROM payment_methods WHERE nome = 'PIX');

INSERT INTO payment_methods (nome, tipo, exige_bandeira, permite_parcelas) 
SELECT 'Cartão de Débito', 'DEBITO', true, false
WHERE NOT EXISTS (SELECT 1 FROM payment_methods WHERE nome = 'Cartão de Débito');

INSERT INTO payment_methods (nome, tipo, exige_bandeira, permite_parcelas) 
SELECT 'Cartão de Crédito', 'CREDITO', true, true
WHERE NOT EXISTS (SELECT 1 FROM payment_methods WHERE nome = 'Cartão de Crédito');