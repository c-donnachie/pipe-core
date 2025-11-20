-- =====================================================
-- SEED: 002_demo_menu.sql
-- TABLEFLOW MVP - Menú de demo para Pizzería Italiana
-- =====================================================

-- Usar el tenant_id de la Pizzería Italiana
-- tenant_id: '550e8400-e29b-41d4-a716-446655440001'

-- Insertar categorías del menú
INSERT INTO categories (
    id,
    tenant_id,
    name,
    description,
    icon_url,
    display_order,
    is_active
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440020',
    '550e8400-e29b-41d4-a716-446655440001',
    'Pizzas',
    'Deliciosas pizzas artesanales con ingredientes frescos',
    'https://example.com/icons/pizza.png',
    1,
    true
),
(
    '550e8400-e29b-41d4-a716-446655440021',
    '550e8400-e29b-41d4-a716-446655440001',
    'Pastas',
    'Pastas caseras con salsas tradicionales italianas',
    'https://example.com/icons/pasta.png',
    2,
    true
),
(
    '550e8400-e29b-41d4-a716-446655440022',
    '550e8400-e29b-41d4-a716-446655440001',
    'Ensaladas',
    'Ensaladas frescas y saludables',
    'https://example.com/icons/salad.png',
    3,
    true
),
(
    '550e8400-e29b-41d4-a716-446655440023',
    '550e8400-e29b-41d4-a716-446655440001',
    'Bebidas',
    'Bebidas refrescantes y vinos italianos',
    'https://example.com/icons/drinks.png',
    4,
    true
),
(
    '550e8400-e29b-41d4-a716-446655440024',
    '550e8400-e29b-41d4-a716-446655440001',
    'Postres',
    'Postres tradicionales italianos',
    'https://example.com/icons/desserts.png',
    5,
    true
);

-- Insertar productos - PIZZAS
INSERT INTO products (
    id,
    tenant_id,
    category_id,
    name,
    description,
    image_url,
    price,
    discount_price,
    preparation_time,
    is_available,
    track_inventory,
    tags
) VALUES 
-- Pizzas clásicas
(
    '550e8400-e29b-41d4-a716-446655440025',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440020',
    'Margherita',
    'Pizza clásica con tomate, mozzarella y albahaca fresca',
    'https://example.com/products/margherita.jpg',
    8990.00,
    null,
    20,
    true,
    false,
    '{"vegetarian": true, "popular": true, "classic": true}'
),
(
    '550e8400-e29b-41d4-a716-446655440026',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440020',
    'Pepperoni',
    'Pizza con pepperoni, mozzarella y salsa de tomate',
    'https://example.com/products/pepperoni.jpg',
    10990.00,
    9990.00,
    20,
    true,
    false,
    '{"popular": true, "meat": true, "spicy": false}'
),
(
    '550e8400-e29b-41d4-a716-446655440027',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440020',
    'Cuatro Quesos',
    'Pizza con mozzarella, gorgonzola, parmesano y ricotta',
    'https://example.com/products/cuatro-quesos.jpg',
    11990.00,
    null,
    25,
    true,
    false,
    '{"vegetarian": true, "cheese": true, "popular": true}'
),
(
    '550e8400-e29b-41d4-a716-446655440028',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440020',
    'Hawaiana',
    'Pizza con jamón, piña, mozzarella y salsa de tomate',
    'https://example.com/products/hawaiana.jpg',
    11990.00,
    null,
    20,
    true,
    false,
    '{"sweet": true, "meat": true, "tropical": true}'
),
(
    '550e8400-e29b-41d4-a716-446655440029',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440020',
    'Diavola',
    'Pizza picante con salami, mozzarella y chile',
    'https://example.com/products/diavola.jpg',
    12490.00,
    null,
    25,
    true,
    false,
    '{"spicy": true, "meat": true, "hot": true}'
),
(
    '550e8400-e29b-41d4-a716-446655440030',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440020',
    'Vegetariana',
    'Pizza con tomate, mozzarella, pimientos, cebolla y champiñones',
    'https://example.com/products/vegetariana.jpg',
    10990.00,
    null,
    20,
    true,
    false,
    '{"vegetarian": true, "healthy": true, "vegetables": true}'
);

-- Insertar variantes de pizzas (tamaños)
INSERT INTO product_variants (
    id,
    product_id,
    name,
    price_modifier,
    is_available
) VALUES 
-- Variantes para Margherita
(
    '550e8400-e29b-41d4-a716-446655440031',
    '550e8400-e29b-41d4-a716-446655440025',
    'Personal (8")',
    0.00,
    true
),
(
    '550e8400-e29b-41d4-a716-446655440032',
    '550e8400-e29b-41d4-a716-446655440025',
    'Mediana (12")',
    3000.00,
    true
),
(
    '550e8400-e29b-41d4-a716-446655440033',
    '550e8400-e29b-41d4-a716-446655440025',
    'Familiar (16")',
    6000.00,
    true
),
-- Variantes para Pepperoni
(
    '550e8400-e29b-41d4-a716-446655440034',
    '550e8400-e29b-41d4-a716-446655440026',
    'Personal (8")',
    0.00,
    true
),
(
    '550e8400-e29b-41d4-a716-446655440035',
    '550e8400-e29b-41d4-a716-446655440026',
    'Mediana (12")',
    3000.00,
    true
),
(
    '550e8400-e29b-41d4-a716-446655440036',
    '550e8400-e29b-41d4-a716-446655440026',
    'Familiar (16")',
    6000.00,
    true
),
-- Variantes para Cuatro Quesos
(
    '550e8400-e29b-41d4-a716-446655440037',
    '550e8400-e29b-41d4-a716-446655440027',
    'Personal (8")',
    0.00,
    true
),
(
    '550e8400-e29b-41d4-a716-446655440038',
    '550e8400-e29b-41d4-a716-446655440027',
    'Mediana (12")',
    3000.00,
    true
),
(
    '550e8400-e29b-41d4-a716-446655440039',
    '550e8400-e29b-41d4-a716-446655440027',
    'Familiar (16")',
    6000.00,
    true
);

-- Insertar modificadores para pizzas (extras)
INSERT INTO product_modifiers (
    id,
    product_id,
    name,
    price,
    is_required,
    max_selections,
    is_available
) VALUES 
-- Modificadores para todas las pizzas
(
    '550e8400-e29b-41d4-a716-446655440040',
    '550e8400-e29b-41d4-a716-446655440025',
    'Extra Queso',
    1500.00,
    false,
    1,
    true
),
(
    '550e8400-e29b-41d4-a716-446655440041',
    '550e8400-e29b-41d4-a716-446655440025',
    'Extra Pepperoni',
    2000.00,
    false,
    1,
    true
),
(
    '550e8400-e29b-41d4-a716-446655440042',
    '550e8400-e29b-41d4-a716-446655440025',
    'Champiñones Extra',
    1000.00,
    false,
    1,
    true
),
(
    '550e8400-e29b-41d4-a716-446655440043',
    '550e8400-e29b-41d4-a716-446655440025',
    'Orégano',
    0.00,
    false,
    1,
    true
),
(
    '550e8400-e29b-41d4-a716-446655440044',
    '550e8400-e29b-41d4-a716-446655440025',
    'Aceitunas',
    800.00,
    false,
    1,
    true
);

-- Insertar productos - PASTAS
INSERT INTO products (
    id,
    tenant_id,
    category_id,
    name,
    description,
    image_url,
    price,
    discount_price,
    preparation_time,
    is_available,
    track_inventory,
    tags
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440045',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440021',
    'Spaghetti Carbonara',
    'Spaghetti con pancetta, huevo, queso parmesano y pimienta negra',
    'https://example.com/products/carbonara.jpg',
    8990.00,
    null,
    15,
    true,
    false,
    '{"popular": true, "traditional": true, "creamy": true}'
),
(
    '550e8400-e29b-41d4-a716-446655440046',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440021',
    'Fettuccine Alfredo',
    'Fettuccine con salsa cremosa de queso parmesano',
    'https://example.com/products/alfredo.jpg',
    8490.00,
    null,
    12,
    true,
    false,
    '{"vegetarian": true, "creamy": true, "cheese": true}'
),
(
    '550e8400-e29b-41d4-a716-446655440047',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440021',
    'Penne Arrabbiata',
    'Penne con salsa de tomate picante y ajo',
    'https://example.com/products/arrabbiata.jpg',
    7990.00,
    null,
    10,
    true,
    false,
    '{"spicy": true, "vegetarian": true, "tomato": true}'
),
(
    '550e8400-e29b-41d4-a716-446655440048',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440021',
    'Ravioli de Ricotta',
    'Ravioli relleno de ricotta con salsa marinara',
    'https://example.com/products/ravioli.jpg',
    9990.00,
    null,
    18,
    true,
    false,
    '{"vegetarian": true, "stuffed": true, "traditional": true}'
);

-- Insertar productos - ENSALADAS
INSERT INTO products (
    id,
    tenant_id,
    category_id,
    name,
    description,
    image_url,
    price,
    discount_price,
    preparation_time,
    is_available,
    track_inventory,
    tags
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440049',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440022',
    'César',
    'Lechuga, pollo, parmesano, crutones y aderezo césar',
    'https://example.com/products/cesar.jpg',
    6990.00,
    null,
    8,
    true,
    false,
    '{"healthy": true, "popular": true, "protein": true}'
),
(
    '550e8400-e29b-41d4-a716-446655440050',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440022',
    'Mediterránea',
    'Tomate, pepino, aceitunas, queso feta y aderezo de oliva',
    'https://example.com/products/mediterranea.jpg',
    6490.00,
    null,
    6,
    true,
    false,
    '{"vegetarian": true, "healthy": true, "fresh": true}'
),
(
    '550e8400-e29b-41d4-a716-446655440051',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440022',
    'Caprese',
    'Tomate, mozzarella fresca, albahaca y aceite de oliva',
    'https://example.com/products/caprese.jpg',
    5990.00,
    null,
    5,
    true,
    false,
    '{"vegetarian": true, "simple": true, "fresh": true}'
);

-- Insertar productos - BEBIDAS
INSERT INTO products (
    id,
    tenant_id,
    category_id,
    name,
    description,
    image_url,
    price,
    discount_price,
    preparation_time,
    is_available,
    track_inventory,
    tags
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440052',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440023',
    'Coca-Cola',
    'Bebida gaseosa 350ml',
    'https://example.com/products/coca-cola.jpg',
    1500.00,
    null,
    1,
    true,
    true,
    '{"soda": true, "cold": true}'
),
(
    '550e8400-e29b-41d4-a716-446655440053',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440023',
    'Agua Mineral',
    'Agua mineral natural 500ml',
    'https://example.com/products/agua.jpg',
    800.00,
    null,
    1,
    true,
    true,
    '{"water": true, "healthy": true}'
),
(
    '550e8400-e29b-41d4-a716-446655440054',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440023',
    'Vino Tinto Casa',
    'Vino tinto de la casa (copa)',
    'https://example.com/products/vino-tinto.jpg',
    3500.00,
    null,
    1,
    true,
    false,
    '{"wine": true, "alcoholic": true}'
),
(
    '550e8400-e29b-41d4-a716-446655440055',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440023',
    'Limonada Natural',
    'Limonada fresca con menta',
    'https://example.com/products/limonada.jpg',
    2200.00,
    null,
    3,
    true,
    false,
    '{"fresh": true, "natural": true, "cold": true}'
);

-- Insertar productos - POSTRES
INSERT INTO products (
    id,
    tenant_id,
    category_id,
    name,
    description,
    image_url,
    price,
    discount_price,
    preparation_time,
    is_available,
    track_inventory,
    tags
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440056',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440024',
    'Tiramisu',
    'Postre italiano clásico con café y mascarpone',
    'https://example.com/products/tiramisu.jpg',
    3990.00,
    null,
    5,
    true,
    false,
    '{"traditional": true, "coffee": true, "popular": true}'
),
(
    '550e8400-e29b-41d4-a716-446655440057',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440024',
    'Panna Cotta',
    'Postre cremoso de vainilla con frutos rojos',
    'https://example.com/products/panna-cotta.jpg',
    3490.00,
    null,
    5,
    true,
    false,
    '{"creamy": true, "vanilla": true, "fruits": true}'
),
(
    '550e8400-e29b-41d4-a716-446655440058',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440024',
    'Gelato (3 bolas)',
    'Helado artesanal italiano - sabores: vainilla, chocolate, fresa',
    'https://example.com/products/gelato.jpg',
    2990.00,
    null,
    3,
    true,
    false,
    '{"ice-cream": true, "artisanal": true, "cold": true}'
);

-- Insertar algunos pedidos de ejemplo
INSERT INTO orders (
    id,
    tenant_id,
    branch_id,
    customer_id,
    order_number,
    channel,
    status,
    subtotal,
    delivery_fee,
    discount,
    total,
    payment_method,
    payment_status,
    delivery_type,
    delivery_address,
    delivery_notes,
    whatsapp_conversation_id,
    confirmed_at,
    delivered_at
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440059',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440009',
    'TF-20240115-0001',
    'whatsapp',
    'delivered',
    17990.00,
    2000.00,
    0.00,
    19990.00,
    'cash',
    'paid',
    'delivery',
    'Calle Nueva 456, Providencia, Santiago',
    'Tocar timbre 3 veces',
    '550e8400-e29b-41d4-a716-446655440015',
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '1 hour 30 minutes'
),
(
    '550e8400-e29b-41d4-a716-446655440060',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440008',
    'TF-20240112-0002',
    'whatsapp',
    'delivered',
    25990.00,
    2000.00,
    1000.00,
    26990.00,
    'transfer',
    'paid',
    'delivery',
    'Av. Libertador 123, Las Condes, Santiago',
    'Entregar en recepción',
    null,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '2 days 23 hours'
);

-- Insertar items de los pedidos
INSERT INTO order_items (
    id,
    order_id,
    product_id,
    product_variant_id,
    quantity,
    unit_price,
    subtotal,
    notes
) VALUES 
-- Items del pedido TF-20240115-0001 (María)
(
    '550e8400-e29b-41d4-a716-446655440061',
    '550e8400-e29b-41d4-a716-446655440059',
    '550e8400-e29b-41d4-a716-446655440025',
    '550e8400-e29b-41d4-a716-446655440032', -- Mediana
    1,
    11990.00,
    11990.00,
    'Sin albahaca'
),
(
    '550e8400-e29b-41d4-a716-446655440062',
    '550e8400-e29b-41d4-a716-446655440059',
    '550e8400-e29b-41d4-a716-446655440055',
    null,
    1,
    2200.00,
    2200.00,
    null
),
(
    '550e8400-e29b-41d4-a716-446655440063',
    '550e8400-e29b-41d4-a716-446655440059',
    '550e8400-e29b-41d4-a716-446655440056',
    null,
    1,
    3800.00,
    3800.00,
    null
),
-- Items del pedido TF-20240112-0002 (Juan)
(
    '550e8400-e29b-41d4-a716-446655440064',
    '550e8400-e29b-41d4-a716-446655440060',
    '550e8400-e29b-41d4-a716-446655440026',
    '550e8400-e29b-41d4-a716-446655440035', -- Mediana
    1,
    12990.00,
    12990.00,
    'Extra pepperoni'
),
(
    '550e8400-e29b-41d4-a716-446655440065',
    '550e8400-e29b-41d4-a716-446655440060',
    '550e8400-e29b-41d4-a716-446655440045',
    null,
    1,
    8990.00,
    8990.00,
    null
),
(
    '550e8400-e29b-41d4-a716-446655440066',
    '550e8400-e29b-41d4-a716-446655440060',
    '550e8400-e29b-41d4-a716-446655440052',
    null,
    2,
    1500.00,
    3000.00,
    null
),
(
    '550e8400-e29b-41d4-a716-446655440067',
    '550e8400-e29b-41d4-a716-446655440060',
    '550e8400-e29b-41d4-a716-446655440056',
    null,
    1,
    3990.00,
    3990.00,
    null
);

-- Insertar modificadores de los items
INSERT INTO order_item_modifiers (
    id,
    order_item_id,
    modifier_id,
    quantity,
    unit_price
) VALUES 
-- Extra pepperoni para la pizza de Juan
(
    '550e8400-e29b-41d4-a716-446655440068',
    '550e8400-e29b-41d4-a716-446655440064',
    '550e8400-e29b-41d4-a716-446655440041',
    1,
    2000.00
);

-- Insertar historial de estados de pedidos
INSERT INTO order_status_history (
    id,
    order_id,
    status,
    notes,
    changed_by,
    created_at
) VALUES 
-- Historial del pedido TF-20240115-0001
(
    '550e8400-e29b-41d4-a716-446655440069',
    '550e8400-e29b-41d4-a716-446655440059',
    'pending',
    'Pedido recibido via WhatsApp',
    null,
    NOW() - INTERVAL '3 hours'
),
(
    '550e8400-e29b-41d4-a716-446655440070',
    '550e8400-e29b-41d4-a716-446655440059',
    'confirmed',
    'Pedido confirmado por restaurante',
    '550e8400-e29b-41d4-a716-446655440006',
    NOW() - INTERVAL '2 hours 30 minutes'
),
(
    '550e8400-e29b-41d4-a716-446655440071',
    '550e8400-e29b-41d4-a716-446655440059',
    'preparing',
    'Iniciando preparación',
    '550e8400-e29b-41d4-a716-446655440007',
    NOW() - INTERVAL '2 hours 15 minutes'
),
(
    '550e8400-e29b-41d4-a716-446655440072',
    '550e8400-e29b-41d4-a716-446655440059',
    'ready',
    'Pedido listo para entrega',
    '550e8400-e29b-41d4-a716-446655440007',
    NOW() - INTERVAL '1 hour 45 minutes'
),
(
    '550e8400-e29b-41d4-a716-446655440073',
    '550e8400-e29b-41d4-a716-446655440059',
    'delivered',
    'Pedido entregado exitosamente',
    null,
    NOW() - INTERVAL '1 hour 30 minutes'
);

-- Comentarios para documentar el seed
COMMENT ON TABLE categories IS 'Datos de demo: 5 categorías del menú de Pizzería Italiana';
COMMENT ON TABLE products IS 'Datos de demo: 20 productos con precios, descripciones y tags';
COMMENT ON TABLE product_variants IS 'Datos de demo: Variantes de tamaño para pizzas principales';
COMMENT ON TABLE product_modifiers IS 'Datos de demo: Extras disponibles para pizzas';
COMMENT ON TABLE orders IS 'Datos de demo: 2 pedidos completados con diferentes estados';
COMMENT ON TABLE order_items IS 'Datos de demo: Items detallados de los pedidos de ejemplo';
COMMENT ON TABLE order_item_modifiers IS 'Datos de demo: Modificadores aplicados a items específicos';
COMMENT ON TABLE order_status_history IS 'Datos de demo: Historial completo de estados de un pedido';
